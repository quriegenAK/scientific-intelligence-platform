# Scientific Intelligence Platform

Monorepo for QurieGen's Scientific Intelligence Platform. **TIOP** (Target Intelligence &
Opportunity Platform) is the first product; reusable capabilities are extracted from it only
after a second independent consumer needs them (**platform by extraction, not declaration** —
see `docs/adr/0001-engineering-principles.md`).

## Layout

```
apps/
  tiop/            # backend: ingest, White Space score, back-test, FastAPI (contract v1)
  tiop-web/        # React + Vite + TS UI: Dashboard, Landscape, Target Profile, Score Validation
packages/          # shared libraries (contracts only, per ADR-0002) — composed in-process
  provenance/      # DataProvenance / ReasoningProvenance (the trust primitive)
  trust/           # Fact + TrustStamp (the Scientific Trust Layer)
  contracts/       # versioned Pydantic API models — the backend↔frontend seam
  adapters/        # Source.fetch() interface — the swappable data boundary
  evaluation/      # the 6-metric evaluation framework
docs/adr/          # architecture decision records (the durable reasoning)
data/raw/          # pinned source snapshots + manifests (the reproducible data version)
```

## Run the backend

```bash
pip install pydantic fastapi "uvicorn[standard]" pandas pyarrow --break-system-packages
python apps/tiop/ingest_io_cohort.py     # (re)pull the IO cohort into data/raw/  [network]
python apps/tiop/build_cohort.py         # score + back-test + build contract fixtures
uvicorn apps.tiop.api:app --reload       # serve contract v1 at http://localhost:8000
```

`build_cohort.py` is deterministic: re-running yields identical content hashes.

## Run the UI

```bash
cd apps/tiop-web
npm install
npm run dev        # http://localhost:5173  (static-fixture mode — demo-ready, no server needed)
# to consume the live API instead:
VITE_API_BASE=http://localhost:8000/api/v1 npm run dev
```

## Milestone status (this build)

| Piece | State |
|---|---|
| White Space Score (`whitespace-0.1.0`) | ✅ formula + cohort scores; PD-1 at floor |
| Back-test | ✅ gates passed; expectation C2 falsified (informative) |
| IO fan-out | ✅ 13 targets, real data, cached + provenance |
| API contract v1 | ✅ frozen Pydantic models + FastAPI |
| React shell + Target Profile | ✅ tabbed (Summary/Brief/Dossier/Provenance) + Dashboard + Score Validation |
| Trust Layer split | ✅ Data vs Reasoning provenance |

See `docs/adr/0003-white-space-score.md` for the score design, gates, and known limits.

## What's deliberately deferred

Evidence Graph UI (until a Neo4j backend exists — no simulated relationships), vector DB, MCP
server suite, published SDK, capability extraction (until the second agent — Computational
Biologist — needs it). Per ADR-0002 §5.
