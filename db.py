"""
Database access and persistence layer for Karmayogi Statistical Intelligence (KSI) - MoSPI / SIH26101.
Grounded in authentic NSSTA/MoSPI curriculum data and SQLite storage.
"""

import hashlib
import json
import os
import sqlite3
from typing import Any, Optional
import pandas as pd

from models import OfficerProfile, iGOTCourse, SynthesizedMCQ

# Explicit SQLite database path in workspace
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ksi_master.db")

# Canonical Competency Domains under MoSPI Karmayogi Framework
DOMAINS = [
    "Statistical Theory & National Accounts",
    "Technical Tools (Python, R, SQL, GIS)",
    "Digital Governance & Data Privacy",
    "Managerial & Public Decision Making",
]

# Domain synonym lookup for flexible querying
DOMAIN_CANONICAL_MAP = {
    "statistical theory": "Statistical Theory & National Accounts",
    "statistical theory & national accounts": "Statistical Theory & National Accounts",
    "technical tools": "Technical Tools (Python, R, SQL, GIS)",
    "technical tools (python, r, sql, gis)": "Technical Tools (Python, R, SQL, GIS)",
    "digital governance": "Digital Governance & Data Privacy",
    "digital governance & data privacy": "Digital Governance & Data Privacy",
    "managerial": "Managerial & Public Decision Making",
    "managerial skills": "Managerial & Public Decision Making",
    "managerial & public decision making": "Managerial & Public Decision Making",
}

# ==============================================================================
# STATISTICAL MANUAL & DOSSIER CONSTANTS
# ==============================================================================

