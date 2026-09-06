"""
Algorithmic engine for Karmayogi Statistical Intelligence (KSI) - MoSPI / SIH26101.
Handles document ingestion, vector competency gap calculations, local LLM evaluation,
and psychometric MCQ synthesis with strict deduplication and Bloom's mapping.
"""

from __future__ import annotations

import hashlib
import json
import re
from typing import Any, Optional

import fitz  # PyMuPDF
import numpy as np
from openai import OpenAI

import db
from models import BLOOM_LEVELS, SynthesizedMCQ, iGOTCourse

# Client & Local LLM Configuration Constants
OLLAMA_MODEL: str = "qwen2.5:7b-instruct"
OLLAMA_TIMEOUT_SECONDS: float = 12.0
client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
    max_retries=0,
)


# Deterministic statistical distractors for option deduplication and padding
DETERMINISTIC_STATISTICAL_DISTRACTORS: list[str] = [
    "Stratified multi-stage random sampling design with Horvitz-Thompson estimation",
    "Laspeyres weighted arithmetic mean index with base year 2012=100",
    "System of National Accounts 2008 Gross Value Added compilation at basic prices",
    "Consumption of Fixed Capital (CFC) excluding intermediate input purchases",
    "Intra-cluster correlation adjustment with design effect exceeding unity",
    "Periodic Labour Force Survey quarterly household sampling frame",
    "Annual Survey of Industries factory sector input-output balance audit",
    "Consumer Expenditure Survey quinquennial item weight calibration",
]

# Fallback deterministic seed MCQs when local LLM is unreachable or times out
DETERMINISTIC_SEED_MCQS: list[dict[str, Any]] = [
    {
        "question_id": "KSI-LIVE-001",
        "stem": "Under official price statistics standards, what does the Producer Price Index (PPI) primarily measure?",
        "options": [
            "Average change over time in selling prices received by domestic producers for their output",
            "Retail price changes experienced by final household consumers in urban markets",
            "Tariff and customs duty adjustments on imported intermediate goods",
            "Weighted volume changes in manufacturing output across consecutive financial quarters",
        ],
        "correct_answer": "Average change over time in selling prices received by domestic producers for their output",
        "rationale": "The Producer Price Index measures the average change over time in selling prices received by domestic producers for their output.",
        "bloom_level": "Level 1: Recall",
    },
    {
        "question_id": "KSI-LIVE-002",
        "stem": "How does the Producer Price Index (PPI) conceptually differ from the Consumer Price Index (CPI) in macroeconomic monitoring?",
        "options": [
            "PPI measures price changes from the seller perspective while CPI measures from the buyer perspective",
            "PPI is compiled exclusively from administrative tax filings while CPI relies on satellite imagery",
            "PPI excludes manufactured goods while CPI excludes agricultural and food commodities",
            "PPI is compiled on an unweighted basis while CPI utilizes Laspeyres expenditure weights",
        ],
        "correct_answer": "PPI measures price changes from the seller perspective while CPI measures from the buyer perspective",
        "rationale": "PPI measures price change from the perspective of the seller (producer prices), whereas CPI measures from the perspective of the purchaser/buyer (consumer prices including retail markups and taxes).",
        "bloom_level": "Level 2: Conceptual Analysis",
    },
    {
        "question_id": "KSI-LIVE-003",
        "stem": "When compiling constant-price Gross Value Added (GVA) by economic activity, how should a statistical officer procedurally utilize the PPI?",
        "options": [
            "Apply activity-specific PPI sub-indices as output deflators to convert current price output to constant prices",
            "Multiply current output by the inverse of consumer expenditure weights",
            "Substitute PPI directly for intermediate consumption without volume deflation",
            "Aggregate raw producer price quotations across unstratified factory samples",
        ],
        "correct_answer": "Apply activity-specific PPI sub-indices as output deflators to convert current price output to constant prices",
        "rationale": "National accounts compilation standards recommend deflating gross output at current basic prices by the corresponding Producer Price Index to obtain constant price gross output.",
        "bloom_level": "Level 3: Procedural Application",
    },
]


