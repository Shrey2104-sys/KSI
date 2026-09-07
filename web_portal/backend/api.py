"""
FastAPI REST backend for Karmayogi Statistical Intelligence (KSI) - MoSPI / SIH26101.
Reuses verified SQLite persistence, L2 vector gap algorithms, and local Ollama MCQ synthesis.
"""

from __future__ import annotations

import hashlib
import json
import sys
import time
from pathlib import Path
from typing import Any, Optional

import fitz  # PyMuPDF
import httpx

# Ensure root directory is in sys.path for direct imports of db, engine, and models
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import db
import engine
from models import BLOOM_LEVELS, OfficerProfile, SynthesizedMCQ, iGOTCourse

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ==============================================================================
# FASTAPI APP & CORS CONFIGURATION
# ==============================================================================

app = FastAPI(
    title="Karmayogi Statistical Intelligence API",
    description="Backend API for MoSPI Subordinate Statistical Service competency mapping and iGOT recommendation engine.",
    version="1.0.0",
)

# Enable CORS Middleware for dev environments and preview deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache for deterministic context quiz responses
QUIZ_CACHE: dict[str, dict[str, Any]] = {}


# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================

class UpdateScoresRequest(BaseModel):
    scores: dict[str, int] = Field(..., description="Mapping of domain names to integer competency scores (0-100)")


class ComputeGapRequest(BaseModel):
    current_scores: dict[str, int] = Field(..., description="Current officer scores across competency domains")
    benchmark_scores: dict[str, int] = Field(..., description="Target role benchmark scores across domains")


class InferDossierRequest(BaseModel):
    dossier_text: str = Field(..., description="Full text of administrative cadre dossier")


class EnrollCourseRequest(BaseModel):
    course_id: str = Field(..., description="iGOT Course identifier to enroll in")


class QuizQuestion(BaseModel):
    id: str = Field(..., description="Question identifier, e.g. KSI-001")
    level: str = Field(..., description="Bloom Taxonomy level: Level 1: Recall, Level 2: Conceptual Analysis, Level 3: Procedural Application")
    domain: str = Field(..., description="Operational Domain")
    question: str = Field(..., description="Question stem")
    options: list[str] = Field(..., description="Exactly 4 multiple choice options")
    correctIndex: int = Field(..., ge=0, le=3, description="0-indexed position of the correct option")
    citation: str = Field(..., description="Statutory citation or reference from source document")


class QuizResponse(BaseModel):
    questions: list[QuizQuestion]


# ==============================================================================
# OBSERVABLE PDF-TO-QUIZ INFERENCE PIPELINE (PRIORITY 2 & 3)
# ==============================================================================

