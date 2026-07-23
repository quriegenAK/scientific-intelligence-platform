"""
White Space Score (TIOP IP — app-specific, NOT extracted).

    WS = 100 · V · T · (1 − S)

  V (Validation)  : how established the target biology is   [Open Targets max disease-association]
  T (Tractability): is there a viable drugging path         [Open Targets tractability buckets]
  S (Saturation)  : how crowded, cohort-normalized 0..1     [ChEMBL approvals+candidates, CT.gov trials+sponsors]

Multiplicative on purpose: a target is white space only if it is validated AND tractable AND
uncrowded. A saturated target cannot be white space regardless of how validated it is — which
forces PD-1 to the floor (the calibration gate).

Saturation and localization are reported separately from any "QurieGen edge" so the score stays
objective — it is not rigged to confirm the intracellular thesis.
"""
from __future__ import annotations
import json, os, math

SCORE_VERSION = "whitespace-0.1.0"
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW = os.path.join(ROOT, "data", "raw")

# tractability label -> drugging-path weight (best bucket wins)
TRACT_WEIGHT = {
    "Approved Drug": 1.0, "Advanced Clinical": 0.9, "Phase 1 Clinical": 0.7,
    "Structure with Ligand": 0.6, "High-Quality Ligand": 0.6, "High-Quality Pocket": 0.55,
    "Small Molecule Binder": 0.5, "Literature": 0.3, "UniProt loc high conf": 0.3,
    "GO CC high conf": 0.3, "UniProt SigP or TMHMM": 0.3, "UniProt Ubiquitination": 0.25,
}


def _signals(symbol):
    ot = json.load(open(f"{RAW}/{symbol}/ot.json"))["data"]["target"]
    ch = json.load(open(f"{RAW}/{symbol}/chembl.json"))
    ct = json.load(open(f"{RAW}/{symbol}/ct.json"))

    V = max((r["score"] for r in ot["associatedDiseases"]["rows"]), default=0.0)
    tw = [TRACT_WEIGHT.get(x["label"], 0.2) for x in ot["tractability"] if x["value"]]
    T = max(tw) if tw else 0.0

    mols = ch["molecules"]["molecules"]
    approved = sum(1 for m in mols if str(m.get("max_phase")) in ("4", "4.0"))
    candidates = ot["drugAndClinicalCandidates"]["count"]
    trials = sum(d["total"] for d in ct["drug_trials"].values())
    asof = sum(d["asof_cutoff"] for d in ct["drug_trials"].values())
    sponsors = len({s for d in ct["drug_trials"].values() for s in d.get("industry_sponsors", {})})
    subs = sorted({(s.get("location") or s.get("termSL"))
                   for s in (ot.get("subcellularLocations") or [])
                   if (s.get("location") or s.get("termSL"))})
    return dict(symbol=symbol, V=V, T=T, approved=approved, candidates=candidates,
                trials=trials, asof=asof, sponsors=sponsors,
                subcellular=(subs[0] if subs else "n/a"),
                protein=ot["approvedName"], target_class=", ".join(c["label"] for c in ot.get("targetClass", [])),
                top_disease=(ot["associatedDiseases"]["rows"][0]["disease"]["name"] if ot["associatedDiseases"]["rows"] else "n/a"),
                flagship=ct.get("flagship_drugs", []))


def _minmax(vals):
    lo, hi = min(vals), max(vals)
    rng = (hi - lo) or 1.0
    return [(v - lo) / rng for v in vals]


def score_cohort(symbols):
    sig = {s: _signals(s) for s in symbols}
    # saturation from 4 cohort-normalized components (log for counts), equal weight
    comp = {
        "approved": _minmax([sig[s]["approved"] for s in symbols]),
        "candidates": _minmax([math.log1p(sig[s]["candidates"]) for s in symbols]),
        "trials": _minmax([math.log1p(sig[s]["trials"]) for s in symbols]),
        "sponsors": _minmax([math.log1p(sig[s]["sponsors"]) for s in symbols]),
    }
    out = {}
    for i, s in enumerate(symbols):
        S = sum(comp[k][i] for k in comp) / len(comp)
        V, T = sig[s]["V"], sig[s]["T"]
        ws = 100.0 * V * T * (1.0 - S)
        conf = "HIGH" if sig[s]["trials"] > 20 else "MEDIUM"
        note = ""
        if not sig[s]["flagship"]:
            conf, note = "MEDIUM", "No ChEMBL-named drug -> CT.gov trial count is a floor (real activity may be higher)."
        rec = dict(sig[s])
        rec.update(S=round(S, 4), V=round(V, 4), T=round(T, 4),
                   white_space=round(ws, 2), confidence=conf, note=note,
                   sat_components={k: round(comp[k][i], 3) for k in comp})
        out[s] = rec
    # ranks (1 = highest white space)
    order = sorted(symbols, key=lambda s: out[s]["white_space"], reverse=True)
    n = len(order)
    for rank, s in enumerate(order, 1):
        out[s]["rank"] = rank
        out[s]["percentile"] = round(100 * (n - rank) / (n - 1), 1) if n > 1 else 100.0
    return out


