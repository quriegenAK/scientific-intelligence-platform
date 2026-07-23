"""Deterministic IO-cohort ingest. Resolves identifiers live (no hardcoded IDs),
pulls each target from Open Targets + ChEMBL + ClinicalTrials.gov, and caches raw
JSON per target under data/raw/<SYMBOL>/. Date-censored CT.gov counts feed the back-test.

Run once; downstream scoring reads the cache (reproducible).
"""
import json, os, time, urllib.request, urllib.parse, urllib.error, datetime
from collections import Counter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW = os.path.join(ROOT, "data", "raw")
OT_URL = "https://api.platform.opentargets.org/api/v4/graphql"
CHEMBL = "https://www.ebi.ac.uk/chembl/api/data"
CT = "https://clinicaltrials.gov/api/v2/studies"
CUTOFF = "2023-07-01"   # ~2 years before the 2026-07 "now" -> back-test censor date

# IO cohort: saturated surface checkpoints, co-stim receptors, emerging intracellular white-space candidates
COHORT = {
    "PDCD1": "saturated_checkpoint", "CD274": "saturated_checkpoint",
    "CTLA4": "saturated_checkpoint", "LAG3": "saturated_checkpoint",
    "HAVCR2": "saturated_checkpoint", "TIGIT": "saturated_checkpoint",
    "TNFRSF9": "costim_receptor", "TNFRSF4": "costim_receptor",
    "CD40": "costim_receptor", "ICOS": "costim_receptor",
    "MAP4K1": "emerging_intracellular", "CBLB": "emerging_intracellular",
    "TMEM173": "emerging_intracellular",
}


def _req(url, payload=None, tries=5):
    last = ""
    for i in range(tries):
        try:
            data = json.dumps(payload).encode() if payload else None
            req = urllib.request.Request(url, data=data, method=("POST" if payload else "GET"))
            req.add_header("User-Agent", "tiop-ingest/0.2")
            if payload: req.add_header("Content-Type", "application/json")
            return json.load(urllib.request.urlopen(req, timeout=60))
        except urllib.error.HTTPError as e:
            last = f"HTTP{e.code}:{e.read().decode()[:120]}"
        except Exception as e:
            last = f"{type(e).__name__}:{e}"
        time.sleep(1.5 * (i + 1))
    raise RuntimeError(f"failed after {tries}: {last}")


def resolve(symbol):
    q = """query($s:String!){ search(queryString:$s, entityNames:["target"]){
             hits{ id entity object{ ... on Target { approvedSymbol } } } } }"""
    r = _req(OT_URL, {"query": q, "variables": {"s": symbol}})
    for h in r["data"]["search"]["hits"]:
        obj = h.get("object") or {}
        if obj.get("approvedSymbol", "").upper() == symbol.upper():
            return h["id"]
    return r["data"]["search"]["hits"][0]["id"]  # best hit fallback


OT_Q = """query($id:String!){ target(ensemblId:$id){
  id approvedSymbol approvedName biotype
  proteinIds{ id source }
  targetClass{ id label level }
  subcellularLocations{ location termSL }
  tractability{ label modality value }
  associatedDiseases(page:{index:0,size:10}){ count rows{ disease{ id name } score } }
  drugAndClinicalCandidates{ count rows{ maxClinicalStage drug{ id name drugType maximumClinicalStage } } }
} }"""


def pull_ot(ens):
    return _req(OT_URL, {"query": OT_Q, "variables": {"id": ens}})


def pull_chembl(uniprot):
    tg = _req(f"{CHEMBL}/target.json?target_components__accession={uniprot}&limit=50")
    single = [t for t in tg["targets"] if t["target_type"] == "SINGLE PROTEIN"]
    if not single:
        return {"target_chembl_id": None, "mechanisms": {"mechanisms": []}, "molecules": {"molecules": []}}
    tcid = single[0]["target_chembl_id"]
    mech = _req(f"{CHEMBL}/mechanism.json?target_chembl_id={tcid}&limit=1000")
    mols = {"molecules": []}
    ids = sorted({m["molecule_chembl_id"] for m in mech["mechanisms"] if m.get("molecule_chembl_id")})
    for i in range(0, len(ids), 15):
        chunk = ",".join(ids[i:i + 15])
        d = _req(f"{CHEMBL}/molecule.json?molecule_chembl_id__in={chunk}&limit=1000")
        mols["molecules"].extend(d["molecules"])
    return {"target_chembl_id": tcid, "mechanisms": mech, "molecules": mols}


