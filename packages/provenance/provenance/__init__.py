"""
Provenance contract (shared package) — the lowest-level trust primitive.

Split into DataProvenance (every fact) and ReasoningProvenance (model-touched facts only),
per ADR-0002 §4. This is a *contract*, so it is shared from day one — its job is to exist
before its second implementer. packages/trust builds Fact + TrustStamp on top of these.
"""
from __future__ import annotations
from dataclasses import dataclass

CONFIDENCE = ("HIGH", "MEDIUM", "DERIVED", "LOW")


@dataclass(frozen=True)
class DataProvenance:
    source: str
    endpoint: str
    data_version: str
    access_utc: str
    query: str
    record_url: str = ""
    snapshot: str = ""

    def cite(self) -> str:
        return f"{self.source} v{self.data_version} ({self.access_utc[:10]})"


@dataclass(frozen=True)
class ReasoningProvenance:
    model_version: str
    prompt_version: str
    inputs_hash: str = ""
    reasoning_kind: str = ""