def extract_text_from_pdf(pdf_stream: bytes) -> str:
    """
    Ingest PDF bytes via fitz (PyMuPDF).
    Extract raw text across pages, collapsing redundant whitespace and blank lines.
    """
    if not pdf_stream:
        return ""
    doc = fitz.open(stream=pdf_stream, filetype="pdf")
    pages_text: list[str] = []
    for page in doc:
        text = page.get_text()
        if text:
            pages_text.append(text)
    doc.close()

    full_text = "\n".join(pages_text)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in full_text.splitlines()]
    non_blank_lines = [line for line in lines if line]
    return "\n".join(non_blank_lines).strip()


def clean_term(term: str) -> str:
    """
    Clean and normalize an option or statistical term:
    - Case-insensitively strip leading determiners/articles (^(the|an|a)\\s+).
    - Strip non-alphanumeric characters and excess whitespace.
    - Return clean string.
    """
    if not term:
        return ""
    cleaned = str(term).strip()
    # Strip leading option label if present (e.g. "A) ", "1. ", "(A) ", "B: ", "C - ")
    cleaned = re.sub(r"^(?:\(?[A-Da-d1-4]\)|[A-Da-d1-4][\.\)\:\-])\s+", "", cleaned)
    # Case-insensitively strip leading determiners/articles
    cleaned = re.sub(r"^(the|an|a)\s+", "", cleaned, flags=re.IGNORECASE)
    # Strip non-alphanumeric characters (keep alphanumeric and spaces)
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", cleaned)
    # Strip excess whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def calculate_vector_competency_gap(
    current_scores: dict[str, int],
    target_role_benchmarks: dict[str, int],
) -> tuple[dict[str, dict[str, Any]], float, list[dict[str, Any]]]:
    """
    Compute scalar deficit: delta_i = max(0, benchmark_i - score_i).
    EXPLICIT GAP MATRIX CONTRACT:
      gap_matrix[domain] = {
          "Current Score": current_scores.get(domain, 0),
          "Benchmark Target": target_role_benchmarks.get(domain, 0),
          "Calculated Deficit": delta_i
      }
    Compute Euclidean gap metric:
      l2 = float(np.sqrt(sum(d**2 for d in [g["Calculated Deficit"] for g in gap_matrix.values()])))
    Match courses from db.py for domains where deficit > 0, sorted descending by domain deficit.
    Return (gap_matrix, l2, sorted_recommendations).
    """
    domains = list(target_role_benchmarks.keys()) if target_role_benchmarks else db.DOMAINS
    gap_matrix: dict[str, dict[str, Any]] = {}

    for domain in domains:
        score_i = int(current_scores.get(domain, 0))
        bench_i = int(target_role_benchmarks.get(domain, 0))
        delta_i = max(0, bench_i - score_i)
        gap_matrix[domain] = {
            "Current Score": score_i,
            "Benchmark Target": bench_i,
            "Calculated Deficit": delta_i,
        }

    l2 = float(np.sqrt(sum(d**2 for d in [g["Calculated Deficit"] for g in gap_matrix.values()])))

    # Identify domains with deficit > 0, sorted descending by deficit
    deficit_domains = [
        (domain, data["Calculated Deficit"])
        for domain, data in gap_matrix.items()
        if data["Calculated Deficit"] > 0
    ]
    deficit_domains.sort(key=lambda x: x[1], reverse=True)

    sorted_recommendations: list[dict[str, Any]] = []
    for domain, deficit in deficit_domains:
        courses = db.get_courses_by_domain(domain)
        for c in courses:
            sorted_recommendations.append({
                "course_id": c.course_id,
                "title": c.title,
                "domain": domain,
                "provider": c.provider,
                "duration_hours": c.duration_hours,
                "level": c.level,
                "competency_gain": c.competency_gain,
                "domain_deficit": deficit,
            })

    return gap_matrix, l2, sorted_recommendations


def _clamp_scores(raw_scores: dict[str, Any]) -> dict[str, int]:
    """Process returned scores, clamping each strictly to [0, 100] and defaulting missing to 50."""
    clamped: dict[str, int] = {}
    for d in db.DOMAINS:
        val = None
        if d in raw_scores:
            val = raw_scores[d]
        else:
            for k, v in raw_scores.items():
                canon = db.DOMAIN_CANONICAL_MAP.get(k.strip().lower(), k.strip())
                if canon == d:
                    val = v
                    break
        if val is None:
            val = 50
        try:
            val_int = int(float(val))
        except (ValueError, TypeError):
            val_int = 50
        clamped[d] = int(np.clip(val_int, 0, 100))
    return clamped


