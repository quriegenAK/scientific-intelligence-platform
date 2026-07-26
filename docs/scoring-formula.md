# TIOP Opportunity Score: Formula Reference

This document explains the opportunity score in full: the current version, the proposed
upgrade, what every symbol means, worked examples with real numbers, and what happens to the
formula as we add more data sources. It is written to be read by scientists and leadership.

Status: version 1 is live. Version 2 is proposed. Score code lives in `apps/tiop/scoring.py`
(`whitespace-0.1.0`). The plain-language, in-app version is on the Methods tab.

---

## 1. What the score answers

One question: where is the best unexploited opportunity? A target is a real opportunity only
when three things are true at the same time. The biology is proven, so there is something worth
drugging. The target is druggable, so acting on it is technically possible. And the field is
relatively open, so we are not the tenth group chasing it. The score turns those three questions
into one number from 0 to 100.

---

## 2. Version 1 (current, live)

### 2.1 The formula

```
Opportunity = 100 × V × T × (1 − S)
```

V, T and S are each a number from 0 to 1.

- **V** = how proven the biology is
- **T** = whether it can be drugged
- **S** = how crowded the field is, so **(1 − S)** = how much room is left

The three are multiplied, not added, on purpose. Multiplying means all three must be reasonable.
If any one is near zero, the whole score is near zero. Addition would let one strong factor hide
a fatal weakness. The times 100 only rescales the 0 to 1 product onto a friendly 0 to 100 range.

### 2.2 V: how proven the biology is

- **Where it comes from:** Open Targets, the most trusted public resource for target to disease
  evidence. Its association score already blends genetics, known drugs, pathways, gene activity,
  text mining, and animal models.
- **How we compute it:** we take the target's single strongest disease association as V.
- **Why chosen:** Open Targets is authoritative and open, so we use their number rather than
  inventing our own.
- **Example:** STING's strongest disease link scores 0.7418, so V = 0.74.

### 2.3 T: whether it can be drugged

- **Where it comes from:** Open Targets tractability assessment, which grades the evidence that a
  target can be hit by a small molecule or antibody.
- **How we compute it:** Open Targets sorts the evidence into levels. We take the highest level
  that is true for the target and map it to a number from 0 to 1 with this table:

  | Evidence level | Weight |
  |---|---|
  | Approved drug | 1.00 |
  | Advanced clinical | 0.90 |
  | Phase 1 clinical | 0.70 |
  | Structure with ligand / high-quality ligand | 0.60 |
  | High-quality pocket | 0.55 |
  | Small molecule binder | 0.50 |
  | Literature / location / structure hints | 0.30 |
  | Any other true level (default) | 0.20 |

- **The one judgement we added:** those weights are ours. This is the single input we most want
  scientists to review.
- **Example:** STING has drugs in advanced clinical trials, which we weight 0.90, so T = 0.90.

### 2.4 S: how crowded the field is (and 1 − S, the room left)

- **Where it comes from:** four public facts about how much drug work already surrounds the
  target:
  1. approved drugs against it (ChEMBL)
  2. drugs in the pipeline against it (Open Targets)
  3. clinical trials involving its drugs (ClinicalTrials.gov)
  4. distinct companies working on it (ClinicalTrials.gov)
- **How we compute it:** each of the four is scaled from 0 to 1, then averaged into one crowding
  number S. Room left is 1 − S.
- **Honest note:** today those four are scaled relative to the other targets on screen, so the
  busiest target is 1 and the quietest is 0. This makes S cohort-relative, which is one of the
  things version 2 fixes.
- **Example:** STING has almost no drugs, few trials, few companies. Its four scaled signals are
  approved 0.00, candidates 0.21, trials 0.16, sponsors 0.29, averaging S = 0.164, so room left
  is 0.836.

### 2.5 Worked examples

**STING (TMEM173), rank 1**

```
Opportunity = 100 × 0.7418 × 0.90 × 0.8359 = 55.81
```

High, because the biology is proven, it can be drugged, and the field is still open.

**PD-1 (PDCD1), the floor**

PD-1 is proven (V = 0.63) and very druggable (T = 1.0), but the field is completely saturated, so
its room left is 0. Anything times 0 is 0:

```
Opportunity = 100 × 0.63 × 1.0 × 0.0 = 0.0
```

This is deliberate. A crowded target is not an opportunity no matter how good the biology is, and
this is exactly why we use PD-1 as the calibration benchmark.

**A note on rounding.** The app shows the three parts rounded to two decimals (0.74, 0.90, 0.84).
Multiplying those by hand gives 55.9. The engine uses full precision (0.7418 and 0.8359), which
gives 55.81. The rounded values are for reading, not for re-deriving the score.

### 2.6 What version 1 deliberately does not do

- Crowding is cohort-relative, not absolute.
- The tractability weights are our judgement, not calibrated.
- Approvals come from ChEMBL, not directly from FDA and EMA.
- Validation uses the single strongest disease link, not a blend.
- The three factors are weighted equally, with no way to tune them.
- The score is a snapshot; it does not capture whether a field is heating up or cooling down.

Version 2 addresses each of these.

---

## 3. Version 2 (proposed upgrade)

### 3.1 The formula