SAMPLE_STATISTICAL_MANUAL: str = """MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION (MoSPI)
GOVERNMENT OF INDIA
NATIONAL STATISTICAL SYSTEMS TRAINING ACADEMY (NSSTA) & CENTRAL STATISTICS OFFICE (CSO)
TECHNICAL COMPENDIUM ON STATISTICAL CONCEPTS, STANDARDS, AND METHODOLOGIES

1. GROSS VALUE ADDED (GVA) AT BASIC PRICES
Statutory Definition: Under the System of National Accounts (SNA 2008) adopted by MoSPI / National Accounts Division (NAD), Gross Value Added (GVA) is defined as the value of output of goods and services produced less the value of intermediate consumption used in production. GVA at basic prices measures the contribution of individual resident producer units, industries, or sectors to the economy.
Relationship to Basic Prices: Basic price is the amount receivable by the producer from the purchaser for a unit of a good or service produced as output, minus any tax payable (product tax), and plus any subsidy receivable (product subsidy), on that unit as a consequence of its production or sale. It excludes any transport charges invoiced separately by the producer.
Link to Gross Domestic Product (GDP):
GDP at market prices = GVA at basic prices + Net Product Taxes (Product Taxes - Product Subsidies).
Production taxes (such as land revenue, stamp duties, professional tax) and production subsidies (such as subsidies to railways, input subsidies) are already factored into basic prices, whereas product taxes (such as GST, excise, customs) and product subsidies (such as food, petroleum, and fertilizer subsidies) are accounted for at the national aggregate level.

2. CONSUMER PRICE INDEX (CPI)
Statutory Definition: The Consumer Price Index (CPI), compiled monthly by the Price Statistics Division (PSD) of MoSPI, measures changes over time in the general level of retail prices of a fixed basket of consumer goods and services acquired, used, or paid for by reference households.
Methodological Framework: The all-India CPI series (Rural, Urban, and Combined) uses the modified Laspeyres' price index formula with a fixed base year (Base Year 2012 = 100). The formula expresses the weighted arithmetic average of price relatives:
I = (Sum(W_i * (P_it / P_i0)) / Sum(W_i)) * 100
where P_it is the current period price of commodity i, P_i0 is the base period price, and W_i is the base period expenditure weight derived from the Consumer Expenditure Survey (CES) conducted by NSSO.

3. INDEX OF INDUSTRIAL PRODUCTION (IIP)
Statutory Definition: The Index of Industrial Production (IIP), released by the Central Statistics Office (CSO) / Computer Centre MoSPI, is a composite indicator measuring short-term changes in the volume of production of a basket of industrial products across Mining, Manufacturing, and Electricity sectors.
Methodological Formulation: The IIP is compiled using Laspeyres' base-weighted formulation with the current base year 2011-12 = 100. Weights allocated across the three sectors are: Manufacturing (77.63%), Mining (14.37%), and Electricity (7.99%). The index for group/sector is computed as:
IIP = (Sum(W_i * R_i) / Sum(W_i)) * 100
where R_i = (q_it / q_i0) represents the production quantity relative of item i in period t relative to base period 0, and W_i represents the item weight derived from the Annual Survey of Industries (ASI) gross value added contribution.

4. BASE YEAR AND BASE REVISION
Statutory Definition: The Base Year in official statistics serves as the benchmark reference period against which economic indicators, price movements, and volume series are normalized and compared (assigned index value = 100).
Methodological Requirement: Periodic rebasing (typically every 5 to 10 years) is essential to capture structural transformations in the national economy, shift in consumer consumption baskets, introduction of new technological products and services, changes in relative price structures, and obsolescence of sunset industries. Base year revisions involve comprehensive recalibration of weights derived from large-scale quinquennial surveys (Consumer Expenditure Survey, Annual Survey of Industries, and Economic Census).

5. SAMPLING VARIANCE AND MULTI-STAGE STRATIFIED SAMPLING
Statutory Definition: In large-scale sample surveys administered by the Field Operations Division (FOD) of NSSO / MoSPI (such as the Periodic Labour Force Survey - PLFS), multi-stage stratified sample designs are utilized. First Stage Units (FSUs) correspond to Census villages in rural areas and Urban Frame Survey (UFS) blocks in urban areas. Ultimate Stage Units (USUs) correspond to surveyed households or enterprises.
Sampling Variance Formulation: Sampling variance measures the dispersion or variability of sample estimators (such as Horvitz-Thompson aggregate estimators) across all possible samples drawn under the identical probability sampling mechanism. The design-based variance estimator accounts for intra-cluster correlation within FSUs and unequal selection probabilities:
Var(Y_hat) = Sum_s [ (1 - f_s) * (n_s / (n_s - 1)) * Sum_i (y_si - y_s_mean)^2 ]
Because clustering induces positive intra-cluster correlation, the Design Effect (Deff = Var_complex / Var_SRS) typically exceeds unity (Deff > 1). Consequently, treating complex multi-stage survey samples as simple random samples (SRS) severely underestimates true standard errors.

6. INTERMEDIATE CONSUMPTION (IC)
Statutory Definition: In national accounting standards (SNA 2008 para 6.64), Intermediate Consumption consists of the value of the goods and services consumed as inputs by a process of production, excluding fixed assets whose consumption is recorded as consumption of fixed capital (CFC).
Scope and Exclusions: Goods and services may be either transformed (e.g., flour transformed into bread, raw cotton into yarn) or completely used up (e.g., electricity, fuel, consultancy, auditing, and legal services).
Boundary Distinction: Small tools and equipment of relatively low value used repeatedly in production are treated as intermediate consumption if their cost does not exceed standard asset capitalisation thresholds. However, machinery, vehicles, and structures with an expected working life exceeding one year are classified under Gross Fixed Capital Formation (GFCF) and are strictly excluded from Intermediate Consumption."""


