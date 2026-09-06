"""
Domain models for Karmayogi Statistical Intelligence (KSI) - MoSPI / SIH26101.
"""

from dataclasses import dataclass, field

BLOOM_LEVELS: tuple[str, ...] = (
    "Level 1: Recall",
    "Level 2: Conceptual Analysis",
    "Level 3: Procedural Application",
)


@dataclass
class OfficerProfile:
    officer_id: str
    name: str
    cadre: str
    designation: str
    division: str
    scores: dict[str, int] = field(default_factory=dict)
    completed_courses: list[str] = field(default_factory=list)


@dataclass
class iGOTCourse:
    course_id: str
    title: str
    domain: str
    provider: str
    duration_hours: int
    level: str
    competency_gain: int


@dataclass
class SynthesizedMCQ:
    question_id: str
    stem: str
    options: list[str]
    correct_answer: str
    rationale: str
    bloom_level: str
