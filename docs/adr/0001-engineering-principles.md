# ADR-0001 — Engineering Principles

- Status: Accepted
- Date: 2026-07-23
- Deciders: Ash Khan (QurieGen), TIOP build session

## Context

We are building TIOP as the first product of a future Scientific Intelligence Platform that
will power AIVC. To keep decisions consistent as the system grows across many agents and
contributors, we fix a small set of load-bearing principles. Future ADRs are judged against these.

## Decision

The following principles govern all engineering decisions. They are ordered; when they
conflict, earlier wins.

1. **Platform by extraction, not declaration.** We build products; shared platform capabilities
   are extracted from working code, never designed up front against imagined consumers.
2. **Infrastructure follows validated questions.** No component is built before a question it
   answers has been produced and shown to matter.
3. **Reproducibility before intelligence.** A result that cannot be regenerated is not an asset.
   Pin data versions; make re-runs deterministic before adding cleverness on top.
4. **Evidence before conclusions.** Every conclusion is assembled from sourced evidence, not
   asserted. The reasoning layer speaks only over already-sourced facts.
5. **Every claim must be traceable.** Each fact carries source + version + date; each model-written
   claim additionally carries model + prompt version. No untraceable numbers ship.
6. **Shared implementations require two independent consumers.** Promote code to a shared package
   only when two independent applications have proven they need it. Contracts (schemas, interfaces)
   are the sole exception — their job is to exist before their second implementer.
7. **Optimize scientific trust over architectural elegance.** When a cleaner abstraction and a more
   trustworthy result conflict, trust wins. Pharma buys trust, not elegance.

## Consequences

- We will sometimes carry apparent duplication (a capability used by one app stays in that app)
  rather than extract prematurely. This is intended.
- Every artifact must expose its provenance and reproducibility, adding up-front cost that we accept
  as the core differentiator.
- Architecture debate is closed unless implementation experience produces a new ADR (see ADR-0002).
