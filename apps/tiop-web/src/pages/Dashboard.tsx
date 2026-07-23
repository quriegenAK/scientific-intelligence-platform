import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCohort, getTarget } from "../lib/api";
import type { TargetSummary, Fact, Provenance } from "../lib/contract";
import {
  clean, DEV_LEVEL, CONFIDENCE_PLAIN, opportunityTag, plainRead, plainQurie, SCIENCE_ROWS,
} from "../lib/plain";

export function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ["cohort"], queryFn: getCohort });
  const [q, setQ] = useState("");

  const ranked = useMemo(() => {
    if (!data) return [];
    return [...data.targets].sort((a, b) => b.white_space_score - a.white_space_score);
  }, [data]);

  if (isLoading) return <p style={{ color: "var(--text-muted)" }}>Loading…</p>;
  if (error || !data) return <p style={{ color: "var(--c-low)" }}>Could not load the data.</p>;

  const n = ranked.length;
  const shown = ranked.filter((t) =>
    (t.symbol + t.protein + t.group).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <h1 style={{ margin: "0 0 6px" }}>Where the open opportunities are in drug targets</h1>
      <p style={{ color: "var(--text-muted)", margin: "0 0 4px", fontSize: 16 }}>
        {data.therapeutic_area}, ranked by how open the opportunity is. Start with the answer.
        Open any target to see the science. Open any number to see where it came from.
      </p>
      <div style={howStyle}>
        <b>How to read this.</b> Each target has a plain summary and an opportunity score from 0 to 100.
        Higher means the biology is proven, it can be drugged, and the field is not yet crowded. Click a
        target to see the science behind the score. Click "source" on any fact to see exactly where it
        came from, with the version and date.
      </div>

      <SectionTitle>The opportunity</SectionTitle>
      <Funnel steps={data.funnel.steps} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "26px 0 12px" }}>
        <SectionTitle noMargin>{data.therapeutic_area} targets, ranked by opportunity</SectionTitle>
        <input placeholder="Search targets…" value={q} onChange={(e) => setQ(e.target.value)}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "6px 10px", color: "var(--text)", fontSize: 13, width: 200 }} />
      </div>

      {shown.map((t) => {
        const rank = ranked.indexOf(t) + 1;
        return <TargetCard key={t.symbol} t={t} rank={rank} n={n} />;
      })}

      <p style={{ marginTop: 34, color: "var(--text-muted)", fontSize: 12.5, textAlign: "center" }}>
        Every number here traces to a public source (Open Targets, ChEMBL, ClinicalTrials.gov) with its
        version and date. The results regenerate exactly from the same data.
      </p>
    </>
  );
}

