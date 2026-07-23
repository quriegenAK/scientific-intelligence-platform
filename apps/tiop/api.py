"""
Thin TIOP API — serves the frozen contract (packages/contracts, v1).

The API is a thin read layer over the built fixtures; all IP (scoring, assembly) is upstream and
deterministic. The React app consumes ONLY these endpoints — never pipeline internals (ADR-0002 §5).

    uvicorn apps.tiop.api:app --reload
"""
import json, os, sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "packages", "contracts"))
import contracts as C  # noqa

FIX = os.path.join(ROOT, "apps", "tiop-web", "public", "fixtures")


def _load(name):
    with open(os.path.join(FIX, name)) as fh:
        return json.load(fh)


app = FastAPI(title="TIOP API", version=C.CONTRACT_VERSION,
              description="Target Intelligence & Opportunity Platform — contract v1")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "contract_version": C.CONTRACT_VERSION}


@app.get("/api/v1/cohort", response_model=C.CohortResponseModel)
def cohort():
    """Dashboard + Landscape Explorer feed: funnel + all target summaries."""
    return _load("cohort.json")


@app.get("/api/v1/targets/{symbol}", response_model=C.TargetProfileModel)
def target(symbol: str):
    """Target Profile: facts + white space + brief + trust (powers the tabbed page)."""
    path = os.path.join(FIX, f"target_{symbol.upper()}.json")
    if not os.path.exists(path):
        raise HTTPException(404, f"target {symbol} not in cohort")
    return _load(f"target_{symbol.upper()}.json")


@app.get("/api/v1/backtest", response_model=C.BackTestModel)
def backtest():
    """Score validation: gates, expectations, findings, caveats."""
    return _load("backtest.json")