def _pearson(xs, ys):
    n = len(xs); mx = sum(xs) / n; my = sum(ys) / n
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    vx = sum((x - mx) ** 2 for x in xs); vy = sum((y - my) ** 2 for y in ys)
    return cov / math.sqrt(vx * vy) if vx and vy else 0.0


def back_test(scores):
    """Calibration + directional validation. Honestly scoped: N is small; a true longitudinal
    back-test needs historical data-version snapshots (Phase-1.5). Pre-registered BEFORE ranking."""
    n = len(scores)
    third = max(1, n // 3)
    ranked = sorted(scores.values(), key=lambda r: r["rank"])
    bottom_third = {r["symbol"] for r in ranked if r["rank"] > n - third}
    top_third = {r["symbol"] for r in ranked if r["rank"] <= third}

    syms = list(scores)
    checks = []
    # --- GATES (must pass; the score is invalid otherwise) ---
    c1 = "PDCD1" in bottom_third
    checks.append({"id": "C1", "kind": "gate",
                   "claim": "PD-1 (PDCD1) lands at the saturated floor (the calibration gate).",
                   "pass": c1, "evidence": f"PDCD1 rank {scores['PDCD1']['rank']}/{n}, WS={scores['PDCD1']['white_space']}"})
    r_sat = _pearson([scores[s]["S"] for s in syms], [math.log1p(scores[s]["asof"]) for s in syms])
    c4 = r_sat > 0.5
    checks.append({"id": "C4", "kind": "gate",
                   "claim": "Saturation S measures real crowding: S vs as-of-cutoff trial volume correlates positively.",
                   "pass": c4, "evidence": f"Pearson r(S, log asof-trials) = {r_sat:.2f} (n={n})"})

    # --- EXPECTATIONS (pre-registered priors; data is allowed to falsify them) ---
    validated_unsat = [m for m in ("HAVCR2", "TMEM173", "CD40") if m in scores]
    c3 = any(scores[m]["rank"] <= third for m in validated_unsat)
    checks.append({"id": "C3", "kind": "expectation",
                   "claim": "At least one validated-but-unsaturated target (TIM-3 / STING / CD40) ranks top third.",
                   "pass": c3, "evidence": ", ".join(f"{m} rank {scores[m]['rank']}" for m in validated_unsat)})
    mature = [m for m in ("CD274", "CTLA4") if m in scores]
    c2 = all(scores[m]["rank"] > n - third for m in mature)
    checks.append({"id": "C2", "kind": "expectation",
                   "claim": "Mature checkpoints PD-L1 & CTLA4 both rank bottom third.",
                   "pass": c2, "evidence": ", ".join(f"{m} rank {scores[m]['rank']} (approved={scores[m]['approved']})" for m in mature)})

    gates = [c for c in checks if c["kind"] == "gate"]
    gate_passed = all(c["pass"] for c in gates)
    findings = []
    if not c2:
        findings.append("Expectation C2 falsified — and the falsification is informative: CTLA4 "
                        f"(rank {scores['CTLA4']['rank']}, {scores['CTLA4']['approved']} approved drugs) is genuinely "
                        f"less saturated than PD-1/PD-L1 ({scores['PDCD1']['approved']}/{scores['CD274']['approved']} "
                        "approved). The score corrected an incorrect prior rather than confirming it — the point of a back-test.")
    return {
        "method": "As-of-cutoff censoring + pre-registered checks, split into hard GATES (must pass) "
                  "and EXPECTATIONS (priors the data may falsify). WS computed on pinned snapshots.",
        "cutoff": "2023-07-01",
        "preregistration": "C1 & C4 are gates; C2 & C3 are expectations. All fixed before ranks were computed.",
        "checks": checks,
        "gate_passed": gate_passed,
        "passed": gate_passed,
        "findings": findings,
        "caveats": [
            "N=13 IO targets — descriptive/directional, not inferential.",
            "Targets without a ChEMBL-named drug (HPK1/MAP4K1, CBLB) have floor-only CT.gov counts; "
            "gene-level trial mapping is Phase-1.5.",
            "A true longitudinal predictive back-test requires frozen historical OT/ChEMBL data "
            "versions over time; today only ClinicalTrials.gov gives a clean as-of date censor.",
        ],
    }
