import type { WhiteSpaceScore } from "../lib/contract";
import { ConfidenceBadge } from "./ui";
import { ProvenanceChip } from "./Provenance";

function scoreColor(v: number) {
  // 0 (saturated) -> muted; high (white space) -> accent
  if (v >= 45) return "var(--c-high)";
  if (v >= 25) return "var(--accent)";
  return "var(--text-muted)";
}

export function WhiteSpaceScoreCard({ ws }: { ws: WhiteSpaceScore }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: scoreColor(ws.score), lineHeight: 1 }}>
          {ws.score.toFixed(1)}
        </div>
        <div style={{ color: "var(--text-muted)" }}>
          / 100 · rank <b style={{ color: "var(--text)" }}>{ws.cohort_rank}</b>/{ws.cohort_size} · {ws.percentile.toFixed(0)}th pct
        </div>
        <ConfidenceBadge c={ws.confidence} />
      </div>
      <p style={{ marginTop: 8, marginBottom: 14 }}>{ws.interpretation}</p>
      <code style={{ display: "inline-block", marginBottom: 14 }}>{ws.formula}</code>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ws.components.map((c) => (
          <div key={c.name}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <span>{c.value.toFixed(2)}</span>
            </div>
            <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ width: `${Math.round(c.value * 100)}%`, height: "100%", background: "var(--accent)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
              <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{c.inputs}</span>
              <ProvenanceChip p={c.data_prov} />
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 12, marginBottom: 0 }}>
        Score version <code>{ws.score_version}</code>. Multiplicative — crowding lowers the score even when biology is validated.
      </p>
    </div>
  );
}