def ct_counts(drug):
    """total trials, trials as-of cutoff, industry sponsors (sampled)."""
    total = _req(f"{CT}?{urllib.parse.urlencode({'query.intr': drug, 'pageSize': 1, 'countTotal': 'true'})}")
    asof_params = {"query.intr": drug, "pageSize": 1, "countTotal": "true",
                   "filter.advanced": f"AREA[StudyFirstPostDate]RANGE[MIN,{CUTOFF}]"}
    asof = _req(f"{CT}?{urllib.parse.urlencode(asof_params)}")
    samp = _req(f"{CT}?{urllib.parse.urlencode({'query.intr': drug, 'fields': 'LeadSponsorName,LeadSponsorClass', 'pageSize': 200, 'sort': 'StudyFirstPostDate:asc'})}")
    spons = Counter()
    for s in samp.get("studies", []):
        sp = s["protocolSection"].get("sponsorCollaboratorsModule", {}).get("leadSponsor", {})
        if sp.get("class") == "INDUSTRY" and sp.get("name"):
            spons[sp["name"]] += 1
    return {"total": total.get("totalCount", 0), "asof_cutoff": asof.get("totalCount", 0),
            "industry_sponsors": dict(spons.most_common(10))}


def main():
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    versions = {}
    index = {}
    for symbol, group in COHORT.items():
        tdir = os.path.join(RAW, symbol)
        os.makedirs(tdir, exist_ok=True)
        print(f"[{symbol}] resolving...", end=" ", flush=True)
        ens = resolve(symbol)
        ot = pull_ot(ens)
        t = ot["data"]["target"]
        uniprot = next((p["id"] for p in t["proteinIds"] if p["source"] == "uniprot_swissprot"), None)
        json.dump(ot, open(os.path.join(tdir, "ot.json"), "w"))
        ch = pull_chembl(uniprot) if uniprot else {"target_chembl_id": None, "mechanisms": {"mechanisms": []}, "molecules": {"molecules": []}}
        json.dump(ch, open(os.path.join(tdir, "chembl.json"), "w"))

        # flagship drugs: top by ChEMBL phase, else OT candidates
        mols = ch["molecules"]["molecules"]
        def ph(x):
            try: return float(x.get("max_phase") or 0)
            except: return 0.0
        flagship = [ (m.get("pref_name") or m["molecule_chembl_id"]) for m in
                     sorted(mols, key=ph, reverse=True)[:5] if m.get("pref_name") ]
        if not flagship:  # emerging targets: use OT candidate names
            flagship = [r["drug"]["name"] for r in t["drugAndClinicalCandidates"]["rows"][:5]]
        ctd = {}
        for dg in flagship[:5]:
            try:
                ctd[dg] = ct_counts(dg)
            except Exception as e:
                ctd[dg] = {"total": 0, "asof_cutoff": 0, "industry_sponsors": {}, "error": str(e)[:80]}
        json.dump({"cutoff": CUTOFF, "flagship_drugs": flagship, "drug_trials": ctd},
                  open(os.path.join(tdir, "ct.json"), "w"))

        index[symbol] = {"ensembl": ens, "uniprot": uniprot, "group": group,
                         "chembl_target": ch["target_chembl_id"], "flagship_drugs": flagship}
        print(f"ens={ens} uniprot={uniprot} chembl={ch['target_chembl_id']} drugs={len(flagship)}")

    ot_meta = _req(OT_URL, {"query": "{ meta{ dataVersion{ year month } } }"})
    dv = ot_meta["data"]["meta"]["dataVersion"]
    versions = {"open_targets": f"{dv['year']}.{dv['month']}", "chembl": "ChEMBL_37",
                "clinicaltrials": "API 2.0.5", "ct_cutoff": CUTOFF}
    json.dump({"captured_utc": now, "versions": versions, "cohort": index},
              open(os.path.join(RAW, "_cohort_manifest.json"), "w"), indent=2)
    print("\nDONE. cohort manifest ->", os.path.join(RAW, "_cohort_manifest.json"))


if __name__ == "__main__":
    main()
