"""
Versioned API contract — the ONLY seam between backend and frontend (ADR-0002 §5).

The React app consumes these shapes and nothing else. Changes are deliberate and
versioned: bump CONTRACT_VERSION and add a migration note. Pydantic v2.

This package is shared immediately because it is a *contract*, not a speculative
abstraction — its whole job is to exist before its second implementer.
"""
from __future__ import annotations
from typing import Any, Optional
from pydantic import BaseModel, Field

CONTRACT_VERSION = "v1"


class ProvenanceModel(BaseModel):
    source: str
    endpoint: str
    data_version: str
    access_utc: str
    query: str
    record_url: str = ""
    snapshot: str = ""
    citation: str = ""


class ReasoningProvenanceModel(BaseModel):
    model_version: str
    prompt_version: str
    inputs_hash: str = ""
    reasoning_kind: str = ""


class FactModel(BaseModel):
    field: str
    label: str
    value: Any
    confidence: str
    derivation: str = ""
    notes: str = ""
    is_reasoned: bool = False
    data_prov: ProvenanceModel
    reasoning_prov: Optional[ReasoningProvenanceModel] = None


class ScoreComponentModel(BaseModel):
    name: str
    value: float = Field(ge=0, le=1)
    weight_role: str            # how it enters the formula, e.g. "multiplicative"
    inputs: str                 # human description of what fed it
    data_prov: ProvenanceModel


class WhiteSpaceScoreModel(BaseModel):
    score: float = Field(ge=0, le=100)
    formula: str
    components: list[ScoreComponentModel]
    cohort_rank: int
    cohort_size: int
    percentile: float
    confidence: str
    interpretation: str
    score_version: str


class TrustStampModel(BaseModel):
    pipeline_version: str
    data_versions: dict
    reproducible: bool
    reproducibility_note: str
    content_hash: str
    model_version: str = ""
    prompt_version: str = ""


class TargetSummaryModel(BaseModel):
    """Compact row for the Landscape Explorer / Dashboard table."""
    symbol: str
    protein: str
    uniprot: str
    group: str
    target_class: str
    subcellular: str
    development_level: str
    approved_drugs_count: int
    modality: str
    highest_phase: str
    white_space_score: float
    white_space_confidence: str
    therapeutic_area: str


class TargetProfileModel(BaseModel):
    """Full Target Profile — powers the tabbed page (Summary/Brief/Dossier/Provenance)."""
    symbol: str
    ensembl: str
    uniprot: str
    group: str
    facts: list[FactModel]
    white_space: WhiteSpaceScoreModel
    executive_brief_md: str
    trust: TrustStampModel
    discrepancies: list[dict] = []


class FunnelStepModel(BaseModel):
    field: str
    label: str
    value: int
    data_prov: ProvenanceModel


class FunnelModel(BaseModel):
    headline: str
    steps: list[FunnelStepModel]


class CohortResponseModel(BaseModel):
    contract_version: str = CONTRACT_VERSION
    generated_utc: str
    therapeutic_area: str
    funnel: FunnelModel
    targets: list[TargetSummaryModel]


class BackTestModel(BaseModel):
    method: str
    cutoff: str
    preregistration: str
    checks: list[dict]
    passed: bool
    caveats: list[str]
