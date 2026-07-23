// Mirrors packages/contracts (API contract v1). The UI depends on these shapes only.
export const CONTRACT_VERSION = "v1";

export interface Provenance {
  source: string; endpoint: string; data_version: string; access_utc: string;
  query: string; record_url: string; snapshot: string; citation: string;
}
export interface ReasoningProvenance {
  model_version: string; prompt_version: string; inputs_hash: string; reasoning_kind: string;
}
export interface Fact {
  field: string; label: string; value: unknown; confidence: Confidence;
  derivation: string; notes: string; is_reasoned: boolean;
  data_prov: Provenance; reasoning_prov: ReasoningProvenance | null;
}
export type Confidence = "HIGH" | "MEDIUM" | "DERIVED" | "LOW";

export interface ScoreComponent {
  name: string; value: number; weight_role: string; inputs: string; data_prov: Provenance;
}
export interface WhiteSpaceScore {
  score: number; formula: string; components: ScoreComponent[];
  cohort_rank: number; cohort_size: number; percentile: number;
  confidence: Confidence; interpretation: string; score_version: string;
}
export interface TrustStamp {
  pipeline_version: string; data_versions: Record<string, string>;
  reproducible: boolean; reproducibility_note: string; content_hash: string;
  model_version: string; prompt_version: string;
}
export interface TargetSummary {
  symbol: string; protein: string; uniprot: string; group: string;
  target_class: string; subcellular: string; development_level: string;
  approved_drugs_count: number; modality: string; highest_phase: string;
  white_space_score: number; white_space_confidence: Confidence; therapeutic_area: string;
}
export interface TargetProfile {
  symbol: string; ensembl: string; uniprot: string; group: string;
  facts: Fact[]; white_space: WhiteSpaceScore; executive_brief_md: string;
  trust: TrustStamp; discrepancies: Record<string, unknown>[];
}
export interface FunnelStep { field: string; label: string; value: number; data_prov: Provenance; }
export interface Funnel { headline: string; steps: FunnelStep[]; }
export interface CohortResponse {
  contract_version: string; generated_utc: string; therapeutic_area: string;
  funnel: Funnel; targets: TargetSummary[];
}
export interface BackTestCheck { id: string; kind: string; claim: string; pass: boolean; evidence: string; }
export interface BackTest {
  method: string; cutoff: string; preregistration: string;
  checks: BackTestCheck[]; passed: boolean; findings?: string[]; caveats: string[];
}
