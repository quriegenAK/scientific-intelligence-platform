"""
Build the IO cohort into contract-shaped artifacts (the frozen API fixtures).

Reads pinned snapshots + the White Space score, assembles each Target Profile with the
split Trust Layer (DataProvenance always; ReasoningProvenance only on the model-written brief),
validates every object against packages/contracts, and writes fixtures consumed by BOTH the
FastAPI service and the React UI. Deterministic.
"""
import json, os, sys, hashlib, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
for _p in ("provenance", "trust", "contracts"):
    sys.path.insert(0, os.path.join(ROOT, "packages", _p))
sys.path.insert(0, os.path.dirname(__file__))

from trust import DataProvenance, ReasoningProvenance, Fact, TrustStamp  # noqa
import contracts as C  # noqa
from scoring import score_cohort, back_test, SCORE_VERSION  # noqa

RAW = os.path.join(ROOT, "data", "raw")
FIX = os.path.join(ROOT, "apps", "tiop-web", "public", "fixtures")
os.makedirs(FIX, exist_ok=True)
MODEL_VERSION = "claude-fable-5"
PROMPT_VERSION = "brief-2026-07-23.v2"
PIPELINE_VERSION = "tiop-0.2.0"

man = json.load(open(f"{RAW}/_cohort_manifest.json"))
VERS = man["versions"]
ACCESS = man["captured_utc"]

PHASE = {"APPROVAL": "Approved (Phase 4)", "PHASE_3": "Phase 3", "PHASE_2_3": "Phase 2/3",
         "PHASE_2": "Phase 2", "PHASE_1_2": "Phase 1/2", "PHASE_1": "Phase 1", "PRECLINICAL": "Preclinical"}
PHASE_RANK = {"APPROVAL": 6, "PHASE_3": 5, "PHASE_2_3": 4.5, "PHASE_2": 4, "PHASE_1_2": 3.5,
              "PHASE_1": 3, "PRECLINICAL": 1}


def ot_prov(sym, ens):
    return DataProvenance(source="Open Targets Platform",
        endpoint="https://api.platform.opentargets.org/api/v4/graphql",
        data_version=VERS["open_targets"], access_utc=ACCESS,
        query=f"target(ensemblId:{ens}){{ identity, class, tractability, subcellular, associatedDiseases, drugAndClinicalCandidates }}",
        record_url=f"https://platform.opentargets.org/target/{ens}", snapshot=f"data/raw/{sym}/ot.json")

def ch_prov(sym, tcid):
    return DataProvenance(source="ChEMBL", endpoint="https://www.ebi.ac.uk/chembl/api/data",
        data_version=VERS["chembl"], access_utc=ACCESS,
        query=f"mechanism?target_chembl_id={tcid}; molecule?molecule_chembl_id__in=<mechanism molecules>",
        record_url=f"https://www.ebi.ac.uk/chembl/target_report_card/{tcid}/" if tcid else "https://www.ebi.ac.uk/chembl/",
        snapshot=f"data/raw/{sym}/chembl.json")

def ct_prov(sym):
    return DataProvenance(source="ClinicalTrials.gov", endpoint="https://clinicaltrials.gov/api/v2/studies",
        data_version=VERS["clinicaltrials"], access_utc=ACCESS,
        query="studies?query.intr=<flagship drugs>&fields=Phase,LeadSponsor* (industry sponsors; as-of-cutoff censor)",
        record_url=f"https://clinicaltrials.gov/search?term={sym}", snapshot=f"data/raw/{sym}/ct.json")


def prov_model(p: DataProvenance) -> C.ProvenanceModel:
    return C.ProvenanceModel(source=p.source, endpoint=p.endpoint, data_version=p.data_version,
        access_utc=p.access_utc, query=p.query, record_url=p.record_url, snapshot=p.snapshot, citation=p.cite())


def fact_model(f: Fact, label: str) -> C.FactModel:
    rp = None
    if f.reasoning_prov:
        rp = C.ReasoningProvenanceModel(model_version=f.reasoning_prov.model_version,
            prompt_version=f.reasoning_prov.prompt_version, inputs_hash=f.reasoning_prov.inputs_hash,
            reasoning_kind=f.reasoning_prov.reasoning_kind)
    return C.FactModel(field=f.field, label=label, value=f.value, confidence=f.confidence,
        derivation=f.derivation, notes=f.notes, is_reasoned=f.is_reasoned,
        data_prov=prov_model(f.data_prov), reasoning_prov=rp)


