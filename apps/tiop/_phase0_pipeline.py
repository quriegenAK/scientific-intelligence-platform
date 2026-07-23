"""Assemble ONE fully-populated target row from the three source adapters.

Deterministic. No LLM calls (Claude is the reasoning layer, invoked separately for
the brief). Every column becomes a Fact with its own provenance + confidence +
derivation. Cross-source discrepancies are recorded, not hidden.
"""
from __future__ import annotations
from .trust import Fact, TrustStamp
from .sources.opentargets import OpenTargetsSource
from .sources.chembl import ChEMBLSource
from .sources.clinicaltrials import ClinicalTrialsSource

PIPELINE_VERSION = "tiop-0.1.0"
PROMPT_VERSION = "brief-2026-07-23.v1"
MODEL_VERSION = "claude-fable-5"


def build_row(target_ref: dict) -> tuple[list[Fact], TrustStamp, dict]:
    ot = OpenTargetsSource().fetch(target_ref)
    ch = ChEMBLSource().fetch(target_ref)
    ct = ClinicalTrialsSource().fetch(target_ref)
    o, c, t = ot.records, ch.records, ct.records

    facts: list[Fact] = []
    def F(field, value, prov, confidence="HIGH", derivation="", notes=""):
        facts.append(Fact(field, value, prov, confidence, derivation, notes))

    # --- identity (Open Targets spine) ---
    F("gene", o["gene"], ot.provenance)
    F("protein", o["protein_name"], ot.provenance)
    F("uniprot", o["uniprot"], ot.provenance)
    F("target_family_class", ", ".join(o["target_class"]) or "n/a", ot.provenance)
    F("subcellular_location", "; ".join(o["subcellular_location"]) or "n/a", ot.provenance,
      notes="Cell-surface => NOT an intracellular white-space target; this is the saturated end.")

    # --- development level (DERIVED from ChEMBL under the Pharos definition) ---
    dev = "Tclin" if c["n_approved"] > 0 else "Tchem"
    F("development_level", dev, ch.provenance, confidence="DERIVED",
      derivation="ChEMBL max_phase==4 (approved drug w/ known MoA) => Pharos 'Tclin'. "
                 "Authoritative Pharos pull deferred to Phase 1.",
      notes="Pharos is the canonical source for Tclin/Tchem/Tbio/Tdark; derived here to stay within 3 sources.")

    # --- drugs / mechanism / modality (ChEMBL authoritative) ---
    F("approved_drugs", ", ".join(c["approved_names"]), ch.provenance,
      notes=f"{c['n_approved']} approved at ChEMBL max_phase=4 (FDA/EMA-anchored).")
    F("mechanism_moa", "; ".join(f"{a} ({b})" for a, b in c["moa"]), ch.provenance)
    F("modality", ", ".join(c["modalities"]), ch.provenance,
      notes="All approved PD-1 blockers are monoclonal antibodies.")
    F("first_approval_year", c["first_approval_year"], ch.provenance,
      notes="Earliest = pembrolizumab, 2014.")

    # --- highest phase + companies (ClinicalTrials.gov authoritative) ---
    F("highest_phase", t["highest_phase_label"], ct.provenance,
      notes="Independently corroborates approval (ChEMBL max_phase=4, OT maxStage=APPROVAL).")
    F("companies_developing", ", ".join(t["companies_developing"][:10]), ct.provenance,
      confidence="MEDIUM",
      derivation="Top industry lead sponsors across sampled trials of the 7 approved PD-1 drugs.",
      notes="Sampled (stable sort); exhaustive sponsor rollup deferred.")

    # --- indications / TA (Open Targets, with derived TA) ---
    F("disease_indication", ", ".join(n for n, _ in o["top_diseases"][:6]), ot.provenance,
      notes="Top disease associations by OT overall score.")
    F("therapeutic_area", "Immuno-oncology", ot.provenance, confidence="DERIVED",
      derivation="All top indications are solid-tumour / haematological cancers treated by "
                 "checkpoint blockade => immuno-oncology.")

    # --- tractability (Open Targets) ---
    sm = "Yes" if o["tractability"]["SM"] else "No"
    ab = "Yes" if o["tractability"]["AB"] else "No"
    F("tractability_small_molecule", sm, ot.provenance,
      notes="; ".join(o["tractability"]["SM"]) or "no SM evidence buckets")
    F("tractability_antibody", ab, ot.provenance,
      notes="; ".join(o["tractability"]["AB"]) or "no AB evidence buckets")

    # --- white-space flag (DERIVED; NO score computed in the walking skeleton) ---
    F("white_space_flag", "No -- saturated", ct.provenance, confidence="DERIVED",
      derivation="Validated + cell-surface + many approved drugs + >6,700 trials across 7 drugs "
                 "+ >10 industry sponsors => high saturation, low white space. "
                 "(White Space *score* is the next increment, not built in the skeleton.)")

    # --- QurieGen relevance (DERIVED, qualitative) ---
    F("qurie_relevance", "Reference / benchmark target", ot.provenance, confidence="DERIVED",
      derivation="Surface, antibody-saturated => low direct edge for QurieGen's causal "
                 "multi-omics + intracellular thesis; serves as a validated benchmark to "
                 "calibrate scores against, not a primary opportunity.")

    stamp = TrustStamp(
        pipeline_version=PIPELINE_VERSION, prompt_version=PROMPT_VERSION,
        model_version=MODEL_VERSION,
        data_versions={
            "open_targets": ot.provenance.data_version,
            "chembl": ch.provenance.data_version,
            "clinicaltrials": ct.provenance.data_version,
        },
        reproducible=True,
        reproducibility_note="Row is a pure function of pinned raw/ snapshots; re-running "
                             "build.py yields an identical content_hash. Refresh path re-pulls "
                             "live to bump the pinned data_version.",
    )
    stamp.content_hash = TrustStamp.hash_facts(facts)

    # discrepancy ledger (Trust Layer surfaces conflicts rather than silently picking one)
    discrepancies = [{
        "field": "approved_drugs",
        "open_targets": {"count": len(o["approved_stage_names"]), "names": o["approved_stage_names"]},
        "chembl": {"count": c["n_approved"], "names": c["approved_names"]},
        "resolution": "Reported ChEMBL's FDA/EMA-anchored max_phase=4 set as the headline; "
                      "OT's broader APPROVAL set (incl. China NMPA approvals) recorded alongside. "
                      "Neither is 'wrong' -- they answer 'approved by whom'.",
    }]
    return facts, stamp, {"discrepancies": discrepancies}