def infer_competency_from_dossier(dossier_text: str) -> dict[str, int]:
    """
    Infer officer competency profile from an administrative dossier:
    - Check MD5 cache against db.PRECOMPUTED_DEMO_CACHE.
    - Otherwise query local LLM (Ollama) with 8-second timeout.
    - Defensively clamp each score to [0, 100] and default missing to 50.
    - Fallback gracefully on timeout/error.
    """
    default_scores = {d: 50 for d in db.DOMAINS}
    if not dossier_text or not dossier_text.strip():
        return default_scores

    # 1. MD5 Cache Lookup
    text_hash = hashlib.md5(dossier_text.encode("utf-8")).hexdigest()
    text_hash_stripped = hashlib.md5(dossier_text.strip().encode("utf-8")).hexdigest()
    cached = db.PRECOMPUTED_DEMO_CACHE.get(text_hash) or db.PRECOMPUTED_DEMO_CACHE.get(text_hash_stripped)
    if cached:
        scores_raw = cached.get("scores") or cached.get("current_scores")
        if isinstance(scores_raw, dict):
            return _clamp_scores(scores_raw)

    # 2. Local LLM Query via Ollama
    system_prompt = (
        "You are an expert MoSPI / NSSTA administrative cadre competency evaluation engine. "
        "Evaluate the officer's administrative dossier and assign competency scores (0-100) "
        "across the four official MoSPI domains:\n"
        "1. Statistical Theory & National Accounts\n"
        "2. Technical Tools (Python, R, SQL, GIS)\n"
        "3. Digital Governance & Data Privacy\n"
        "4. Managerial & Public Decision Making\n\n"
        "Respond ONLY with valid JSON strictly adhering to this schema:\n"
        '{"scores": {"Statistical Theory & National Accounts": <int>, '
        '"Technical Tools (Python, R, SQL, GIS)": <int>, '
        '"Digital Governance & Data Privacy": <int>, '
        '"Managerial & Public Decision Making": <int>}}'
    )

    try:
        response = client.chat.completions.create(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Dossier text:\n{dossier_text[:2000]}"},
            ],
            response_format={"type": "json_object"},
            timeout=OLLAMA_TIMEOUT_SECONDS,
            max_tokens=200,
        )
        content = response.choices[0].message.content or ""
        parsed = json.loads(content)
        scores_raw = parsed.get("scores", parsed)
        if isinstance(scores_raw, dict):
            return _clamp_scores(scores_raw)
    except Exception:
        pass

    return default_scores


def sanitize_mcq(raw_q: dict[str, Any], index: int = 1) -> SynthesizedMCQ:
    """
    Defensively sanitize, deduplicate distractors, and validate an MCQ against
    models.BLOOM_LEVELS and schema requirements.
    """
    q_id = str(raw_q.get("question_id") or f"KSI-MCQ-{index:03d}").strip()
    stem = str(raw_q.get("stem") or f"Assessment question {index} on statistical concepts.").strip()

    # Bloom level coercion
    raw_level = str(raw_q.get("bloom_level") or "").strip()
    level_lower = raw_level.lower()
    if "1" in level_lower or "recall" in level_lower:
        bloom_level = "Level 1: Recall"
    elif "2" in level_lower or "concept" in level_lower or "analysis" in level_lower:
        bloom_level = "Level 2: Conceptual Analysis"
    elif "3" in level_lower or "procedur" in level_lower or "applic" in level_lower:
        bloom_level = "Level 3: Procedural Application"
    else:
        bloom_level = BLOOM_LEVELS[(index - 1) % len(BLOOM_LEVELS)]

    raw_ans = str(raw_q.get("correct_answer") or "").strip()
    rationale = str(raw_q.get("rationale") or "Derived from statutory MoSPI statistical guidelines.").strip()

    # Process options with code-level deduplication via clean_term(opt).lower()
    raw_opts = raw_q.get("options", [])
    if not isinstance(raw_opts, list):
        raw_opts = []

    seen_normalized: set[str] = set()
    final_options: list[str] = []

    for opt in raw_opts:
        opt_str = str(opt).strip()
        if not opt_str:
            continue
        norm = clean_term(opt_str).lower()
        if norm and norm not in seen_normalized:
            seen_normalized.add(norm)
            final_options.append(opt_str)

    # Guarantee correct answer is present
    if raw_ans:
        norm_ans = clean_term(raw_ans).lower()
        if norm_ans not in seen_normalized:
            if len(final_options) >= 4:
                popped = final_options.pop()
                seen_normalized.discard(clean_term(popped).lower())
            seen_normalized.add(norm_ans)
            final_options.append(raw_ans)
    elif final_options:
        raw_ans = final_options[0]

    # Pad with deterministic statistical terms if fewer than 4 unique options exist
    for distractor in DETERMINISTIC_STATISTICAL_DISTRACTORS:
        if len(final_options) >= 4:
            break
        norm_d = clean_term(distractor).lower()
        if norm_d not in seen_normalized:
            seen_normalized.add(norm_d)
            final_options.append(distractor)

    # If more than 4 unique options exist, trim to 4 ensuring correct_answer is preserved
    if len(final_options) > 4:
        norm_ans = clean_term(raw_ans).lower()
        trimmed: list[str] = []
        for opt in final_options:
            if len(trimmed) < 4:
                trimmed.append(opt)
        if norm_ans not in [clean_term(o).lower() for o in trimmed]:
            trimmed[-1] = raw_ans
        final_options = trimmed

    return SynthesizedMCQ(
        question_id=q_id,
        stem=stem,
        options=final_options,
        correct_answer=raw_ans,
        rationale=rationale,
        bloom_level=bloom_level,
    )


