# ADR-0003 — White Space Score v0.1 and its validation

- Status: Accepted (v0.1, calibration-gated) · Date: 2026-07-23 · Relates to: ADR-0001 §3, §5

## Context

The White Space Score is the first proprietary TIOP score and the Phase-1 gate. Per the founding
brief, "a formula is marketing; a back-tested score is intelligence." It must be transparent,
provenance-backed, and validated — and must place PD-1 (the saturated benchmark) at the floor.

## Decision

**Formula (app-specific IP, lives in `apps/tiop/scoring.py`, `whitespace-0.1.0`):**

    WS = 100 · V · T · (1 − S)

- **V — Validation**: Open Targets max disease-association score. How established the biology is.
- **T — Tractability**: Open Targets tractability, best drugging-path bucket. Is there a viable modality.
- **S — Saturation**: cohort-normalized blend of ChEMBL approvals + candidates and ClinicalTrials.gov
  trial volume + industry-sponsor diversity. How crowded.

Multiplicative on purpose: a target is white space only if validated **and** tractable **and**
uncrowded. Crowding drives the score down regardless of validation — which forces PD-1 to the floor.

**Validation via as-of-cutoff censoring** (cutoff 2023-07-01), split into:
- **Gates (must pass):** C1 — PD-1 at the floor. C4 — S correlates with as-of trial volume (crowding is real).
- **Expectations (priors the data may falsify):** C2, C3 — specific rank expectations.

## Outcome (IO cohort, n=13)

Gates **passed**: PD-1 rank 13/13 (WS 0.0); r(S, log as-of-trials) = 0.98. Expectation **C2 falsified**
and the falsification was informative: CTLA4 (2 approved drugs) is genuinely less saturated than
PD-1/PD-L1 (7/5), so the score corrected an incorrect prior. Top white space: STING (TMEM173), TIM-3
(HAVCR2), ICOS, CD40.

## Consequences & known limits

- Score is **cohort-relative** (saturation is min-max normalized within the cohort); comparing across
  therapeutic areas requires a shared reference set. Documented, not hidden.
- Targets without a ChEMBL-named drug (HPK1/MAP4K1, CBLB) get floor-only trial counts → their
  saturation is a floor and their score confidence is MEDIUM. Gene-level trial mapping is Phase-1.5.
- A true **longitudinal predictive** back-test needs frozen historical OT/ChEMBL data versions over
  time; only ClinicalTrials.gov currently offers a clean as-of censor. This is the next hardening step.
- Localization / "QurieGen edge" is reported **separately** from WS so the score stays objective and
  is not rigged to confirm the intracellular thesis.