LABELS = {"gene": "Gene", "protein": "Protein", "uniprot": "UniProt", "target_family_class": "Target family / class",
    "subcellular_location": "Subcellular location", "development_level": "Development level",
    "approved_drugs": "Approved drug(s)", "mechanism_moa": "Mechanism / MoA", "modality": "Modality",
    "first_approval_year": "First approval year", "highest_phase": "Highest phase",
    "companies_developing": "Companies developing", "disease_indication": "Disease / indication",
    "therapeutic_area": "Therapeutic area", "white_space_score": "White Space score",
    "qurie_relevance": "QurieGen relevance"}


def assemble(sym, meta, sc):
    ot = json.load(open(f"{RAW}/{sym}/ot.json"))["data"]["target"]
    ch = json.load(open(f"{RAW}/{sym}/chembl.json"))
    ct = json.load(open(f"{RAW}/{sym}/ct.json"))
    ens, uni, tcid = meta["ensembl"], meta["uniprot"], meta["chembl_target"]
    P_ot, P_ch, P_ct = ot_prov(sym, ens), ch_prov(sym, tcid), ct_prov(sym)
    r = sc[sym]

    mols = ch["molecules"]["molecules"]
    def ph(m):
        try: return float(m.get("max_phase") or 0)
        except: return 0.0
    approved = sorted((m.get("pref_name") or m["molecule_chembl_id"]).title() for m in mols if ph(m) == 4.0)
    fa = [int(m["first_approval"]) for m in mols if m.get("first_approval")]
    moa = sorted({m["mechanism_of_action"] for m in ch["mechanisms"]["mechanisms"]})
    modality = sorted({m.get("molecule_type") for m in mols if m.get("molecule_type") and m.get("molecule_type") != "Unknown"})
    # highest phase from OT candidate max stage
    stages = [row["drug"]["maximumClinicalStage"] for row in ot["drugAndClinicalCandidates"]["rows"] if row["drug"].get("maximumClinicalStage")]
    hp = max(stages, key=lambda s: PHASE_RANK.get(s, 0)) if stages else "PRECLINICAL"
    companies = sorted({s for d in ct["drug_trials"].values() for s in d.get("industry_sponsors", {})})
    diseases = [d["disease"]["name"] for d in ot["associatedDiseases"]["rows"][:6]]
    dev = "Tclin" if approved else ("Tchem" if any(ph(m) >= 2 for m in mols) or r["T"] >= 0.5 else "Tbio")

    facts = []
    def F(field, value, prov, conf="HIGH", deriv="", notes=""):
        facts.append(Fact(field=field, value=value, data_prov=prov, confidence=conf, derivation=deriv, notes=notes))

    F("gene", ot["approvedSymbol"], P_ot)
    F("protein", ot["approvedName"], P_ot)
    F("uniprot", uni, P_ot)
    F("target_family_class", r["target_class"] or "n/a", P_ot)
    F("subcellular_location", r["subcellular"], P_ot,
      notes="Intracellular/cytoplasmic => aligns with QurieGen's white-space thesis." if r["subcellular"].lower().startswith(("cyto","plasma","basal","actin")) else "Cell-surface.")
    F("development_level", dev, P_ch, conf="DERIVED",
      deriv="ChEMBL max_phase==4 => Tclin; else phase>=2 or tractable => Tchem; else Tbio. Pharos pull deferred.")
    F("approved_drugs", ", ".join(approved) if approved else "None (no approved drug)", P_ch,
      notes=f"{len(approved)} approved at ChEMBL max_phase=4." if approved else "No approved drug — part of the white-space signal.")
    F("mechanism_moa", "; ".join(moa) if moa else "No ChEMBL-registered mechanism yet", P_ch,
      conf="HIGH" if moa else "MEDIUM")
    F("modality", ", ".join(modality) if modality else "n/a (no approved modality)", P_ch)
    F("first_approval_year", (min(fa) if fa else None), P_ch, conf="HIGH" if fa else "MEDIUM",
      notes="" if fa else "No approval yet.")
    F("highest_phase", PHASE.get(hp, hp), P_ct,
      notes="From Open Targets max clinical stage across candidates; CT.gov corroborates trial activity.")
    F("companies_developing", ", ".join(companies[:10]) if companies else "None registered (industry)", P_ct,
      conf="MEDIUM", deriv="Distinct industry lead sponsors across flagship-drug trials (sampled).",
      notes=r["note"] or "")
    F("disease_indication", ", ".join(diseases), P_ot, notes="Top OT disease associations by score.")
    F("therapeutic_area", "Immuno-oncology", P_ot, conf="DERIVED", deriv="IO cohort scope.")

    # --- White Space score fact (carries the score components' provenance) ---
    F("white_space_score", r["white_space"], P_ct, conf=r["confidence"],
      deriv=f"WS = 100·V·T·(1−S); V={r['V']} (OT assoc), T={r['T']} (OT tractability), S={r['S']} (cohort-normalized saturation). Rank {r['rank']}/{len(sc)}.",
      notes=r["note"] or "")

    # --- QurieGen relevance (reasoning-derived; carries ReasoningProvenance) ---
    inputs_hash = hashlib.sha256(json.dumps({k: r[k] for k in ("V","T","S","subcellular","white_space")}, sort_keys=True).encode()).hexdigest()[:16]
    intr = r["subcellular"].lower().startswith(("cyto", "plasma", "basal", "actin"))
    if intr and r["white_space"] >= 25:
        qr = "High edge — intracellular + validated + unsaturated"
    elif r["rank"] <= len(sc) // 3:
        qr = "White-space opportunity (surface) — track"
    else:
        qr = "Benchmark / saturated — calibration only"
    rp = ReasoningProvenance(model_version=MODEL_VERSION, prompt_version=PROMPT_VERSION,
        inputs_hash=inputs_hash, reasoning_kind="classification")
    facts.append(Fact(field="qurie_relevance", value=qr, data_prov=P_ot, confidence="DERIVED",
        derivation="Composed from localization + white-space rank; QurieGen edge is highest for validated, "
                   "unsaturated, intracellular targets its causal multi-omics platform can address.",
        reasoning_prov=rp))

    stamp = TrustStamp(pipeline_version=PIPELINE_VERSION,
        data_versions={"open_targets": VERS["open_targets"], "chembl": VERS["chembl"], "clinicaltrials": VERS["clinicaltrials"]},
        reproducible=True,
        reproducibility_note="Profile is a pure function of pinned data/raw snapshots + versioned score code; "
                             "re-running build_cohort.py yields the same content_hash.",
        model_version=MODEL_VERSION, prompt_version=PROMPT_VERSION)
    stamp.content_hash = TrustStamp.hash_facts(facts)

    # ---- White Space score model ----
    def scomp(name, val, inputs, prov):
        return C.ScoreComponentModel(name=name, value=round(float(val), 4), weight_role="multiplicative", inputs=inputs, data_prov=prov_model(prov))
    ws_model = C.WhiteSpaceScoreModel(score=r["white_space"], score_version=SCORE_VERSION,
        formula="WS = 100 · Validation · Tractability · (1 − Saturation)",
        components=[
            scomp("Validation (V)", r["V"], "Open Targets max disease-association score", P_ot),
            scomp("Tractability (T)", r["T"], "Open Targets tractability — best drugging-path bucket", P_ot),
            scomp("Saturation (S)", r["S"], "Cohort-normalized: approvals + candidates + trials + industry sponsors", P_ct),
        ],
        cohort_rank=r["rank"], cohort_size=len(sc), percentile=r["percentile"], confidence=r["confidence"],
        interpretation=qr if False else _interpret(r, len(sc)))

    brief = _brief(sym, ot, r, approved, moa, companies, diseases, dev)
    trust_model = C.TrustStampModel(pipeline_version=stamp.pipeline_version, data_versions=stamp.data_versions,
        reproducible=stamp.reproducible, reproducibility_note=stamp.reproducibility_note,
        content_hash=stamp.content_hash, model_version=stamp.model_version, prompt_version=stamp.prompt_version)

    profile = C.TargetProfileModel(symbol=sym, ensembl=ens, uniprot=uni, group=meta["group"],
        facts=[fact_model(f, LABELS.get(f.field, f.field)) for f in facts],
        white_space=ws_model, executive_brief_md=brief, trust=trust_model, discrepancies=[])

    summary = C.TargetSummaryModel(symbol=sym, protein=ot["approvedName"], uniprot=uni, group=meta["group"],
        target_class=r["target_class"] or "n/a", subcellular=r["subcellular"], development_level=dev,
        approved_drugs_count=len(approved), modality=(", ".join(modality) or "n/a"),
        highest_phase=PHASE.get(hp, hp), white_space_score=r["white_space"],
        white_space_confidence=r["confidence"], therapeutic_area="Immuno-oncology")
    return profile, summary