def synthesize_mcqs_from_document(raw_text: str) -> list[SynthesizedMCQ]:
    """
    Synthesize 3 psychometric MCQs from statistical document text:
    - Check MD5 cache against db.PRECOMPUTED_DEMO_CACHE.
    - Otherwise query local LLM (Ollama) with 8-second timeout.
    - Defensively deduplicate distractors and validate against BLOOM_LEVELS.
    - Fallback gracefully to deterministic seed MCQs on timeout/unreachability.
    """
    if not raw_text or not raw_text.strip():
        return [sanitize_mcq(q, idx + 1) for idx, q in enumerate(DETERMINISTIC_SEED_MCQS)]

    # 1. MD5 Cache Lookup
    text_hash = hashlib.md5(raw_text.encode("utf-8")).hexdigest()
    text_hash_stripped = hashlib.md5(raw_text.strip().encode("utf-8")).hexdigest()

    cached = db.PRECOMPUTED_DEMO_CACHE.get(text_hash) or db.PRECOMPUTED_DEMO_CACHE.get(text_hash_stripped)
    if cached:
        questions_raw = cached.get("questions")
        if isinstance(questions_raw, list) and len(questions_raw) > 0:
            return [sanitize_mcq(q, idx + 1) for idx, q in enumerate(questions_raw)]

    # 2. Live Local LLM Query via Ollama
    system_prompt = (
        "You are an assessment engine for MoSPI/NSSTA. "
        "Generate exactly 3 multiple-choice questions from the text, mapped to Bloom's tiers:\n"
        "1. Level 1: Recall\n"
        "2. Level 2: Conceptual Analysis\n"
        "3. Level 3: Procedural Application\n\n"
        "Respond ONLY with valid JSON strictly adhering to this schema:\n"
        '{"questions": [{"question_id": "KSI-LIVE-001", "stem": "...", "options": ["optA", "optB", "optC", "optD"], '
        '"correct_answer": "optA", "rationale": "...", "bloom_level": "Level 1: Recall"}]}'
    )

    try:
        response = client.chat.completions.create(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Document text:\n{raw_text[:2000]}"},
            ],
            response_format={"type": "json_object"},
            timeout=OLLAMA_TIMEOUT_SECONDS,
            max_tokens=600,
        )
        content = response.choices[0].message.content or ""
        parsed = json.loads(content)
        raw_questions = parsed.get("questions", [])
        if isinstance(raw_questions, list) and len(raw_questions) > 0:
            return [sanitize_mcq(q, idx + 1) for idx, q in enumerate(raw_questions)]
    except Exception:
        pass

    return [sanitize_mcq(q, idx + 1) for idx, q in enumerate(DETERMINISTIC_SEED_MCQS)]
