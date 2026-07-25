import { useState } from "react";
import type { CSSProperties } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listComments, addComment, setStatus, ADMIN_CODE } from "../lib/comments";
import type { Comment } from "../lib/comments";
import { Card } from "../components/ui";

export function Comments() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["comments"], queryFn: listComments, refetchInterval: 15000,
  });
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [code, setCode] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["comments"] });

  async function post() {
    if (!body.trim()) return;
    setPosting(true);
    try { await addComment({ name, body, context: "General" }); setBody(""); await refresh(); }
    finally { setPosting(false); }
  }
  async function mark(c: Comment, status: "open" | "addressed") {
    await setStatus(c.id, status); await refresh();
  }

  const open = (data || []).filter((c) => c.status === "open").length;
  const done = (data || []).filter((c) => c.status === "addressed").length;

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Comments</h1>
        {data && <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{open} open · {done} addressed</span>}
      </div>
      <p style={{ color: "var(--text-muted)", maxWidth: 720 }}>
        Leave a comment on anything: a score, the wording, a target, a source. Everyone sees the thread here
        in the order it came in, and we work through it one by one.
      </p>

      <Card title="Add a comment">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Your comment…"
          style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 14.5, fontFamily: "inherit", resize: "vertical", background: "var(--surface)", color: "var(--text)" }} />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
            style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 13.5, background: "var(--surface)", color: "var(--text)" }} />
          <button onClick={post} disabled={posting || !body.trim()} style={{
            background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px",
            fontSize: 14, fontWeight: 600, cursor: body.trim() ? "pointer" : "default", opacity: body.trim() ? 1 : 0.6 }}>
            {posting ? "Posting…" : "Post comment"}
          </button>
        </div>
      </Card>

      <Card title={`Thread${data ? ` (${data.length})` : ""}`}>
        {isLoading && <p style={{ color: "var(--text-muted)" }}>Loading comments…</p>}
        {error && <p style={{ color: "var(--c-low)" }}>Could not load comments. If this just launched, make sure the comments table exists in Supabase.</p>}
        {data && data.length === 0 && <p style={{ color: "var(--text-muted)" }}>No comments yet. Be the first.</p>}
        {data && data.map((c) => (
          <div key={c.id} style={{ borderTop: "1px solid var(--border)", padding: "12px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "1px 7px",
                color: c.status === "addressed" ? "var(--c-high)" : "var(--c-medium)",
                background: c.status === "addressed" ? "var(--c-high-bg)" : "var(--c-medium-bg)",
              }}>{c.status === "addressed" ? "ADDRESSED" : "OPEN"}</span>
              <b style={{ fontSize: 14 }}>{c.name || "Anonymous"}</b>
              {c.context && c.context !== "General" && (
                <span style={{ fontSize: 11.5, color: "var(--accent)", background: "var(--accent-weak)", borderRadius: 999, padding: "1px 8px" }}>{c.context}</span>
              )}
              <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 14.5, whiteSpace: "pre-wrap" }}>{c.body}</div>
            {admin && (
              <button onClick={() => mark(c, c.status === "addressed" ? "open" : "addressed")} style={{
                marginTop: 6, fontSize: 12, border: "1px solid var(--border)", background: "var(--surface)",
                color: "var(--text-muted)", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
                {c.status === "addressed" ? "Reopen" : "Mark addressed"}
              </button>
            )}
          </div>
        ))}
      </Card>

      <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--text-muted)" }}>
        {admin ? (
          <span>Admin mode on. You can mark comments addressed. <button onClick={() => setAdmin(false)} style={linkBtn}>turn off</button></span>
        ) : (
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="admin code"
              style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", fontSize: 12, background: "var(--surface)", color: "var(--text)" }} />
            <button onClick={() => { if (code === ADMIN_CODE) setAdmin(true); }} style={linkBtn}>unlock admin</button>
          </span>
        )}
      </div>
    </>
  );
}

const linkBtn: CSSProperties = { background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12.5, padding: 0 };
