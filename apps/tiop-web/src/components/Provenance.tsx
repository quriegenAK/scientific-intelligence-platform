// The reusable Trust/Provenance component — embedded on every fact and score input
// across the app, NOT a standalone page (ADR-0002 §7). This is the differentiator made
// visible: every claim carries its source, version, date, and reasoning lineage.
import { useState } from "react";
import type { Fact, Provenance, TrustStamp } from "../lib/contract";
import { ConfidenceBadge } from "./ui";

export function ProvenanceChip({ p }: { p: Provenance }) {
  return (
    <a href={p.record_url} target="_blank" rel="noopener noreferrer"
       title={`${p.query}\nsnapshot: ${p.snapshot}`}
       style={{ fontSize: 12, whiteSpace: "nowrap" }}>
      {p.source} <span style={{ color: "var(--text-muted)" }}>v{p.data_version} · {p.access_utc.slice(0, 10)}</span>
    </a>
  );
}

export function FactRow({ f }: { f: Fact }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: "1px solid var(--border)", padding: "11px 0", display: "grid", gridTemplateColumns: "200px 1fr 210px", gap: 12 }}>
      <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>{f.label}</div>
      <div>
        <div style={{ fontWeight: 600 }}>{String(f.value)}</div>
        {f.derivation && <div style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 4 }}><b>Derivation:</b> {f.derivation}</div>}
        {f.notes && <div style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 4 }}>{f.notes}</div>}
        <button onClick={() => setOpen(!open)} style={{
          marginTop: 6, background: "none", border: "none", color: "var(--accent)",
          cursor: "pointer", fontSize: 12, padding: 0 }}>
          {open ? "hide provenance" : "provenance"}
        </button>
        {open && (
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <div><b>Query:</b> <code>{f.data_prov.query}</code></div>
            <div style={{ marginTop: 4 }}><b>Snapshot:</b> <code>{f.data_prov.snapshot}</code></div>
            {f.reasoning_prov && (
              <div style={{ marginTop: 4 }}>
                <b>Reasoning:</b> <code>{f.reasoning_prov.model_version}</code> / <code>{f.reasoning_prov.prompt_version}</code>
                {" "}({f.reasoning_prov.reasoning_kind}, inputs {f.reasoning_prov.inputs_hash})
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12.5 }}>
        <div style={{ marginBottom: 4, display: "flex", gap: 6, alignItems: "center" }}>
          <ConfidenceBadge c={f.confidence} />
          {f.is_reasoned && <span style={{ fontSize: 10.5, color: "var(--c-derived)", fontWeight: 700 }}>MODEL</span>}
        </div>
        <ProvenanceChip p={f.data_prov} />
      </div>
    </div>
  );
}

export function TrustStampPanel({ t }: { t: TrustStamp }) {
  const items: [string, string][] = [
    ["Pipeline", t.pipeline_version],
    ["Model", t.model_version || "—"],
    ["Prompt", t.prompt_version || "—"],
    ["Open Targets", t.data_versions.open_targets],
    ["ChEMBL", t.data_versions.chembl],
    ["ClinicalTrials", t.data_versions.clinicaltrials],
    ["Reproducible", t.reproducible ? "yes" : "no"],
    ["Content hash", t.content_hash],
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        {items.map(([k, v]) => (
          <div key={k} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>{k}</div>
            <div style={{ fontFamily: k === "Content hash" ? "var(--font-mono)" : "inherit", fontWeight: 600, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 12, marginBottom: 0 }}>{t.reproducibility_note}</p>
    </div>
  );
}
