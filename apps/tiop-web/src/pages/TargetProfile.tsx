import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getTarget } from "../lib/api";
import { Card, Tag } from "../components/ui";
import { FactRow, TrustStampPanel } from "../components/Provenance";
import { WhiteSpaceScoreCard } from "../components/WhiteSpace";
import { Markdown } from "../components/Markdown";

const TABS = ["Summary", "Executive Brief", "Scientific Dossier", "Provenance"] as const;
type Tab = (typeof TABS)[number];

export function TargetProfile() {
  const { symbol = "" } = useParams();
  const [tab, setTab] = useState<Tab>("Summary");
  const { data, isLoading, error } = useQuery({ queryKey: ["target", symbol], queryFn: () => getTarget(symbol) });

  if (isLoading) return <p style={{ color: "var(--text-muted)" }}>Loading {symbol}…</p>;
  if (error || !data) return <p style={{ color: "var(--c-low)" }}>Target {symbol} not found in cohort. <Link to="/">Back</Link></p>;

  const val = (f: string) => String(data.facts.find((x) => x.field === f)?.value ?? "—");

  return (
    <>
      <Link to="/" style={{ fontSize: 13 }}>← Landscape</Link>
      <div style={{ margin: "8px 0 var(--space-5)", display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>{data.symbol}</h1>
        <span style={{ color: "var(--text-muted)" }}>{val("protein")}</span>
        <Tag tone="accent">UniProt {data.uniprot}</Tag>
        <Tag>{data.ensembl}</Tag>
        <Tag tone={data.group === "emerging_intracellular" ? "accent" : "neutral"}>{data.group.replace(/_/g, " ")}</Tag>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: "var(--space-5)" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none", borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
            color: tab === t ? "var(--text)" : "var(--text-muted)", fontWeight: 600, fontSize: 13.5,
            padding: "8px 14px", cursor: "pointer", marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>

      {tab === "Summary" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "var(--space-5)" }}>
          <Card title="White Space Score"><WhiteSpaceScoreCard ws={data.white_space} /></Card>
          <Card title="At a glance">
            {[
              ["Development level", val("development_level")],
              ["Approved drugs", val("approved_drugs")],
              ["Mechanism", val("mechanism_moa")],
              ["Modality", val("modality")],
              ["Highest phase", val("highest_phase")],
              ["Companies", val("companies_developing")],
              ["Top indications", val("disease_indication")],
              ["Localization", val("subcellular_location")],
              ["QurieGen relevance", val("qurie_relevance")],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 10, padding: "7px 0", borderTop: "1px solid var(--border)" }}>
                <div style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 13 }}>{k}</div>
                <div style={{ fontSize: 13.5 }}>{v}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "Executive Brief" && (
        <Card title="Executive Brief — model-written over sourced facts"><Markdown md={data.executive_brief_md} /></Card>
      )}

      {tab === "Scientific Dossier" && (
        <Card title={`Scientific Dossier — ${data.facts.length} facts, provenance on every one`} pad={false}>
          <div style={{ padding: "0 var(--space-5) var(--space-3)" }}>
            {data.facts.map((f) => <FactRow key={f.field} f={f} />)}
          </div>
        </Card>
      )}

      {tab === "Provenance" && (
        <Card title="Scientific Trust Layer — reproducibility envelope"><TrustStampPanel t={data.trust} /></Card>
      )}
    </>
  );
}
