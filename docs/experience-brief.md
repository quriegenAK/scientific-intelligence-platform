# TIOP Experience Brief

The design spec behind the prototype. One product, three depths, plain language. This is what
Cursor or a designer builds against, and what keeps every screen consistent.

## The model: one object, three depths

The user always looks at the same thing (the target list, or one target) and chooses how deep to
go. Depth is optional and continuous, never a separate app.

1. **The answer.** The plain conclusion first. A ranked list, a one-line read per target, a single
   opportunity score. A CBO or a sales lead can stop here and have what they need.
2. **The science.** Open a target to see why it scored that way: how proven the biology is, whether
   it can be drugged, how much room is left, plus mechanism, drugs, companies, trials, and diseases.
   An immunologist or R&D lead lives here.
3. **The evidence.** Open any single number to see exactly where it came from: the source, its
   version, the date, and a link. A diligence reviewer can verify every claim.

The connective tissue is the drill down. Any figure at any depth expands to the layer beneath it,
in place. That continuity is the product, and it is only possible because every fact carries its
provenance. Competitors cannot copy it without the trust layer.

## Who each depth serves

| Person | Starts at | Goes as deep as |
|---|---|---|
| CEO, CBO, finance, sales | The answer | The science, when they want the "why" |
| Immunologist, R&D, pharma director | The science | The evidence, to check a specific claim |
| Lab tech | The answer, in plain words | The science for the targets they run |
| Diligence reviewer | The evidence | Every source, version, and reconciliation |

One interface serves all of them because depth is a choice, not a mode. No logins, no personas, no
gated views.

## Language rules (non negotiable)

- Plain words first. "How crowded the field is", not "competitive saturation index". Keep the
  technical term as a quiet secondary label for scientists.
- One thing, one name, everywhere. A short glossary enforces it (below).
- No buzzwords. Never "AI powered", "revolutionary", "cutting edge", "next generation".
- No hype about the model. When the system writes a summary, say "written by the system from the
  sourced facts", not "AI generated".
- No long dashes. Use periods, commas, or "to" for ranges.
- Short sentences. If a scientist and a salesperson would both understand it, it passes.

## Plain-language glossary

| Say this | Not this |
|---|---|
| Opportunity score | White Space score |
| How proven the biology is | Validation |
| Whether it can be drugged | Tractability |
| How much room is left | 1 minus saturation |
| Has an approved drug | Tclin |
| Has drugs in testing | Tchem |
| Strong data / Some data gaps | HIGH / MEDIUM confidence |
| Written by the system from the sourced facts | AI generated |
| Source, version, date | Provenance record |

## Design rules

- Answer first on every screen. Depth is opt in.
- Every number is clickable to its source. Trust is shown, never asserted.
- Borrow craft from the best software (density, speed, hierarchy, restraint), not its look. The
  benchmark is legibility of trust and reasoning, not polish.
- Never show data that does not exist. Where a capability is not built yet (portfolio across areas,
  literature, the evidence graph), leave an honest placeholder, not fabricated content.
- Calm and neutral. Strong hierarchy, generous space, one accent color. Brand tokens swap in later.

## What is real now vs coming

Real now, built on the current data: the answer layer (ranked opportunities, funnel, one-line
reads), the science layer (mechanism, drugs, companies, trials, diseases, the score explained), and
the evidence layer (source, version, date, reconciliation, reproducibility).

Coming, needs a backend first: portfolio view across multiple disease areas, literature, biomarkers,
the evidence graph, and version history over time. Build the frame now, fill these as they land.
