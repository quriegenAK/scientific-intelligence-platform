"""
Evaluation framework (shared package) — the 6 metrics every agent output is scored on,
from day one (ADR-0001; section 14B of the founding brief). Measuring from the start lets
every future capability be compared objectively — and it is what pharma diligence asks for.
"""
from __future__ import annotations
from dataclasses import dataclass, asdict

METRICS = {
    "accuracy": "Correctness vs expert opinion / ground truth.",
    "time_saved": "Hours saved vs doing it by hand.",
    "scientific_utility": "Did it change an experiment or decision?",
    "trust": "Would a scientist rely on it? (provenance + confidence)",
    "reproducibility": "Does the same answer regenerate?",
    "novelty": "Did it surface evidence researchers hadn't considered?",
}


@dataclass
class EvalScore:
    accuracy: int
    time_saved: int
    scientific_utility: int
    trust: int
    reproducibility: int
    novelty: int
    basis: str = ""

    def __post_init__(self):
        for k in METRICS:
            v = getattr(self, k)
            assert 0 <= v <= 10, f"{k} out of range: {v}"

    def as_dict(self) -> dict:
        return asdict(self)

    @property
    def mean(self) -> float:
        return round(sum(getattr(self, k) for k in METRICS) / len(METRICS), 2)
