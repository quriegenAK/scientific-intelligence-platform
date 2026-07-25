import { useState } from "react";
import { addComment } from "../lib/comments";

// Floating quick-comment button. Posts to the shared Supabase thread with the current
// page as context, so a comment made while looking at a target is tagged with it.
export function Feedback() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const context = typeof window !== "undefined" ? (window.location.hash || "#/").replace(/^#/, "") || "/" : "/";

  async function submit() {
    if (!msg.trim()) return;
    setState("sending");
    try { await addComment({ name, body: msg, context }); setState("done"); setMsg(""); }
    catch { setState("error"); }
  }

  return (
    <>
      <button onClick={() => { setOpen(true); setState("idle"); }} style={{
        position: "fixed", right: 20, bottom: 20, zIndex: 40,
        background: "var(--accent)", color: "#fff", border: "none", borderRadius: 999,
        padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
        boxShadow: "0 4px 14px rgba(47,82,201,.35)",
      }}>Comment</button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(16,24,40,.35)", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow)", padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <b style={{ fontSize: 15 }}>Add a comment</b>
              <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>
            {state === "done" ? (
              <p style={{ color: "var(--c-high)", margin: "12px 0" }}>
                Posted. It is in the <a href="#/comments">Comments</a> thread for everyone to see.
              </p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 0 }}>
                  Everyone sees this in the Comments thread. Tagged to: <code>{context}</code>
                </p>
                <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Your comment…"
                  style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", resize: "vertical", background: "var(--surface)", color: "var(--text)" }} />
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
                  style={{ width: "100%", marginTop: 8, border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", fontSize: 13, background: "var(--surface)", color: "var(--text)" }} />
                {state === "error" && <p style={{ color: "var(--c-low)", fontSize: 13 }}>Could not post. Please try again.</p>}
                <button onClick={submit} disabled={state === "sending" || !msg.trim()} style={{
                  marginTop: 10, width: "100%", background: "var(--accent)", color: "#fff", border: "none",
                  borderRadius: 8, padding: "9px 0", fontSize: 14, fontWeight: 600,
                  cursor: msg.trim() ? "pointer" : "default", opacity: msg.trim() ? 1 : 0.6,
                }}>{state === "sending" ? "Posting…" : "Post comment"}</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