```
Opportunity = 100 × V^a × T^b × (1 − S)^c × M × C
```

Same core as version 1, with two kinds of addition: weights on the three factors, and two new
multipliers.

### 3.2 The weights a, b, c

- **What they are:** how much each of the three factors matters. a on validation, b on
  tractability, c on openness.
- **Why:** today the three count equally. Weights let leadership decide that, for example,
  openness should matter more than raw validation, and the rankings update accordingly. It turns
  expert judgement into the model.
- **Default:** a = b = c = 1, which is exactly version 1.

### 3.3 M: momentum

- **What it is:** whether activity around a target is rising or falling over time, as a multiplier
  of roughly 0.8 to 1.2.
- **Why:** version 1 is a snapshot of where a target stands. Momentum adds which way it is moving.
  A validated, open target whose field is accelerating is a stronger and more timely opportunity
  than one that is open but static. Momentum is also what surfaces emerging targets early.
- **Where it will come from:** trial start dates over time, plus patents and earnings calls once
  those sources are connected.

### 3.4 C: confidence

- **What it is:** how solid the underlying data is, as a multiplier of roughly 0.7 to 1.
- **Why:** it gently lowers the score when the data is thin, so a target we know little about
  cannot outrank a well-evidenced one just because its gaps happen to look favourable.
- **Where it will come from:** how complete and how authoritative the inputs are for that target.

### 3.5 How V, T and S get measured better in version 2

- **V** becomes a blend of the target's top disease links, not just the single strongest, with
  extra weight on genetic and causal evidence, which is the kind scientists trust most.
- **T** keeps the Open Targets levels but calibrates the weights against real approved-target data
  instead of setting them by hand, and adds Pharos development level as a second authoritative
  source.
- **S** becomes absolute instead of cohort-relative, using fixed reference points for approvals,
  trials and companies, so scores are stable and comparable across any disease area, and approvals
  come straight from FDA and EMA.

### 3.6 Worked example (illustrative)

Version 2 lets you turn knobs. Suppose leadership decides openness should count more (c = 1.5),
STING's field is heating up (M = 1.1), and its data is moderately complete (C = 0.9). Using the
same V = 0.7418, T = 0.90, and room left 0.8359:

```
(1 − S)^1.5 = 0.8359^1.5 = 0.764
Opportunity = 100 × 0.7418 × 0.90 × 0.764 × 1.1 × 0.9 ≈ 50.5
```

The values of M and C here are illustrative; they show how the knobs work, not real measured
numbers yet. With all weights at 1 and M and C at 1, this collapses back to 55.81, the version 1
result.

### 3.7 Backward compatibility

Version 2 does not throw away version 1. Set a = b = c = 1 and M = C = 1 and you get today's exact
formula. So version 2 is a careful extension of a transparent, already back-tested base, not a new
black box.

---

## 4. Sources and the formula: what changes as we add Martina's sources

**The key idea: the formula stays the same, the inputs get better.** V, T, S, M and C are
normalized 0 to 1 signals. The score is always validation times tractability times openness, with
weights and the momentum and confidence multipliers. Adding sources does not change that sentence.
It changes how completely and how authoritatively we can measure each input. This is why the
platform is built with a swappable source boundary: a source can be added or replaced without
touching the scoring code.

Which source feeds which part:

| Source | Feeds | What it improves |
|---|---|---|
| Open Targets | V, T, S | Core validation, tractability, pipeline count (in use) |
| ChEMBL | S, T | Approved drugs, mechanisms (in use) |
| ClinicalTrials.gov (US) | S, M | Trials, sponsors, and trial dates for momentum (in use) |
| EU / WHO / UK trial registries | S, M | More complete trial and momentum coverage |
| FDA (Purple Book, accessdata) | S | Authoritative US approvals for absolute crowding |
| EMA (EPAR) | S | Authoritative EU approvals |
| Pharos | T, V | Calibrated development level and validation |
| TTD, DrugCentral | S, T | Corroboration of approvals and targets |
| PubMed, bioRxiv, literature | V, M | Deeper validation evidence and research momentum |
| Patents (Lens, WIPO, EPO, Google) | M | Early, emerging-target momentum before trials appear |
| Earnings calls, press, Fierce Pharma | M | Competitive momentum and early intent |

Reading the table: most new sources make the same three factors more complete and more
authoritative. A few unlock the version 2 features specifically. FDA and EMA are what make S
absolute and authoritative. Patents, earnings, and trial dates are what power momentum M. Pharos
is what calibrates T. So adding Martina's full source list is not a reason to rewrite the formula;
it is what lets us move from version 1 to version 2 with confidence.

One honest caveat: if a new source ever reveals a dimension of opportunity the three axes genuinely
miss, we would add a factor deliberately and version it, the same way we are moving from v1 to v2.
The core stays stable; changes are explicit and explainable.

---

## 5. Versioning

- **whitespace-0.1.0**: version 1, live. `Opportunity = 100 × V × T × (1 − S)`.
- **whitespace-0.2.0**: version 2, proposed. Adds weights and the momentum and confidence factors,
  and upgrades how V, T and S are measured. Ships as the supporting data sources are connected.

Every score in the app carries its score version, so any number can always be traced to the exact
formula and data that produced it.
