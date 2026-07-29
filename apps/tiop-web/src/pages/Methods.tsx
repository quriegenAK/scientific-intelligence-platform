import type { ReactNode } from "react";
import { Card } from "../components/ui";

// The methods, in the app, so the numbers are never a black box during a demo.
// Mirrors docs/TIOP-Scoring-Methods.docx.

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, padding: "9px 0", borderTop: "1px solid var(--border)", fontSize: 14.5 }}>
      <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>{k}</div>
      <div>{v}</div>
    </div>
  );
}

function Callout({ tone, children }: { tone: "warn" | "info" | "bad"; children: ReactNode }) {
  const c = tone === "warn" ? ["#fff6e6", "#b45309"] : tone === "bad" ? ["#fdeeee", "#b42318"] : ["#eef2fd", "#2f52c9"];
  return (
    <div style={{ background: c[0], borderLeft: `4px solid ${c[1]}`, borderRadius: 8, padding: "10px 14px", margin: "10px 0", fontSize: 14 }}>{children}</div>
  );
}

export function Methods() {
  return (
    <>
      <h1 style={{ marginTop: 0 }}>How the numbers are calculated</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: 720 }}>
        Nothing here is a black box. Each score is a transparent formula over public data, and every input
        has a named source you can click through to. The full version, with worked tables, is in the methods
        document; this page is the working reference.
      </p>

      <Card title="The opportunity score in one line">
        <p style={{ marginTop: 0 }}>Every target gets one number from 0 to 100:</p>
        <p style={{ textAlign: "center", fontSize: 20, fontWeight: 700, margin: "12px 0" }}>
          <code style={{ fontSize: 18 }}>Opportunity = 100 × V × T × (1 − S)</code>
        </p>
        <Row k="V: proven biology" v="How strongly the target is linked to disease." />
        <Row k="T: can it be drugged" v="Whether there is a credible way to make a drug against it." />
        <Row k="1 − S: room left" v="How little of the field is already taken." />
        <p style={{ marginBottom: 0 }}>
          Multiplied, not added, on purpose. All three must be reasonable. If any one is near zero, the
          opportunity is near zero, which is why the most-crowded checkpoint (PD-1) sits at the floor.
        </p>
      </Card>

      <Card title="Worked example: STING (TMEM173), rank 1">
        <Row k="V (proven biology)" v="0.7418" />
        <Row k="T (can be drugged)" v="0.90" />
        <Row k="1 − S (room left)" v="0.8359  (so crowding S = 0.1641)" />
        <Row k="Opportunity" v="100 × 0.7418 × 0.90 × 0.8359 = 55.81" />
        <Callout tone="warn">
          <b>The thing a scientist notices first:</b> the app shows the three parts rounded to two decimals
          (0.74, 0.90, 0.84). Multiplying those by hand gives 55.9, not 55.8. The engine uses full precision
          (0.7418 and 0.8359). The rounded values are for reading, not for re-deriving the score.
        </Callout>
      </Card>

      <Card title="V: Biological validation">
        <Row k="Exact definition" v="The single highest target-to-disease association score for this target in Open Targets. Range 0 to 1." />
        <Row k="Source" v="Open Targets, the Overall Association Score on the target's Associated Diseases page." />
        <Row k="What is inside it" v="Open Targets already combines genetics, known drugs, pathways, RNA expression, text mining, and animal models by a harmonic sum. We use their number, we do not recompute it." />
        <Row k="Assumption" v="We take the single strongest disease link, not a blend across diseases." />
      </Card>

      <Card title="T: Druggability">
        <Row k="Exact definition" v="The weight of the best tractability bucket that is true for the target, across all modalities. Range 0 to 1." />
        <Row k="Source" v="Open Targets tractability assessment." />
        <Row k="STING example" v="Its best bucket is 'Advanced Clinical' (weight 0.90), because STING agonists reached advanced trials." />
        <Row k="Weights (our heuristic)" v="Approved Drug 1.0, Advanced Clinical 0.9, Phase 1 0.7, Structure/Ligand 0.6, Pocket 0.55, Binder 0.5, hints 0.3, else 0.2. This mapping is our judgement and the input we most want reviewed." />
      </Card>

      <Card title="S: Field crowding (Competitive whitespace = 1 − S)">
        <Row k="Exact definition" v="The average of four crowding signals, each scaled 0 to 1 relative to the current 13 targets." />
        <Row k="The four signals" v="Approved drugs (ChEMBL), clinical candidates (Open Targets), trials (ClinicalTrials.gov), and distinct industry sponsors (ClinicalTrials.gov)." />
        <Row k="STING" v="approved 0.00, candidates 0.21, trials 0.16, sponsors 0.29 → S = 0.164, Room = 0.836." />
        <Row k="PD-1" v="Highest on all four → each scales to 1.0 → S = 1.0, Room = 0.0. The floor, by construction." />
        <Callout tone="bad">
          Two things to say out loud: crowding is measured <b>relative to these 13 targets</b>, so a target's
          Room can shift if the cohort changes; and trial and sponsor counts come from named drugs, so a very
          early target with no named drug yet reads as zero crowding, which is a floor, not a proven truth.
        </Callout>
      </Card>

      <Card title="The tags: Open, Some room, Crowded, Benchmark">
        <p style={{ marginTop: 0 }}>
          Not separate math. We rank all targets by opportunity and split the ranking into thirds. With 13
          targets: ranks 1 to 4 are <b style={{ color: "#0f8a4d" }}>Open</b>, 5 to 8 are{" "}
          <b style={{ color: "#d19100" }}>Some room</b>, 9 to 12 are <b style={{ color: "#e8730c" }}>Crowded</b>,
          and the single most crowded (PD-1) is the <b style={{ color: "#475569" }}>Benchmark</b>, used to
          calibrate the score, not offered as an opening. The colors follow the same green-to-red scale.
        </p>
        <p style={{ marginBottom: 0, color: "var(--text-muted)" }}>
          These are relative tiers within the cohort, not fixed score bands. Fixed bands are a one-line change if you prefer them.
        </p>
      </Card>

      <Card title="The Score check tab: how we test the score">
        <p style={{ marginTop: 0 }}>
          We fixed our expectations before computing any ranks, then checked them. Two are hard gates the
          score must pass; two are priors the data is allowed to overturn.
        </p>
        <Row k="Gate C1" v="PD-1 must land at the floor. Result: rank 13/13, score 0.0. PASS." />
        <Row k="Gate C4" v="Crowding must track real trial volume. Result: correlation r = 0.98. PASS." />
        <Row k="Expectation C3" v="A validated but uncrowded target should rank top third. Result: STING 1, TIM-3 2, CD40 4. PASS." />
        <Row k="Expectation C2" v="PD-L1 and CTLA4 should both rank bottom third. Result: FALSIFIED, CTLA4 ranked 7." />
        <Callout tone="info">
          We keep the failed check visible on purpose. CTLA4 has only 2 approved drugs versus 7 for PD-1, so
          it is genuinely less crowded and correctly ranks in the middle. The score corrected our assumption
          instead of flattering it, which is what earns a scientist's trust.
        </Callout>
      </Card>

      <Card title="Known limitations, and what we want your view on">
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text)" }}>
          <li style={{ marginBottom: 6 }}>Crowding is cohort-relative, not an absolute scale.</li>
          <li style={{ marginBottom: 6 }}>The tractability weights are our heuristic, open to revision.</li>
          <li style={{ marginBottom: 6 }}>Approvals come from ChEMBL, not yet directly from FDA and EMA (7 vs 11 for PD-1).</li>
          <li style={{ marginBottom: 6 }}>Very early targets read as zero crowding; they are marked with lower confidence.</li>
          <li style={{ marginBottom: 6 }}>Validation uses the single strongest disease link, not a blend.</li>
          <li style={{ marginBottom: 0 }}>Scores compare targets within immuno-oncology, not yet across therapeutic areas.</li>
        </ul>
        <p style={{ marginBottom: 0, marginTop: 12, color: "var(--text-muted)" }}>
          Use the Feedback button to tell us which of these choices you would change.
        </p>
      </Card>
    </>
  );
}