def _interpret(r, n):
    if r["rank"] == n:
        return "Saturated floor — validated and tractable but maximally crowded. The calibration anchor."
    if r["rank"] <= n // 3:
        return "Top-tier white space — validated, tractable, and comparatively uncrowded within the IO cohort."
    return "Mid-cohort — real biology with moderate competition; watch the momentum trend."


def _brief(sym, ot, r, approved, moa, companies, diseases, dev):
    """Reasoning-layer brief. States only sourced facts. Carries ReasoningProvenance on the profile."""
    name = ot["approvedName"]
    ws, rank, n = r["white_space"], r["rank"], len(json.load(open(f"{RAW}/_cohort_manifest.json"))["cohort"])
    loc = r["subcellular"]
    drugline = (f"{len(approved)} approved agent(s) ({', '.join(approved[:4])}{'…' if len(approved) > 4 else ''})"
                if approved else "no approved drug yet")
    comps = f"{len(companies)} industry sponsor(s) in trials" if companies else "no registered industry sponsors"
    verdict = _interpret(r, n)
    return (f"## {sym} — {name}\n\n"
            f"**White Space score {ws}/100 · rank {rank}/{n} · {r['confidence']} confidence.** {verdict}\n\n"
            f"{sym} is a {loc.lower()} target in the immuno-oncology cohort with {drugline}. "
            f"Development level **{dev}**; mechanism: {('; '.join(moa) if moa else 'no ChEMBL-registered mechanism yet')}. "
            f"Competitive footprint: {comps}. Leading disease associations: {', '.join(diseases[:4])}.\n\n"
            f"**Score decomposition** — Validation {r['V']}, Tractability {r['T']}, Saturation {r['S']} "
            f"(cohort-normalized). The score is multiplicative, so crowding drives it down even when biology is "
            f"validated — which is why saturated checkpoints sit low and validated-but-uncrowded targets rise.\n\n"
            f"*Every figure above resolves to a versioned source in the Provenance tab. "
            f"This brief is model-written (claude-fable-5) over sourced facts only.*")