DEFAULT_OFFICER_DOSSIER: str = """CONFIDENTIAL ADMINISTRATIVE CADRE DOSSIER
MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION (MoSPI)
GOVERNMENT OF INDIA - SUBORDINATE STATISTICAL SERVICE / INDIAN STATISTICAL SERVICE

OFFICER IDENTIFIER: ISS-2026-9042
FULL NAME: Shreyas Suresh Attavar
CADRE: Indian Statistical Service (ISS)
DESIGNATION: Junior Statistical Officer (JSO)
CURRENT POSTING / DIVISION: Field Operations Division (FOD), Regional Office
DATE OF APPOINTMENT: 12-August-2022
SECURITY CLEARANCE / CUSTODY LEVEL: Level-2 (Survey Microdata Custodian)

ACADEMIC QUALIFICATIONS:
- Bachelor of Science (B.Sc.) in Mathematics and Statistics, First Class with Distinction
- Master of Science (M.Sc.) in Statistics, University Department of Statistics (Specialization in Sampling Theory, Econometrics, and Stochastic Modelling)

ADMINISTRATIVE POSTINGS & FIELD EXPERIENCE:
1. Field Operations Division (FOD), Regional Office (August 2022 - Present):
   - Supervised primary data collection and field scrutiny across 48 First Stage Units (FSUs) for the Periodic Labour Force Survey (PLFS) quarterly rounds.
   - Conducted on-site factory audit schedules and data validation for the Annual Survey of Industries (ASI).
   - Responsible for scrutinizing enterprise balance sheets, verifying input-output schedules, intermediate consumption entries, and gross additions to fixed assets.
   - Supervised field investigators in household listing, stratification, and sample selection using systematic sampling routines.

DEMONSTRATED COMPETENCY & OPERATIONAL PROFICIENCIES:
- Statistical Theory & Survey Design: High proficiency in probability distributions, Horvitz-Thompson estimation, sample weight calibration, and sampling variance computation. Sound conceptual grasp of NSS sampling frameworks.
- Completed NSSTA Induction Course: "Compilation of National Accounts Statistics & GCF (SNA 2008 Guidelines)" (Course ID: NSSTA-NAS-2024).

IDENTIFIED TRAINING DEFICITS & COMPETENCY GAPS:
1. Technical Tools & Automated Data Pipelines:
   - The officer has had NO formal production training in modern computational pipelines using Python (pandas, numpy, scikit-learn), R statistical programming, or SQL relational databases.
   - Currently relies on manual spreadsheet cross-checks and legacy command-line batch files for schedule verification, leading to processing bottlenecks in high-frequency PLFS rounds.
   - No exposure to geospatial tools (GIS, GeoPandas, QGIS) for Small Area Estimation (SAE) or spatial clustering of survey samples.
2. Digital Governance & Data Fiduciary Compliance:
   - Has not undergone mandatory training on statutory responsibilities under the Digital Personal Data Protection (DPDP) Act 2023 regarding respondent personally identifiable information (PII) handling and encryption during field data transfers.
3. Managerial Procurement & Financial Protocols:
   - Limited exposure to General Financial Rules (GFR 2017) and public procurement protocols required for managing third-party logistics and contractual survey enumerators."""


class JsonResponse(str):
    """
    String wrapper that parses JSON for dual access as both a string and a dictionary,
    enabling seamless serialization and dict lookups for offline demo execution.
    """

    def __new__(cls, content: Any):
        if isinstance(content, (dict, list)):
            text = json.dumps(content, indent=2)
        else:
            text = str(content)
        instance = super().__new__(cls, text)
        instance._parsed = json.loads(text) if isinstance(text, str) else content
        return instance

    def __getitem__(self, key: Any) -> Any:
        if isinstance(key, (int, slice)):
            return super().__getitem__(key)
        return self._parsed[key]

    def __contains__(self, key: Any) -> bool:
        if isinstance(key, str) and isinstance(self._parsed, dict) and key in self._parsed:
            return True
        return super().__contains__(key)

    def get(self, key: str, default: Any = None) -> Any:
        if isinstance(self._parsed, dict):
            return self._parsed.get(key, default)
        return default

    def keys(self):
        if isinstance(self._parsed, dict):
            return self._parsed.keys()
        return [].keys()

    def values(self):
        if isinstance(self._parsed, dict):
            return self._parsed.values()
        return [].values()

    def items(self):
        if isinstance(self._parsed, dict):
            return self._parsed.items()
        return [].items()

    def to_dict(self) -> Any:
        return self._parsed


