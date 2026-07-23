import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getCohort } from "../lib/api";
import type { TargetSummary, FunnelStep } from "../lib/contract";
import { Card, ConfidenceBadge, Tag } from "../components/ui";
import { ProvenanceChip } from "../components/Provenance";

type SortKey = "white_space_score" | "symbol" | "approved_drugs_count";

function Funnel({ steps, headline }: { steps: FunnelStep[]; headline: string }) {
  const max = Math.max(...steps.map((s) => s.value));
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ minWidth: 160, color: "var(--text-muted)", fontSize: 13 }}>{s.label}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                width: `${Math.max(8, (s.value / max) * 100)}%`, height: 32, borderRadius: 8,
                background: "linear-gradient(90deg,var(--accent),color-mix(in srgb,var(--accent) 60%,white))",
                color: "#fff", display: "flex", alignItems: "center", padding: "0 12px", fontWeight: 600, fontSize: 13,
              }}>~{s.value.toLocaleString()}</div>
            </div>
            <ProvenanceChip p={s.data_prov} />
          </div>
        ))}
      </div>
      <p style={{ fontWeight: 600, marginTop: 14, marginBottom: 0 }}>{headline}</p>
    </div>
  );
}

export function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ["cohort"], queryFn: getCohort });
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("white_space_score");

  const rows = useMemo(() => {
    if (!data) return [];
    let r = data.targets.filter((t) =>
      (t.symbol + t.protein + t.group).toLowerCase().includes(q.toLowerCase()));
    r = [...r].sort((a, b) =>
      sort === "symbol" ? a.symbol.localeCompare(b.symbol)
        : (b[sort] as number) - (a[sort] as number));
    return r;
  }, [data, q, sort]);

  if (isLoading) return <p style={{ color: "var(--text-muted)" }}>Loading cohort…</p>;
  if (error || !data) return <p style={{ color: "var(--c-low)" }}>Failed to load cohort.</p>;

  return (
    <>
      <div style={{ marginBottom: "var(--space-5)" }}>
        <h1 style={{ margin: "0 0 4px" }}>Target Intelligence — {data.therapeutic_area}</h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          {data.targets.length} targets · White Space ranked · every figure traces to a versioned source · contract {data.contract_version}
        </p>
      </div>

      <Card title="The funnel — untapped opportunity"><Funnel steps={data.funnel.steps} headline={data.funnel.headline} /></Card>

      <Card title="Landscape Explorer" right={
        <input placeholder="Search targets…" value={q} onChange={(e) => setQ(e.target.value)}
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "6px 10px", color: "var(--text)", fontSize: 13, width: 220 }} />
      } pad={false}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                <Th onClick={() => setSort("symbol")} active={sort === "symbol"}>Target</Th>
                <th style={thStyle}>Class / localization</th>
                <th style={thStyle}>Dev</th>
                <Th onClick={() => setSort("approved_drugs_count")} active={sort === "approved_drugs_count"}>Approved</Th>
                <th style={thStyle}>Highest phase</th>
                <Th onClick={() => setSort("white_space_score")} active={sort === "white_space_score"}>White Space ▾</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t: TargetSummary) => (
                <tr key={t.symbol} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={tdStyle}>
                    <Link to={`/target/${t.symbol}`} style={{ fontWeight: 700 }}>{t.symbol}</Link>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{t.protein}</div>
                    <Tag tone={t.group === "emerging_intracellular" ? "accent" : "neutral"}>{t.group.replace(/_/g, " ")}</Tag>
                  </td>
                  <td style={tdStyle}>{t.target_class}<div style={{ color: "var(--text-muted)", fontSize: 12 }}>{t.subcellular}</div></td>
                  <td style={tdStyle}>{t.development_level}</td>
                  <td style={tdStyle}>{t.approved_drugs_count}</td>
                  <td style={tdStyle}>{t.highest_phase}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ScoreBar v={t.white_space_score} />
                      <ConfidenceBadge c={t.white_space_confidence} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

const thStyle: CSSProperties = { padding: "10px 14px", fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap" };
const tdStyle: CSSProperties = { padding: "10px 14px", verticalAlign: "top" };

function Th({ children, onClick, active }: { children: ReactNode; onClick: () => void; active: boolean }) {
  return <th onClick={onClick} style={{ ...thStyle, cursor: "pointer", color: active ? "var(--accent)" : "var(--text-muted)" }}>{children}</th>;
}

function ScoreBar({ v }: { v: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 96 }}>
      <span style={{ width: 60, height: 8, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden" }}>
        <span style={{ display: "block", width: `${v}%`, height: "100%", background: v >= 45 ? "var(--c-high)" : v >= 25 ? "var(--accent)" : "var(--text-muted)" }} />
      </span>
      <b>{v.toFixed(1)}</b>
    </span>
  );
}