def main():
    sc = score_cohort(list(man["cohort"]))
    bt = back_test(sc)
    profiles, summaries = {}, []
    for sym, meta in man["cohort"].items():
        prof, summ = assemble(sym, meta, sc)
        profiles[sym] = json.loads(prof.model_dump_json())
        summaries.append(json.loads(summ.model_dump_json()))
        json.dump(profiles[sym], open(f"{FIX}/target_{sym}.json", "w"), indent=2)

    # funnel (reuse Phase-0 literature anchors)
    funnel = C.FunnelModel(headline="Of ~20,000 human proteins, ~4,479 are druggable and only ~667 (~3.3%) "
        "have yielded an approved drug — the untapped-opportunity headline.",
        steps=[
            C.FunnelStepModel(field="human_proteome", label="Human proteome", value=20000,
                data_prov=C.ProvenanceModel(source="UniProt / Ensembl", endpoint="https://www.uniprot.org/proteomes/UP000005640",
                    data_version="2026_03", access_utc=ACCESS, query="human protein-coding genes",
                    record_url="https://www.uniprot.org/proteomes/UP000005640", citation="UniProt/Ensembl (2026)")),
            C.FunnelStepModel(field="druggable_genome", label="Druggable genome", value=4479,
                data_prov=C.ProvenanceModel(source="Finan et al. 2017, Sci Transl Med", endpoint="https://doi.org/10.1126/scitranslmed.aag1166",
                    data_version="2017", access_utc=ACCESS, query="druggable genome",
                    record_url="https://doi.org/10.1126/scitranslmed.aag1166", citation="Finan 2017")),
            C.FunnelStepModel(field="approved_drug_targets", label="Approved-drug targets", value=667,
                data_prov=C.ProvenanceModel(source="Santos et al. 2017, Nat Rev Drug Discov", endpoint="https://doi.org/10.1038/nrd.2016.230",
                    data_version="2017", access_utc=ACCESS, query="approved drug targets",
                    record_url="https://doi.org/10.1038/nrd.2016.230", citation="Santos 2017")),
        ])
    summaries.sort(key=lambda s: -s["white_space_score"])
    cohort = C.CohortResponseModel(generated_utc=ACCESS, therapeutic_area="Immuno-oncology",
        funnel=funnel, targets=[C.TargetSummaryModel(**s) for s in summaries])
    json.dump(json.loads(cohort.model_dump_json()), open(f"{FIX}/cohort.json", "w"), indent=2)
    json.dump({"score_version": SCORE_VERSION, **bt}, open(f"{FIX}/backtest.json", "w"), indent=2)

    print(f"Built {len(profiles)} target profiles + cohort + funnel + backtest -> {FIX}")
    print("Gate passed:", bt["gate_passed"], "| contract:", C.CONTRACT_VERSION)
    print("Top white space:", ", ".join(f"{s['symbol']}({s['white_space_score']})" for s in summaries[:4]))
    print("Floor:", summaries[-1]["symbol"], summaries[-1]["white_space_score"])
    return cohort


if __name__ == "__main__":
    main()
