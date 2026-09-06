"""
FastAPI REST backend for Karmayogi Statistical Intelligence (KSI) - MoSPI / SIH26101.
Reuses verified SQLite persistence, L2 vector gap algorithms, and local Ollama MCQ synthesis.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Optional

# Ensure root directory is in sys.path for direct imports of db, engine, and models
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import db
import engine
from models import BLOOM_LEVELS, OfficerProfile, SynthesizedMCQ, iGOTCourse

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
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

# Enable CORS Middleware allowing origins: ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