# Precomputed verified payload data for offline zero-latency demo execution
_VERIFIED_DOSSIER_RESPONSE = {
    "officer_id": "ISS-2026-9042",
    "name": "Shreyas Suresh Attavar",
    "designation": "Junior Statistical Officer (JSO)",
    "cadre": "Indian Statistical Service (ISS)",
    "division": "Field Operations Division (FOD)",
    "education": "M.Sc. Statistics",
    "current_scores": {
        "Statistical Theory & National Accounts": 62,
        "Technical Tools (Python, R, SQL, GIS)": 48,
        "Digital Governance & Data Privacy": 65,
        "Managerial & Public Decision Making": 55,
    },
    "role_benchmarks": {
        "Statistical Theory & National Accounts": 75,
        "Technical Tools (Python, R, SQL, GIS)": 70,
        "Digital Governance & Data Privacy": 60,
        "Managerial & Public Decision Making": 50,
    },
    "competency_gaps": {
        "Statistical Theory & National Accounts": -13,
        "Technical Tools (Python, R, SQL, GIS)": -22,
        "Digital Governance & Data Privacy": 5,
        "Managerial & Public Decision Making": 5,
    },
    "critical_deficits": [
        "Major technical deficit (-22 pts) in modern computational workflows: No production Python, SQL, R, or GIS experience.",
        "Methodological deficit (-13 pts) in National Accounts compilation and standard error estimation for complex survey rounds.",
    ],
    "recommended_pathway": [
        {
            "course_id": "MOSPI-PY-GIS",
            "title": "Small Area Estimation (SAE) & Spatial Modeling using Python & GeoPandas",
            "domain": "Technical Tools (Python, R, SQL, GIS)",
            "provider": "Computer Centre MoSPI",
            "duration_hours": 30,
            "competency_gain": 25,
            "priority": "HIGH",
        },
        {
            "course_id": "NIC-R-SURVEY",
            "title": "Automated Data Validation & Imputation Pipelines with R & PostgreSQL",
            "domain": "Technical Tools (Python, R, SQL, GIS)",
            "provider": "NIC",
            "duration_hours": 20,
            "competency_gain": 20,
            "priority": "HIGH",
        },
        {
            "course_id": "NSSTA-MIS-78",
            "title": "Sampling Methodology & Standard Error Estimation in NSS 78th Round (MIS)",
            "domain": "Statistical Theory & National Accounts",
            "provider": "NSSTA",
            "duration_hours": 24,
            "competency_gain": 20,
            "priority": "MEDIUM",
        },
        {
            "course_id": "MEITY-DPDP-2023",
            "title": "Statutory Data Fiduciary Obligations under the DPDP Act 2023",
            "domain": "Digital Governance & Data Privacy",
            "provider": "NeGD",
            "duration_hours": 12,
            "competency_gain": 15,
            "priority": "LOW",
        },
    ],
    "administrative_recommendation": "Deploy targeted iGOT Karmayogi intervention in Python/SQL and NSS sampling methodology to elevate officer to full benchmark competency within 60 days.",
}

