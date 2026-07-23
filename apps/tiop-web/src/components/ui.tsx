import type { ReactNode } from "react";
import type { Confidence } from "../lib/contract";

const CONF: Record<Confidence, { fg: string; bg: string; label: string }> = {
  HIGH: { fg: "var(--c-high)", bg: "var(--c-high-bg)", label: "HIGH" },
  MEDIUM: { fg: "var(--c-medium)", bg: "var(--c-medium-bg)", label: "MEDIUM" },
  DERIVED: { fg: "var(--c-derived)", bg: "var(--c-derived-bg)", label: "DERIVED" },
  LOW: { fg: "var(--c-low)", bg: "var(--c-low-bg)", label: "LOW" },
};

export function ConfidenceBadge({ c }: { c: Confidence }) {
  const s = CONF[c] ?? CONF.LOW;
  return (
    <span style={{
      color: s.fg, background: s.bg, borderRadius: 6, padding: "1px 7px",
      fontSize: 11, fontWeight: 700, letterSpacing: ".02em", whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

export function Card({ title, right, children, pad = true }:
  { title?: ReactNode; right?: ReactNode; children: ReactNode; pad?: boolean }) {
  return (
    <section style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", boxShadow: "var(--shadow)", marginBottom: "var(--space-5)",
    }}>
      {title && (
        <header style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "var(--space-3) var(--space-5)", borderBottom: "1px solid var(--border)",
        }}>
          <h2 style={{ margin: 0, fontSize: 13, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-muted)" }}>{title}</h2>
          {right}
        </header>
      )}
      <div style={{ padding: pad ? "var(--space-5)" : 0 }}>{children}</div>
    </section>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 12,
      background: tone === "accent" ? "var(--accent-weak)" : "var(--surface-2)",
      color: tone === "accent" ? "var(--accent)" : "var(--text-muted)",
      border: "1px solid var(--border)", borderRadius: 999, padding: "2px 10px",
      marginRight: 6, marginBottom: 4,
    }}>{children}</span>
  );
}