async def handle_generate_quiz(
    file: UploadFile = File(...),
    bypass_cache: bool = Query(False),
) -> dict[str, Any]:
    """
    Ingests official PDF, extracts text via PyMuPDF, validates character count,
    slices first 4,500 characters, and prompts local Ollama (qwen2.5:7b-instruct)
    in JSON mode to synthesize 3 Bloom-tiered evaluation questions.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="PDF Text Extraction Failed: Invalid file format. Only .pdf documents are supported.",
        )

    try:
        pdf_bytes = await file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages_text: list[str] = []
        for page in doc:
            t = page.get_text()
            if t:
                pages_text.append(t)
        doc.close()
        clean_text = " ".join(" ".join(pages_text).split())
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"PDF Text Extraction Failed: Could not parse PDF binary stream ({str(exc)}).",
        )

    if len(clean_text) < 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="PDF Text Extraction Failed: Insufficient parseable text found. Document may be a scanned image requiring OCR.",
        )

    context = clean_text[:4500]
    cache_key = hashlib.sha256(context.encode("utf-8")).hexdigest()

    if not bypass_cache and cache_key in QUIZ_CACHE:
        return QUIZ_CACHE[cache_key]

    nonce_suffix = f"\n\n[Bypass Cache Nonce: {time.time_ns()}]" if bypass_cache else ""

    system_prompt = (
        "You are an expert psychometrician and statistical evaluator for the Ministry of Statistics and Programme Implementation (MoSPI), Government of India.\n"
        "Your objective is to generate an authentic statutory assessment quiz directly from the provided official compendium or circular text.\n"
        "You must return ONLY valid JSON matching this exact schema:\n"
        "{\n"
        '  "questions": [\n'
        "    {\n"
        '      "id": "KSI-001",\n'
        '      "level": "Level 1: Recall",\n'
        '      "domain": "Statistical Theory & National Accounts",\n'
        '      "question": "Question text...",\n'
        '      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
        '      "correctIndex": 0,\n'
        '      "citation": "Statutory citation..."\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "STRICT RULES:\n"
        "1. You MUST generate EXACTLY 3 questions, each corresponding to one Bloom Taxonomy tier:\n"
        "   - Question 1: 'Level 1: Recall' (Statutory Recall of definitions, base years, or legal mandates)\n"
        "   - Question 2: 'Level 2: Conceptual Analysis' (Comparative reasoning, formula mechanisms, or methodological differentiation)\n"
        "   - Question 3: 'Level 3: Procedural Application' (Real-world statistical officer application, deflation, survey sampling, or classification scenario)\n"
        "2. Each question MUST have EXACTLY 4 distinct options.\n"
        "3. 'correctIndex' MUST be an integer between 0 and 3 indexing the correct option in 'options'.\n"
        "4. 'citation' MUST provide an explicit statutory clause, manual reference, or exact textual justification from the context.\n"
        "5. Return ONLY the JSON object with key 'questions'. No commentary or markdown formatting outside JSON."
    )

    full_prompt = (
        f"{system_prompt}\n\n"
        f"Official Document Context (first 4,500 chars):\n{context}{nonce_suffix}\n\n"
        "Generate exactly 3 Bloom-tiered questions strictly conforming to the JSON schema."
    )

    ollama_payload = {
        "model": "qwen2.5:7b-instruct",
        "prompt": full_prompt,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.25,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            resp = await client.post("http://localhost:11434/api/generate", json=ollama_payload)
    except httpx.ConnectError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Local Ollama service unreachable at localhost:11434",
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Inference engine timed out after 180s",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Inference communication error: {str(exc)}",
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ollama inference returned non-200 status code {resp.status_code}: {resp.text[:200]}",
        )

    try:
        res_data = resp.json()
        raw_text_out = res_data.get("response", "").strip()
        if raw_text_out.startswith("```"):
            lines = raw_text_out.splitlines()
            raw_text_out = "\n".join([l for l in lines if not l.startswith("```")])
        parsed_json = json.loads(raw_text_out)
        if isinstance(parsed_json, list):
            parsed_json = {"questions": parsed_json}
        elif isinstance(parsed_json, dict) and "questions" not in parsed_json:
            for val in parsed_json.values():
                if isinstance(val, list) and len(val) == 3:
                    parsed_json = {"questions": val}
                    break

        # Normalize questions list to enforce exactly 4 options per question
        if isinstance(parsed_json, dict) and "questions" in parsed_json and isinstance(parsed_json["questions"], list):
            for q in parsed_json["questions"]:
                if isinstance(q, dict) and "options" in q and isinstance(q["options"], list):
                    if len(q["options"]) > 4:
                        q["options"] = q["options"][:4]
                    if q.get("correctIndex", 0) >= 4:
                        q["correctIndex"] = 3

        quiz_obj = QuizResponse(**parsed_json)
        if len(quiz_obj.questions) != 3:
            raise ValueError(f"Expected exactly 3 Bloom-tiered questions, received {len(quiz_obj.questions)}")
        for idx, q in enumerate(quiz_obj.questions):
            if len(q.options) != 4:
                raise ValueError(f"Question {idx + 1} ({q.id}) must have exactly 4 options, found {len(q.options)}")
            if not (0 <= q.correctIndex <= 3):
                raise ValueError(f"Question {idx + 1} ({q.id}) correctIndex {q.correctIndex} is out of bounds [0-3]")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Inference output schema validation failed: {str(exc)}",
        )

    result_dict = quiz_obj.model_dump()
    QUIZ_CACHE[cache_key] = result_dict
    return result_dict


@app.post("/generate-quiz")
async def generate_quiz_root(
    file: UploadFile = File(...),
    bypass_cache: bool = Query(False),
) -> dict[str, Any]:
    return await handle_generate_quiz(file=file, bypass_cache=bypass_cache)


@app.post("/api/generate-quiz")
async def generate_quiz_api(
    file: UploadFile = File(...),
    bypass_cache: bool = Query(False),
) -> dict[str, Any]:
    return await handle_generate_quiz(file=file, bypass_cache=bypass_cache)


# ==============================================================================
# REST ENDPOINTS
# ==============================================================================

@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Health check endpoint for service monitoring."""
    return {"status": "healthy", "service": "KSI Backend API", "version": "1.0.0"}


@app.get("/api/officer/{officer_id}")
def get_officer_profile(officer_id: str) -> dict[str, Any]:
    """
    Retrieve profile, verified scores, and enrolled courses for an officer.
    Returns 404 if the officer is not found.
    """
    officer = db.get_officer(officer_id)
    if not officer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Officer with ID '{officer_id}' not found",
        )

    return {
        "officer_id": officer.officer_id,
        "name": officer.name,
        "cadre": officer.cadre,
        "designation": officer.designation,
        "division": officer.division,
        "scores": officer.scores,
        "completed_courses": officer.completed_courses,
    }


@app.post("/api/officer/{officer_id}/scores")
def update_officer_scores(officer_id: str, payload: UpdateScoresRequest) -> dict[str, Any]:
    """
    Update competency scores for an officer in SQLite and commit immediately.
    """
    officer = db.get_officer(officer_id)
    if not officer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Officer with ID '{officer_id}' not found",
        )

    db.update_officer_scores(officer_id, payload.scores)
    updated_officer = db.get_officer(officer_id)

    return {
        "status": "success",
        "message": f"Scores persisted to SQLite disk for officer '{officer_id}'",
        "scores": updated_officer.scores if updated_officer else payload.scores,
    }