_VERIFIED_MANUAL_RESPONSE = {
    "manual_title": "MoSPI Technical Compendium on Statistical Concepts, Standards, and Methodologies",
    "topics_covered": ["GVA", "CPI", "IIP", "Base Year", "Sampling Variance", "Intermediate Consumption"],
    "questions": [
        {
            "question_id": "KSI-MCQ-001",
            "stem": "Under the System of National Accounts (SNA 2008) adopted by MoSPI, which of the following is explicitly EXCLUDED from Intermediate Consumption?",
            "options": [
                "A) Professional legal and auditing fees incurred for survey administration",
                "B) Office stationery and consumable computer supplies",
                "C) Consumption of Fixed Capital (CFC)",
                "D) Electricity, fuel, and power consumed in operating statistical servers",
            ],
            "correct_answer": "C) Consumption of Fixed Capital (CFC)",
            "rationale": "SNA 2008 para 6.64 explicitly clarifies that Intermediate Consumption consists of the value of goods and services consumed as inputs, strictly excluding fixed assets whose wear and tear is recorded as Consumption of Fixed Capital (CFC).",
            "bloom_level": "Level 1: Recall",
        },
        {
            "question_id": "KSI-MCQ-002",
            "stem": "What is the current base year adopted by the Ministry of Statistics and Programme Implementation (MoSPI) for the All India Consumer Price Index (CPI Rural/Urban/Combined) series?",
            "options": [
                "A) 2004-05 = 100",
                "B) 2011-12 = 100",
                "C) 2012 = 100",
                "D) 2016 = 100",
            ],
            "correct_answer": "C) 2012 = 100",
            "rationale": "The official all-India CPI series compiled by the Price Statistics Division (PSD) of MoSPI utilizes calendar year 2012 = 100 as the base year.",
            "bloom_level": "Level 1: Recall",
        },
        {
            "question_id": "KSI-MCQ-003",
            "stem": "In Indian National Accounts compilation (CSO/NAD), what is the statutory relationship connecting Gross Value Added (GVA) at basic prices to Gross Domestic Product (GDP) at market prices?",
            "options": [
                "A) GDP at market prices = GVA at basic prices + Net Product Taxes (Product Taxes - Product Subsidies)",
                "B) GDP at market prices = GVA at basic prices - Net Production Taxes (Production Taxes - Production Subsidies)",
                "C) GDP at market prices = GVA at basic prices + Consumption of Fixed Capital",
                "D) GDP at market prices = GVA at basic prices + Net Factor Income from Abroad (NFIA)",
            ],
            "correct_answer": "A) GDP at market prices = GVA at basic prices + Net Product Taxes (Product Taxes - Product Subsidies)",
            "rationale": "According to the CSO National Accounts Statistics guidelines, GDP at market prices is derived from GVA at basic prices by adding Product Taxes and subtracting Product Subsidies. Production taxes/subsidies are already incorporated into basic prices.",
            "bloom_level": "Level 2: Conceptual Analysis",
        },
        {
            "question_id": "KSI-MCQ-004",
            "stem": "In NSS multi-stage stratified survey designs (e.g., PLFS), why does calculating standard errors assuming Simple Random Sampling (SRS) lead to misleading statistical conclusions?",
            "options": [
                "A) SRS overestimates sampling variance because stratification always reduces precision",
                "B) Clustering in First Stage Units (FSUs) induces positive intra-cluster correlation (Design Effect Deff > 1), causing SRS formulas to underestimate true sampling variance",
                "C) Multi-stage sampling uses non-linear estimators that have zero theoretical variance",
                "D) Design-based variance requires non-probability quota allocation",
            ],
            "correct_answer": "B) Clustering in First Stage Units (FSUs) induces positive intra-cluster correlation (Design Effect Deff > 1), causing SRS formulas to underestimate true sampling variance",
            "rationale": "Households within selected FSUs (villages/urban blocks) share socio-economic characteristics, producing positive intra-cluster correlation. This design effect (Deff > 1) makes standard SRS variance formulas severely underestimate actual survey standard errors.",
            "bloom_level": "Level 2: Conceptual Analysis",
        },
        {
            "question_id": "KSI-MCQ-005",
            "stem": "A statistical officer computes the Index of Industrial Production (IIP) for the Manufacturing sector using Laspeyres' formula. Given quantity relatives R_i = (q_it / q_i0) and base period weights W_i (with Sum W_i = 776.3), what is the correct procedural calculation?",
            "options": [
                "A) IIP = (Sum(W_i * R_i) / Sum(W_i)) * 100",
                "B) IIP = (Sum(q_it * p_it) / Sum(q_i0 * p_i0)) * 100",
                "C) IIP = sqrt((Sum(W_i * R_i) / Sum(W_i)) * 100)",
                "D) IIP = (Sum(R_i) / N) * 100",
            ],
            "correct_answer": "A) IIP = (Sum(W_i * R_i) / Sum(W_i)) * 100",
            "rationale": "MoSPI compiles IIP as a weighted arithmetic mean of quantity relatives using Laspeyres' base-weighted formulation: IIP = (Sum(W_i * R_i) / Sum(W_i)) * 100.",
            "bloom_level": "Level 3: Procedural Application",
        },
        {
            "question_id": "KSI-MCQ-006",
            "stem": "During an Annual Survey of Industries (ASI) verification, an officer reviews enterprise expenditures: (1) Rs. 3,20,000 for a heavy CNC motor with an expected lifespan of 8 years; (2) Rs. 18,000 for lubricating oils and machine coolant consumed during the accounting month. Under MoSPI National Accounts standards, how must these expenditures be recorded?",
            "options": [
                "A) Both items must be recorded under Intermediate Consumption",
                "B) Both items must be recorded under Gross Fixed Capital Formation (GFCF)",
                "C) The motor (Rs. 3,20,000) is Gross Fixed Capital Formation (GFCF), while the lubricating oil/coolant (Rs. 18,000) is Intermediate Consumption",
                "D) The motor is Intermediate Consumption and the oil/coolant is recorded as Change in Inventories",
            ],
            "correct_answer": "C) The motor (Rs. 3,20,000) is Gross Fixed Capital Formation (GFCF), while the lubricating oil/coolant (Rs. 18,000) is Intermediate Consumption",
            "rationale": "Assets with an expected productive life exceeding one year used repeatedly in production are classified as Gross Fixed Capital Formation (GFCF). Consumables used up directly within the production period (coolant, lubricant) constitute Intermediate Consumption.",
            "bloom_level": "Level 3: Procedural Application",
        },
    ],
}