function TargetCard({ t, rank, n }: { t: TargetSummary; rank: number; n: number }) {
  const [open, setOpen] = useState(false);
  const tag = opportunityTag(rank, n);
  const read = plainRead(t.group, rank, n);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, margin: "12px 0", overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", cursor: "pointer" }}>
        <div style={{ minWidth: 100 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{t.symbol}</div>
          <div style={{ color: "var(--text-muted)", fontSize: 12.5 }}>{t.protein}</div>
        </div>
        <div style={{ flex: 1, color: "#2b3341" }}>{read}</div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: tag.color, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{tag.label}</span>
        <div style={{ textAlign: "right", minWidth: 74 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{t.white_space_score.toFixed(1)}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>opportunity</div>
        </div>
      </div>
      {open && <Science symbol={t.symbol} rank={rank} n={n} dev={t.development_level} />}
    </div>
  );
}

function Science({ symbol, rank, n, dev }: { symbol: string; rank: number; n: number; dev: string }) {
  const { data: p, isLoading } = useQuery({ queryKey: ["target", symbol], queryFn: () => getTarget(symbol) });
  if (isLoading || !p) return <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>Loading the science…</div>;

  const comp = (needle: string) => p.white_space.components.find((c) => c.name.startsWith(needle))?.value ?? 0;
  const proven = comp("Validation"), druggable = comp("Tractability"), room = 1 - comp("Saturation");
  const fact = (field: string): Fact | undefined => p.facts.find((f) => f.field === field);
  const devPlain = DEV_LEVEL[dev] ?? dev;
  const confPlain = CONFIDENCE_PLAIN[p.white_space.confidence] ?? p.white_space.confidence;

  return (
    <div style={{ padding: "4px 18px 20px", borderTop: "1px solid var(--border)" }}>
      <div style={whyStyle}>Why it scored this way</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 8 }}>
        <Bar label="How proven the biology is" v={proven} />
        <Bar label="Whether it can be drugged" v={druggable} />
        <Bar label="How much room is left" v={room} />
      </div>
      <div style={formulaStyle}>
        We rank a target higher when the biology is proven, it can be drugged, and the field is not yet
        crowded. {symbol} ranks {rank} of {n}. {devPlain}. {confPlain}.
      </div>
      {SCIENCE_ROWS.map(([label, field]) => {
        const f = fact(field);
        if (!f) return null;
        const value = field === "qurie_relevance" ? plainQurie(f.value) : clean(f.value);
        return <ScienceRow key={field} label={label} value={value} prov={f.data_prov} conf={f.confidence} note={clean(f.notes)} reasoned={f.is_reasoned} />;
      })}
      <div style={trustStyle}>
        You can trace every number above to its source. The result is reproducible: the same data gives the
        same answer every time (reference {p.trust.content_hash}). Data versions: Open Targets {p.trust.data_versions.open_targets},
        ChEMBL {p.trust.data_versions.chembl}, ClinicalTrials.gov {p.trust.data_versions.clinicaltrials}.
      </div>
    </div>
  );
}

function ScienceRow({ label, value, prov, conf, note, reasoned }:
  { label: string; value: string; prov: Provenance; conf: string; note: string; reasoned: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 12, padding: "9px 0", borderTop: "1px solid var(--border)", fontSize: 14.5 }}>
      <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div>
        {value}
        <span onClick={() => setShow(!show)} style={{ marginLeft: 8, fontSize: 12, color: "var(--accent)", cursor: "pointer" }}>source</span>
        {reasoned && <span style={pillStyle}>written by the system</span>}
        {show && (
          <div style={srcBoxStyle}>
            From <a href={prov.record_url} target="_blank" rel="noopener noreferrer">{prov.source}</a>, version{" "}
            {prov.data_version}, read {prov.access_utc.slice(0, 10)}. Confidence: {CONFIDENCE_PLAIN[conf] ?? conf}.
            {note ? " " + note : ""}
          </div>
        )}
      </div>
    </div>
  );
}

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ height: 9, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${Math.round(v * 100)}%`, height: "100%", background: "var(--open)" }} />
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{v.toFixed(2)}</div>
    </div>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number; data_prov: Provenance }[] }) {
  const max = Math.max(...steps.map((s) => s.value));
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
      {steps.map((s) => {
        const w = Math.max(9, (s.value / max) * 100);
        const inside = w >= 24;
        const txt = "about " + s.value.toLocaleString();
        return (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 14, margin: "7px 0" }}>
            <div style={{ minWidth: 180, color: "var(--text-muted)", fontSize: 14 }}>{s.label}</div>
            <div style={{ height: 30, width: `${w}%`, borderRadius: 8, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", padding: "0 12px", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}>
              {inside ? txt : ""}
            </div>
            {!inside && <div style={{ fontWeight: 600, fontSize: 14 }}>{txt}</div>}
          </div>
        );
      })}
      <p style={{ fontWeight: 600, marginTop: 12, marginBottom: 0 }}>
        Of about 20,000 human proteins, only about 700 have ever produced an approved drug. Most of the map is still open.
      </p>
    </div>
  );
}

function SectionTitle({ children, noMargin }: { children: ReactNode; noMargin?: boolean }) {
  return <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-muted)", margin: noMargin ? 0 : "26px 0 12px" }}>{children}</div>;
}

const howStyle: CSSProperties = { background: "var(--accent-weak)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", margin: "18px 0", fontSize: 14.5, color: "var(--text)" };
const whyStyle: CSSProperties = { margin: "14px 0 6px", color: "var(--text-muted)", fontSize: 13, textTransform: "uppercase", letterSpacing: ".06em" };
const formulaStyle: CSSProperties = { fontSize: 13.5, color: "#3a4353", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", margin: "12px 0" };
const trustStyle: CSSProperties = { marginTop: 14, fontSize: 12.5, color: "var(--text-muted)", background: "var(--surface-2)", border: "1px dashed var(--border)", borderRadius: 8, padding: "9px 12px" };
const srcBoxStyle: CSSProperties = { marginTop: 5, fontSize: 12.5, color: "var(--text-muted)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 9px" };
const pillStyle: CSSProperties = { fontSize: 11, color: "#5b53b5", background: "#ecebf9", borderRadius: 5, padding: "1px 6px", marginLeft: 6, fontWeight: 700 };
