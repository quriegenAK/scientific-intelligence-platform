"""Regression guards: the score gates and reproducibility must hold. Wire into CI (ADR-0001 §3)."""
import os, sys, json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for p in ("provenance", "trust", "contracts"):
    sys.path.insert(0, os.path.join(ROOT, "packages", p))
sys.path.insert(0, os.path.join(ROOT, "apps", "tiop"))

from scoring import score_cohort, back_test  # noqa


def _cohort():
    man = json.load(open(os.path.join(ROOT, "data", "raw", "_cohort_manifest.json")))
    return list(man["cohort"])


def test_pd1_at_floor():
    sc = score_cohort(_cohort())
    assert sc["PDCD1"]["rank"] == len(sc), "PD-1 must be the saturated floor (calibration gate)"
    assert sc["PDCD1"]["white_space"] == 0.0


def test_back_test_gates_pass():
    sc = score_cohort(_cohort())
    bt = back_test(sc)
    gates = [c for c in bt["checks"] if c["kind"] == "gate"]
    assert gates and all(c["pass"] for c in gates), "all back-test GATES must pass"
    assert bt["gate_passed"] is True


def test_score_is_deterministic():
    a = score_cohort(_cohort())
    b = score_cohort(_cohort())
    assert {k: a[k]["white_space"] for k in a} == {k: b[k]["white_space"] for k in b}


def test_saturation_validates_against_trials():
    # C4 gate: saturation must correlate with real trial volume
    sc = score_cohort(_cohort())
    bt = back_test(sc)
    c4 = next(c for c in bt["checks"] if c["id"] == "C4")
    assert c4["pass"], "saturation must track real crowding"