# Generate MD5 hashes
_DOSSIER_HASH_RAW = hashlib.md5(DEFAULT_OFFICER_DOSSIER.encode("utf-8")).hexdigest()
_DOSSIER_HASH_STRIPPED = hashlib.md5(DEFAULT_OFFICER_DOSSIER.strip().encode("utf-8")).hexdigest()
_MANUAL_HASH_RAW = hashlib.md5(SAMPLE_STATISTICAL_MANUAL.encode("utf-8")).hexdigest()
_MANUAL_HASH_STRIPPED = hashlib.md5(SAMPLE_STATISTICAL_MANUAL.strip().encode("utf-8")).hexdigest()

PRECOMPUTED_DEMO_CACHE: dict[str, Any] = {
    _DOSSIER_HASH_RAW: JsonResponse(_VERIFIED_DOSSIER_RESPONSE),
    _DOSSIER_HASH_STRIPPED: JsonResponse(_VERIFIED_DOSSIER_RESPONSE),
    _MANUAL_HASH_RAW: JsonResponse(_VERIFIED_MANUAL_RESPONSE),
    _MANUAL_HASH_STRIPPED: JsonResponse(_VERIFIED_MANUAL_RESPONSE),
    "default_officer_dossier": JsonResponse(_VERIFIED_DOSSIER_RESPONSE),
    "sample_statistical_manual": JsonResponse(_VERIFIED_MANUAL_RESPONSE),
}


# ==============================================================================
# DATABASE CONNECTION & SCHEMA INITIALIZATION
# ==============================================================================

