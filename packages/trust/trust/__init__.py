"""
Scientific Trust Layer (shared package) — the platform's core differentiator.

Builds on packages/provenance: a Fact carries DataProvenance always, and ReasoningProvenance
only when a model produced it. TrustStamp is the row/artifact reproducibility envelope.
Every future agent imports this; nothing here is TIOP-specific.
"""
from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Any, Optional, List
import hashlib
import json

from provenance import DataProvenance, ReasoningProvenance, CONFIDENCE  # shared contract

__all__ = ["DataProvenance", "ReasoningProvenance", "Fact", "TrustStamp", "CONFIDENCE"]


@dataclass
class Fact:
    field: str
    value: Any
    data_prov: DataProvenance
    confidence: str = "HIGH"
    derivation: str = ""
    reasoning_prov: Optional[ReasoningProvenance] = None
    notes: str = ""

    def __post_init__(self):
        assert self.confidence in CONFIDENCE, f"bad confidence {self.confidence}"

    @property
    def is_reasoned(self) -> bool:
        return self.reasoning_prov is not None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["citation"] = self.data_prov.cite()
        d["is_reasoned"] = self.is_reasoned
        return d


@dataclass
class TrustStamp:
    pipeline_version: str
    data_versions: dict
    reproducible: bool
    reproducibility_note: str
    content_hash: str = ""
    model_version: str = ""
    prompt_version: str = ""

    @staticmethod
    def hash_facts(facts: List[Fact]) -> str:
        payload = json.dumps(
            {f.field: f.value for f in sorted(facts, key=lambda x: x.field)},
            sort_keys=True, default=str,
        )
        return hashlib.sha256(payload.encode()).hexdigest()[:16]