@app.post("/api/officer/{officer_id}/enroll")
def enroll_officer_course(officer_id: str, payload: EnrollCourseRequest) -> dict[str, Any]:
    """
    Enroll an officer in an iGOT course and persist into SQLite.
    """
    officer = db.get_officer(officer_id)
    if not officer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Officer with ID '{officer_id}' not found",
        )

    db.enroll_officer_course(officer_id, payload.course_id)
    updated = db.get_officer(officer_id)

    return {
        "status": "success",
        "message": f"Enrolled in course '{payload.course_id}'",
        "completed_courses": updated.completed_courses if updated else [],
    }


@app.get("/api/benchmarks/{role_name}")
def get_benchmarks(role_name: str) -> dict[str, Any]:
    """
    Retrieve statutory competency benchmarks for a given cadre role.
    """
    benchmarks = db.get_role_benchmark(role_name)
    if not benchmarks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No benchmarks found for role '{role_name}'",
        )

    return {
        "role_name": role_name,
        "benchmarks": benchmarks,
    }


@app.post("/api/compute-gap")
def compute_gap(payload: ComputeGapRequest) -> dict[str, Any]:
    """
    Calculate scalar and L2 Euclidean competency gap matrix and return prioritized iGOT course recommendations.
    """
    gap_matrix, l2_deficit, recommendations = engine.calculate_vector_competency_gap(
        payload.current_scores,
        payload.benchmark_scores,
    )

    return {
        "gap_matrix": gap_matrix,
        "l2_deficit": l2_deficit,
        "recommendations": recommendations,
    }


@app.post("/api/infer-dossier")
def infer_dossier(payload: InferDossierRequest) -> dict[str, Any]:
    """
    Infer officer competency vector from administrative dossier text using local Ollama LLM or precomputed MD5 cache.
    """
    inferred_scores = engine.infer_competency_from_dossier(payload.dossier_text)
    return {
        "status": "success",
        "inferred_scores": inferred_scores,
    }


@app.post("/api/synthesize-mcqs")
async def synthesize_mcqs(
    pdf_file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
) -> list[dict[str, Any]]:
    """
    Accepts multipart PDF file upload OR raw form string.
    Extracts text using PyMuPDF and synthesizes psychometric MCQs across Bloom's Taxonomy.
    """
    source_text: str = ""

    if pdf_file and pdf_file.filename:
        try:
            pdf_bytes = await pdf_file.read()
            extracted = engine.extract_text_from_pdf(pdf_bytes)
            source_text = extracted if extracted.strip() else db.SAMPLE_STATISTICAL_MANUAL
        except Exception as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to extract text from uploaded PDF: {str(err)}",
            )
    elif raw_text and raw_text.strip():
        source_text = raw_text.strip()
    else:
        source_text = db.SAMPLE_STATISTICAL_MANUAL

    mcqs: list[SynthesizedMCQ] = engine.synthesize_mcqs_from_document(source_text)

    return [
        {
            "question_id": q.question_id,
            "stem": q.stem,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "rationale": q.rationale,
            "bloom_level": q.bloom_level,
        }
        for q in mcqs
    ]


@app.get("/api/telemetry")
def get_telemetry() -> dict[str, Any]:
    """
    Retrieve cadre telemetry metrics and calculate macro administrative KPIs.
    """
    telemetry_df = db.get_cadre_analytics()
    records = telemetry_df.to_dict(orient="records")

    domain_col_map = {
        "statistical_theory": "Statistical Theory & National Accounts",
        "technical_tools": "Technical Tools (Python, R, SQL, GIS)",
        "data_privacy": "Digital Governance & Data Privacy",
        "managerial": "Managerial & Public Decision Making",
    }
    domain_means = {
        name: float(telemetry_df[col].mean())
        for col, name in domain_col_map.items()
    }
    critical_domain = min(domain_means, key=domain_means.get)

    sso_benchmark = db.get_role_benchmark("Senior Statistical Officer (SSO)")
    attainment_ratios = [
        (domain_means[d] / sso_benchmark[d]) * 100
        for d in domain_means
        if d in sso_benchmark and sso_benchmark[d] > 0
    ]
    avg_attainment = round(sum(attainment_ratios) / len(attainment_ratios), 2) if attainment_ratios else 0.0

    return {
        "records": records,
        "kpis": {
            "directorates_tracked": len(telemetry_df),
            "mean_igot_hours": round(float(telemetry_df["avg_igot_hours"].mean()), 2),
            "critical_domain_deficit": critical_domain,
            "critical_domain_average": round(domain_means[critical_domain], 2),
            "sso_benchmark_attainment_pct": avg_attainment,
        },
    }
