// The single seam. Static-fixture mode by default (demo-ready, no server); set
// VITE_API_BASE to the FastAPI base (…/api/v1) to consume it live. UI never reaches
// past these functions into pipeline internals.
import type { CohortResponse, TargetProfile, BackTest } from "./contract";

const API_BASE = import.meta.env.VITE_API_BASE as string | undefined;
const STATIC = !API_BASE;
const BASE = API_BASE ?? "/fixtures";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export const getCohort = () =>
  get<CohortResponse>(STATIC ? `${BASE}/cohort.json` : `${BASE}/cohort`);

export const getTarget = (symbol: string) =>
  get<TargetProfile>(STATIC ? `${BASE}/target_${symbol.toUpperCase()}.json` : `${BASE}/targets/${symbol}`);

export const getBackTest = () =>
  get<BackTest>(STATIC ? `${BASE}/backtest.json` : `${BASE}/backtest`);

export const MODE = STATIC ? "static-fixtures (contract v1)" : `live:${BASE}`;