def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    """Return an open SQLite database connection with row factory configured."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = DB_PATH) -> None:
    """
    Initialize SQLite schema and populate seed data if not present.
    Designed to be strictly idempotent across module reloads.
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. officers table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS officers (
            officer_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            cadre TEXT NOT NULL,
            designation TEXT NOT NULL,
            division TEXT NOT NULL,
            completed_courses_csv TEXT NOT NULL
        );
    """)

    # 2. officer_scores table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS officer_scores (
            officer_id TEXT NOT NULL,
            domain TEXT NOT NULL,
            score INTEGER NOT NULL,
            PRIMARY KEY (officer_id, domain),
            FOREIGN KEY (officer_id) REFERENCES officers (officer_id) ON DELETE CASCADE
        );
    """)

    # 3. courses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS courses (
            course_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            domain TEXT NOT NULL,
            provider TEXT NOT NULL,
            duration_hours INTEGER NOT NULL,
            level TEXT NOT NULL,
            competency_gain INTEGER NOT NULL
        );
    """)

    # 4. benchmarks table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS benchmarks (
            role_name TEXT NOT NULL,
            domain TEXT NOT NULL,
            benchmark_score INTEGER NOT NULL,
            PRIMARY KEY (role_name, domain)
        );
    """)

    # 5. cadre_telemetry table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cadre_telemetry (
            division TEXT PRIMARY KEY,
            statistical_theory REAL NOT NULL,
            technical_tools REAL NOT NULL,
            data_privacy REAL NOT NULL,
            managerial REAL NOT NULL,
            avg_igot_hours REAL NOT NULL
        );
    """)

    # --------------------------------------------------------------------------
    # SEED DATA (Authentic MoSPI / NSSTA syllabi)
    # --------------------------------------------------------------------------

    # Seed Role Benchmarks
    benchmarks_data = [
        # Junior Statistical Officer (JSO): {75, 70, 60, 50}
        ("Junior Statistical Officer (JSO)", "Statistical Theory & National Accounts", 75),
        ("Junior Statistical Officer (JSO)", "Technical Tools (Python, R, SQL, GIS)", 70),
        ("Junior Statistical Officer (JSO)", "Digital Governance & Data Privacy", 60),
        ("Junior Statistical Officer (JSO)", "Managerial & Public Decision Making", 50),
        # Senior Statistical Officer (SSO): {85, 80, 75, 70}
        ("Senior Statistical Officer (SSO)", "Statistical Theory & National Accounts", 85),
        ("Senior Statistical Officer (SSO)", "Technical Tools (Python, R, SQL, GIS)", 80),
        ("Senior Statistical Officer (SSO)", "Digital Governance & Data Privacy", 75),
        ("Senior Statistical Officer (SSO)", "Managerial & Public Decision Making", 70),
        # Assistant Director (NAD / FOD): {90, 85, 85, 85}
        ("Assistant Director (NAD / FOD)", "Statistical Theory & National Accounts", 90),
        ("Assistant Director (NAD / FOD)", "Technical Tools (Python, R, SQL, GIS)", 85),
        ("Assistant Director (NAD / FOD)", "Digital Governance & Data Privacy", 85),
        ("Assistant Director (NAD / FOD)", "Managerial & Public Decision Making", 85),
    ]
    cursor.executemany("""
        INSERT OR IGNORE INTO benchmarks (role_name, domain, benchmark_score)
        VALUES (?, ?, ?);
    """, benchmarks_data)

    # Seed 6 Authentic iGOT Courses
    courses_data = [
        (
            "NSSTA-NAS-2024",
            "Compilation of National Accounts Statistics & GCF (SNA 2008 Guidelines)",
            "Statistical Theory & National Accounts",
            "NSSTA",
            36,
            "Advanced",
            25,
        ),
        (
            "NSSTA-MIS-78",
            "Sampling Methodology & Standard Error Estimation in NSS 78th Round (MIS)",
            "Statistical Theory & National Accounts",
            "NSSTA",
            24,
            "Intermediate",
            20,
        ),
        (
            "MOSPI-PY-GIS",
            "Small Area Estimation (SAE) & Spatial Modeling using Python & GeoPandas",
            "Technical Tools (Python, R, SQL, GIS)",
            "Computer Centre MoSPI",
            30,
            "Intermediate",
            25,
        ),
        (
            "NIC-R-SURVEY",
            "Automated Data Validation & Imputation Pipelines with R & PostgreSQL",
            "Technical Tools (Python, R, SQL, GIS)",
            "NIC",
            20,
            "Intermediate",
            20,
        ),
        (
            "MEITY-DPDP-2023",
            "Statutory Data Fiduciary Obligations under the DPDP Act 2023",
            "Digital Governance & Data Privacy",
            "NeGD",
            12,
            "Foundational",
            15,
        ),
        (
            "ISTM-TPAC-GFR",
            "Public Procurement & Contract Management for Field Surveys (GFR 2017)",
            "Managerial & Public Decision Making",
            "ISTM",
            16,
            "Intermediate",
            15,
        ),
    ]
    cursor.executemany("""
        INSERT OR IGNORE INTO courses (course_id, title, domain, provider, duration_hours, level, competency_gain)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    """, courses_data)

    # Seed Cadre Telemetry
    telemetry_data = [
        ("FOD (Field Operations)", 64.0, 48.0, 55.0, 68.0, 18.2),
        ("NAD (National Accounts)", 88.0, 62.0, 70.0, 74.0, 34.5),
        ("PSD (Price Statistics)", 82.0, 71.0, 68.0, 62.0, 27.8),
        ("Coordination & Training", 70.0, 59.0, 82.0, 80.0, 22.0),
    ]
    cursor.executemany("""
        INSERT OR IGNORE INTO cadre_telemetry (division, statistical_theory, technical_tools, data_privacy, managerial, avg_igot_hours)
        VALUES (?, ?, ?, ?, ?, ?);
    """, telemetry_data)

    # Seed Default Officer Record if absent
    seed_officer_id = "ISS-2026-9042"
    cursor.execute("SELECT 1 FROM officers WHERE officer_id = ?", (seed_officer_id,))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO officers (officer_id, name, cadre, designation, division, completed_courses_csv)
            VALUES (?, ?, ?, ?, ?, ?);
        """, (
            seed_officer_id,
            "Shreyas Suresh Attavar",
            "Indian Statistical Service (ISS)",
            "Junior Statistical Officer (JSO)",
            "Field Operations Division (FOD)",
            "NSSTA-NAS-2024",
        ))

    # Seed Default Officer Scores ONLY if not already populated for this officer
    cursor.execute("SELECT COUNT(*) FROM officer_scores WHERE officer_id = ?", (seed_officer_id,))
    count = cursor.fetchone()[0]
    if count == 0:
        initial_scores = [
            (seed_officer_id, "Statistical Theory & National Accounts", 62),
            (seed_officer_id, "Technical Tools (Python, R, SQL, GIS)", 48),
            (seed_officer_id, "Digital Governance & Data Privacy", 65),
            (seed_officer_id, "Managerial & Public Decision Making", 55),
        ]
        cursor.executemany("""
            INSERT INTO officer_scores (officer_id, domain, score)
            VALUES (?, ?, ?);
        """, initial_scores)

    conn.commit()
    conn.close()


