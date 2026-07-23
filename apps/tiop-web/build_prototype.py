"""
Generate a self-contained clickable experience prototype from the real fixtures.
Single HTML file, no server, no build step. Demonstrates the confirmed model:
one object, three depths (answer -> science -> evidence), continuous drill-down.

Plain language, no jargon, no buzzwords, no long dashes. For showing stakeholders.
"""
import json, os, html

HERE = os.path.dirname(__file__)
FIX = os.path.join(HERE, "public", "fixtures")
OUT = os.path.join(HERE, "..", "..", "tiop_experience_prototype.html")

cohort = json.load(open(f"{FIX}/cohort.json"))
targets = {}
for t in cohort["targets"]:
    targets[t["symbol"]] = json.load(open(f"{FIX}/target_{t['symbol']}.json"))

# plain-language reads per target (answer depth)
def plain_read(sym, t_summary, prof):
    rank = prof["white_space"]["cohort_rank"]
    n = prof["white_space"]["cohort_size"]
    intra = t_summary["group"] == "emerging_intracellular"
    if rank == n:
        return "Proven, but very crowded. We use this as our benchmark, not as an opening."
    if rank <= n // 3:
        if intra:
            return "Proven biology, still room to move, and it sits inside the cell where our platform has an edge."
        return "Proven biology with room still open in the field."
    if intra:
        return "Inside the cell and promising, but still early."
    return "Real biology with a moderate amount of competition."

def opp_tag(prof):
    rank = prof["white_space"]["cohort_rank"]; n = prof["white_space"]["cohort_size"]
    if rank == n: return ("Benchmark", "#6b7280")
    if rank <= n // 3: return ("Open", "#087443")
    if rank <= 2 * n // 3: return ("Some room", "#b45309")
    return ("Crowded", "#9a6a00")

DEV = {"Tclin": "Has an approved drug", "Tchem": "Has drugs in testing", "Tbio": "Studied, no drug yet"}
CONF = {"HIGH": "Strong data", "MEDIUM": "Some data gaps", "DERIVED": "Worked out from the data", "LOW": "Limited data"}

def fact(prof, field):
    return next((f for f in prof["facts"] if f["field"] == field), None)

def clean(s):
    """No long dashes anywhere in shown copy."""
    if s is None: return s
    return (str(s).replace(" — ", ", ").replace("—", ", ").replace(" – ", ", ")
            .replace("–", "-").replace(" , ", ", "))

def plain_qurie(v):
    v = str(v)
    if "High edge" in v:
        return "A strong fit for our platform: proven, not crowded, and inside the cell."
    if "White-space" in v or "opportunity" in v:
        return "An opening worth tracking."
    if "Benchmark" in v or "saturated" in v:
        return "We use this as a benchmark, not an opening."
    return clean(v)

# Build the data payload the page needs (kept small + plain)
_funnel = {"steps": cohort["funnel"]["steps"],
           "headline": "Of about 20,000 human proteins, only about 700 have ever produced an "
                       "approved drug. Most of the map is still open."}
payload = {"funnel": _funnel, "targets": []}
for t in sorted(cohort["targets"], key=lambda x: -x["white_space_score"]):
    sym = t["symbol"]; prof = targets[sym]
    comps = {c["name"][0]: c for c in prof["white_space"]["components"]}  # V/T/S by first letter
    V = comps["V"]["value"]; T = comps["T"]["value"]; S = comps["S"]["value"]
    tag, tagcolor = opp_tag(prof)
    def ff(field):
        f = fact(prof, field)
        if not f: return None
        val = plain_qurie(f["value"]) if field == "qurie_relevance" else clean(f["value"])
        return {"label": f["label"], "value": val, "confidence": CONF.get(f["confidence"], f["confidence"]),
                "note": clean(f.get("notes", "")), "source": f["data_prov"]["source"],
                "version": f["data_prov"]["data_version"], "date": f["data_prov"]["access_utc"][:10],
                "url": f["data_prov"]["record_url"], "reasoned": f.get("is_reasoned", False)}
    payload["targets"].append({
        "symbol": sym, "name": t["protein"], "read": plain_read(sym, t, prof),
        "opportunity": round(prof["white_space"]["score"], 1),
        "rank": prof["white_space"]["cohort_rank"], "n": prof["white_space"]["cohort_size"],
        "tag": tag, "tagcolor": tagcolor,
        "confidence": CONF.get(prof["white_space"]["confidence"], prof["white_space"]["confidence"]),
        "dev": DEV.get(t["development_level"], t["development_level"]),
        "bars": {"proven": round(V, 2), "druggable": round(T, 2), "room": round(1 - S, 2)},
        "science": {
            "how it works": ff("mechanism_moa"),
            "approved drugs": ff("approved_drugs"),
            "highest stage of testing": ff("highest_phase"),
            "companies working on it": ff("companies_developing"),
            "main diseases": ff("disease_indication"),
            "where it sits in the cell": ff("subcellular_location"),
            "why it matters to us": ff("qurie_relevance"),
        },
        "trust": {"repro": prof["trust"]["reproducibility_note"], "hash": prof["trust"]["content_hash"],
                  "versions": prof["trust"]["data_versions"]},
    })

