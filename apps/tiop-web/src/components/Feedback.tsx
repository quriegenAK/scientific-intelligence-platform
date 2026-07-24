import { useState } from "react";

// Collects scientist feedback from the live app. Posts to a Formspree endpoint if one is
// configured (VITE_FEEDBACK_URL), otherwise falls back to opening an email. Static-host safe.
const ENDPOINT = (import.meta.env.VITE_FEEDBACK_URL as string | undefined) || "";
const FALLBACK_EMAIL = "kinga@quriegen.com";

export function Feedback() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const context = typeof window !== "undefined" ? window.location.hash || "#/" : "";

  async function submit() {
    if (!msg.trim()) return;
    if (!ENDPOINT) {
      const body = encodeURIComponent(`${msg}\n\n---\nFrom: ${name || "anonymous"}\nPage: ${context}`);
      window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent("TIOP feedback")}&body=${body}`;
      setState("done");
      return;
    }
    setState("sending");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ message: msg, name, page: context, product: "TIOP" }),
      });
      setState(res.ok ? "done" : "error");
    } catch { setState("error"); }
  }

  return (
    <>
      <button onClick={() => { setOpen(true); setState("idle"); }} style={{
        position: "fixed", right: 20, bottom: 20, zIndex: 40,
        background: "var(--accent)", color: "#fff", border: "none", borderRadius: 999,
        padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
        boxShadow: "0 4px 14px rgba(47,82,201,.35)",
      }}>Feedback</button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(16,24,40,.35)", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow)", padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <b style={{ fontSize: 15 }}>Share feedback</b>
              <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>
            {state === "done" ? (
              <p style={{ color: "var(--c-high)", margin: "12px 0" }}>Thank you. Your feedback was sent.</p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 0 }}>
                  Tell us what to change: the scores, the wording, a target, anything. This page: <code>{context}</code>
                </p>
                <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Your comment…"
                  style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", resize: "vertical", background: "var(--surface)", color: "var(--text)" }} />
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
                  style={{ width: "100%", marginTop: 8, border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", fontSize: 13, background: "var(--surface)", color: "var(--text)" }} />
                {state === "error" && <p style={{ color: "var(--c-low)", fontSize: 13 }}>Could not send. Please try again or email {FALLBACK_EMAIL}.</p>}
                <button onClick={submit} disabled={state === "sending" || !msg.trim()} style={{
                  marginTop: 10, width: "100%", background: "var(--accent)", color: "#fff", border: "none",
                  borderRadius: 8, padding: "9px 0", fontSize: 14, fontWeight: 600,
                  cursor: msg.trim() ? "pointer" : "default", opacity: msg.trim() ? 1 : 0.6,
                }}>{state === "sending" ? "Sending…" : "Send feedback"}</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