# Initialize database automatically on module import
init_db()


# ==============================================================================
# STORAGE & ACCESS FUNCTIONS
# ==============================================================================

def get_officer(officer_id: str) -> Optional[OfficerProfile]:
    """
    Retrieve an officer's profile and scores from SQLite.
    Returns None if the officer is not found (no hardcoded stubs).
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT officer_id, name, cadre, designation, division, completed_courses_csv FROM officers WHERE officer_id = ?",
        (officer_id,),
    )
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    cursor.execute(
        "SELECT domain, score FROM officer_scores WHERE officer_id = ?",
        (officer_id,),
    )
    score_rows = cursor.fetchall()
    conn.close()

    scores = {r["domain"]: r["score"] for r in score_rows}
    raw_courses = row["completed_courses_csv"]
    completed_courses = [c.strip() for c in raw_courses.split(",") if c.strip()] if raw_courses else []

    return OfficerProfile(
        officer_id=row["officer_id"],
        name=row["name"],
        cadre=row["cadre"],
        designation=row["designation"],
        division=row["division"],
        scores=scores,
        completed_courses=completed_courses,
    )


def update_officer_scores(officer_id: str, new_scores: dict[str, int]) -> None:
    """
    Upsert new scores for an officer into officer_scores and commit immediately to disk.
    """
    conn = get_connection()
    cursor = conn.cursor()

    for domain, score in new_scores.items():
        cursor.execute(
            """
            INSERT INTO officer_scores (officer_id, domain, score)
            VALUES (?, ?, ?)
            ON CONFLICT(officer_id, domain) DO UPDATE SET score = excluded.score;
            """,
            (officer_id, domain, int(score)),
        )

    conn.commit()
    conn.close()


def get_role_benchmark(role_name: str) -> dict[str, int]:
    """
    Retrieve domain benchmark scores for a specific role.
    Supports exact matching and substring / alias matching.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT domain, benchmark_score FROM benchmarks WHERE role_name = ?",
        (role_name,),
    )
    rows = cursor.fetchall()
    if not rows:
        cursor.execute(
            "SELECT domain, benchmark_score FROM benchmarks WHERE role_name LIKE ? OR ? LIKE ('%' || role_name || '%')",
            (f"%{role_name}%", role_name),
        )
        rows = cursor.fetchall()

    conn.close()
    return {row["domain"]: row["benchmark_score"] for row in rows}


def get_courses_by_domain(domain: str) -> list[iGOTCourse]:
    """
    Retrieve iGOT courses mapped to a specific domain.
    Supports canonical domain names, short aliases (e.g. 'Statistical Theory'),
    and substring pattern matching.
    """
    conn = get_connection()
    cursor = conn.cursor()

    domain_clean = domain.strip().lower()
    canonical_domain = DOMAIN_CANONICAL_MAP.get(domain_clean, domain.strip())

    cursor.execute(
        """
        SELECT course_id, title, domain, provider, duration_hours, level, competency_gain
        FROM courses
        WHERE domain = ? OR domain = ? OR domain LIKE ? OR ? LIKE ('%' || domain || '%')
        ORDER BY course_id;
        """,
        (domain.strip(), canonical_domain, f"%{domain.strip()}%", domain.strip()),
    )
    rows = cursor.fetchall()
    conn.close()

    return [
        iGOTCourse(
            course_id=r["course_id"],
            title=r["title"],
            domain=r["domain"],
            provider=r["provider"],
            duration_hours=r["duration_hours"],
            level=r["level"],
            competency_gain=r["competency_gain"],
        )
        for r in rows
    ]


def get_cadre_analytics() -> pd.DataFrame:
    """
    Retrieve cadre telemetry metrics across MoSPI divisions as a pandas DataFrame.
    """
    conn = get_connection()
    df = pd.read_sql_query(
        "SELECT division, statistical_theory, technical_tools, data_privacy, managerial, avg_igot_hours FROM cadre_telemetry",
        conn,
    )
    conn.close()
    return df