DATA = json.dumps(payload)
funnel_headline = cohort["funnel"]["headline"].replace("—", ".").replace(" - ", ", ")

PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TIOP - where the open target opportunities are</title>
<style>
:root{--bg:#f6f7f9;--card:#fff;--line:#e6e8ec;--ink:#111827;--muted:#5b6472;--accent:#2f52c9;--open:#087443;}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:940px;margin:0 auto;padding:28px 20px 90px}
.brand{display:flex;align-items:baseline;gap:10px}
.brand b{font-size:20px;letter-spacing:-.01em}
.brand span{color:var(--muted);font-size:14px}
h1{font-size:26px;margin:18px 0 6px}
.lede{color:var(--muted);font-size:16px;margin:0 0 6px}
.how{background:#eef2fd;border:1px solid #d9e1fb;border-radius:12px;padding:12px 16px;margin:18px 0;font-size:14.5px;color:#33406b}
.how b{color:#26325c}
.section-title{font-size:13px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin:26px 0 12px}
.funnel{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 20px}
.frow{display:flex;align-items:center;gap:14px;margin:7px 0}
.frow .lab{min-width:180px;color:var(--muted);font-size:14px}
.frow .bar{height:30px;border-radius:8px;background:var(--accent);color:#fff;display:flex;align-items:center;padding:0 12px;font-weight:600;font-size:14px}
.fnote{font-weight:600;margin-top:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;margin:12px 0;overflow:hidden}
.head{display:flex;align-items:center;gap:16px;padding:16px 18px;cursor:pointer}
.head:hover{background:#fafbfc}
.sym{font-weight:700;font-size:17px;min-width:96px}
.sym small{display:block;color:var(--muted);font-weight:400;font-size:12.5px;margin-top:1px}
.read{flex:1;color:#2b3341;font-size:15px}
.tag{font-size:12px;font-weight:700;color:#fff;border-radius:999px;padding:3px 10px;white-space:nowrap}
.opp{text-align:right;min-width:74px}
.opp .num{font-size:24px;font-weight:800}
.opp .cap{font-size:11px;color:var(--muted)}
.body{display:none;padding:4px 18px 20px;border-top:1px solid var(--line)}
.body.open{display:block}
.why{margin:14px 0 6px;color:var(--muted);font-size:13px;text-transform:uppercase;letter-spacing:.06em}
.bars{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:8px}
.b .blab{font-size:13px;font-weight:600;margin-bottom:4px}
.b .track{height:9px;background:#eef0f3;border-radius:6px;overflow:hidden}
.b .fill{height:100%;background:var(--open)}
.b .bv{font-size:12px;color:var(--muted);margin-top:3px}
.formula{font-size:13.5px;color:#3a4353;background:#f3f5f9;border:1px solid var(--line);border-radius:8px;padding:8px 12px;margin:12px 0}
.frow2{display:grid;grid-template-columns:190px 1fr;gap:12px;padding:9px 0;border-top:1px solid var(--line);font-size:14.5px}
.frow2 .k{color:var(--muted);font-weight:600}
.frow2 .v .src{margin-left:8px;font-size:12px;color:var(--accent);cursor:pointer;user-select:none}
.srcbox{display:none;margin-top:5px;font-size:12.5px;color:var(--muted);background:#f7f8fa;border:1px solid var(--line);border-radius:7px;padding:6px 9px}
.srcbox.open{display:block}
.srcbox a{color:var(--accent);text-decoration:none}
.pill{display:inline-block;font-size:11px;color:#5b53b5;background:#ecebf9;border-radius:5px;padding:1px 6px;margin-left:6px;font-weight:700}
.trust{margin-top:14px;font-size:12.5px;color:var(--muted);background:#f7f8fa;border:1px dashed var(--line);border-radius:8px;padding:9px 12px}
footer{margin-top:34px;color:var(--muted);font-size:12.5px;text-align:center}
</style></head><body><div class="wrap">
<div class="brand"><b>TIOP</b><span>Target Intelligence and Opportunity Platform</span></div>
<h1>Where the open opportunities are in drug targets</h1>
<p class="lede">Immuno-oncology, ranked by how open the opportunity is. Start with the answer. Open any target to see the science. Open any number to see where it came from.</p>
<div class="how"><b>How to read this.</b> Each target has a plain summary and an opportunity score from 0 to 100. Higher means the biology is proven, it can be drugged, and the field is not yet crowded. Click a target to see the science behind the score. Click "source" on any fact to see exactly where it came from, with the version and date.</div>

<div class="section-title">The opportunity</div>
<div class="funnel" id="funnel"></div>

<div class="section-title">Immuno-oncology targets, ranked by opportunity</div>
<div id="list"></div>

<footer>Every number on this page traces to a public source (Open Targets, ChEMBL, ClinicalTrials.gov) with its version and date. The results regenerate exactly from the same data.</footer>
</div>
<script>
const DATA = __DATA__;
function esc(s){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}

// funnel
(function(){
  const f=DATA.funnel, max=Math.max(...f.steps.map(s=>s.value));
  let h="";
  f.steps.forEach(s=>{
    const w=Math.max(9,(s.value/max)*100);
    const txt="about "+s.value.toLocaleString();
    const inside = w>=24;
    h+=`<div class="frow"><div class="lab">${esc(s.label)}</div>
      <div class="bar" style="width:${w}%">${inside?txt:""}</div>
      ${inside?"":`<div style="font-weight:600;font-size:14px">${txt}</div>`}</div>`;
  });
  h+=`<div class="fnote">${esc(f.headline)}</div>`;
  document.getElementById('funnel').innerHTML=h;
})();

function srcLine(o){
  if(!o) return "";
  const reasoned = o.reasoned ? `<span class="pill">written by the system</span>` : "";
  return `<span class="src" onclick="this.nextElementSibling.classList.toggle('open')">source</span>${reasoned}
    <div class="srcbox">From <a href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.source)}</a>,
    version ${esc(o.version)}, read ${esc(o.date)}. Confidence: ${esc(o.confidence)}.${o.note?(" "+esc(o.note)):""}</div>`;
}

function card(t){
  let sci="";
  for(const [k,o] of Object.entries(t.science)){
    if(!o) continue;
    sci+=`<div class="frow2"><div class="k">${esc(k)}</div>
      <div class="v">${esc(o.value)} ${srcLine(o)}</div></div>`;
  }
  const b=t.bars;
  return `<div class="card">
    <div class="head" onclick="this.parentElement.querySelector('.body').classList.toggle('open')">
      <div class="sym">${esc(t.symbol)}<small>${esc(t.name)}</small></div>
      <div class="read">${esc(t.read)}</div>
      <div class="tag" style="background:${t.tagcolor}">${esc(t.tag)}</div>
      <div class="opp"><div class="num">${t.opportunity}</div><div class="cap">opportunity</div></div>
    </div>
    <div class="body">
      <div class="why">Why it scored this way</div>
      <div class="bars">
        <div class="b"><div class="blab">How proven the biology is</div><div class="track"><div class="fill" style="width:${b.proven*100}%"></div></div><div class="bv">${b.proven}</div></div>
        <div class="b"><div class="blab">Whether it can be drugged</div><div class="track"><div class="fill" style="width:${b.druggable*100}%"></div></div><div class="bv">${b.druggable}</div></div>
        <div class="b"><div class="blab">How much room is left</div><div class="track"><div class="fill" style="width:${b.room*100}%"></div></div><div class="bv">${b.room}</div></div>
      </div>
      <div class="formula">We rank a target higher when the biology is proven, it can be drugged, and the field is not yet crowded. ${esc(t.symbol)} ranks ${t.rank} of ${t.n}. ${esc(t.dev)}. ${esc(t.confidence)}.</div>
      ${sci}
      <div class="trust">You can trace every number above to its source. The result is reproducible: the same data gives the same answer every time (reference ${esc(t.trust.hash)}). Data versions: Open Targets ${esc(t.trust.versions.open_targets)}, ChEMBL ${esc(t.trust.versions.chembl)}, ClinicalTrials.gov ${esc(t.trust.versions.clinicaltrials)}.</div>
    </div>
  </div>`;
}
document.getElementById('list').innerHTML = DATA.targets.map(card).join("");
</script></body></html>"""

out = PAGE.replace("__DATA__", DATA)
with open(OUT, "w") as fh:
    fh.write(out)
print("wrote", os.path.abspath(OUT), len(out), "bytes;", len(payload["targets"]), "targets")
