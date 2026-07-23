import { useQuery } from "@tanstack/react-query";
import { getBackTest } from "../lib/api";
import { Card } from "../components/ui";

export function BackTestPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["backtest"], queryFn: getBackTest });
  if (isLoading) return <p style={{ color: "var(--text-muted)" }}>Loading…</p>;
  if (error || !data) return <p style={{ color: "var(--c-low)" }}>Failed to load back-test.</p>;

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Score Validation — Back-test</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: 760 }}>{data.method}</p>

      <Card title={`Gates & expectations — cutoff ${data.cutoff}`}>
        <p style={{ marginTop: 0, fontSize: 13, color: "var(--text-muted)" }}>{data.preregistration}</p>
        {data.checks.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
            <span style={{
              fontWeight: 800, fontSize: 12, color: c.pass ? "var(--c-high)" : "var(--c-low)",
              minWidth: 42,
            }}>{c.pass ? "PASS" : "FAIL"}</span>
            <div>
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: c.kind === "gate" ? "var(--accent)" : "var(--text-muted)" }}>
                {c.id} · {c.kind}
              </div>
              <div style={{ fontWeight: 600 }}>{c.claim}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{c.evidence}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: data.passed ? "var(--c-high-bg)" : "var(--c-low-bg)", color: data.passed ? "var(--c-high)" : "var(--c-low)", fontWeight: 700 }}>
          {data.passed ? "GATES PASSED — the score is calibrated (PD-1 at the floor; saturation tracks real crowding)." : "GATE FAILED — score not validated."}
        </div>
      </Card>

      {data.findings && data.findings.length > 0 && (
        <Card title="Findings — what the back-test taught">
          {data.findings.map((f, i) => <p key={i} style={{ marginTop: i ? 12 : 0 }}>{f}</p>)}
        </Card>
      )}

      <Card title="Caveats — stated, not hidden">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {data.caveats.map((c, i) => <li key={i} style={{ marginBottom: 6, color: "var(--text-muted)" }}>{c}</li>)}
        </ul>
      </Card>
    </>
  );
}
