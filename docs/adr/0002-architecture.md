# ADR-0002 — Platform Architecture (monorepo, Trust split, contract-first)

- Status: Accepted
- Date: 2026-07-23
- Supersedes: none · Relates to: ADR-0001

## Context

After Phase 0 (the PD-1 walking skeleton) validated deterministic ingestion, the adapter seam,
and the Trust Layer, we converged on how to grow TIOP into the Scientific Intelligence Platform
without the premature-platform trap.

## Decisions

### 1. Monorepo of Python packages, not microservices
One repo, `scientific-intelligence-platform/`. `apps/` hold deployables (`tiop`, `tiop-web`);
`packages/` hold **importable libraries** composed in-process. No network services until team
size, independent scaling, or deploy cadence forces extraction. New app folders are created only
when real code exists.

### 2. Shared packages = contracts only (for now)
Shared from day one because they are contracts, not speculative abstractions:
`provenance`, `trust`, `contracts` (API models), `adapters` (Source interface), `evaluation`.
Everything else (scoring, ingestion orchestration, graph, reasoning) stays inside `apps/tiop`
until a **second independent consumer** proves it should move (ADR-0001 §6).

### 3. Trust Layer split: DataProvenance vs ReasoningProvenance
`DataProvenance` (source, version, date, query, snapshot) attaches to **every** fact.
`ReasoningProvenance` (model, prompt, inputs hash) attaches **only** to model-produced facts.
Deterministic facts carry no model/prompt version — forcing it on them is noise that dilutes the
fields that matter.

### 4. Contract-first UI
`packages/contracts` (Pydantic v2, `CONTRACT_VERSION`) is the **only** seam between backend and
frontend. The React app consumes versioned API responses (or the frozen fixtures) and never reaches
into pipeline internals. Contract changes are deliberate and versioned.

### 5. Reordered roadmap
Extraction of shared capabilities happens **after** the second agent exists, not before — you
cannot correctly extract abstractions with one data point. Sequence: score+back-test → fan-out →
API → Target Profile → second agent (Computational Biologist) → **then** extract → graph/search/
copilot → AIVC OS.

## Consequences

- `apps/tiop` will hold code that "feels shared" (scoring, concrete adapters) until a second consumer
  appears. Accepted.
- The UI can be built in parallel with the backend safely, because both meet only at the versioned
  contract. UI always trails backend by one validated capability; no placeholder/fake-data surfaces.
- The Evidence Graph UI is deferred until a real Neo4j backend exists (no simulated relationships).
