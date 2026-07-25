import { useState } from "react";
import type { CSSProperties } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listComments, addComment, editMyComment, deleteMyComment,
  adminSetStatus, adminDelete, isMine,
} from "../lib/comments";
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
  const [secret, setSecret] = useState("");
  const [adminOn, setAdminOn] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["comments"] });

  async function post() {
    if (!body.trim()) return;
    setPosting(true);
    try { await addComment({ name, body, context: "General" }); setBody(""); await refresh(); }
    finally { setPosting(false); }
  }
  async function saveEdit(id: string) {
    if (!editBody.trim()) return;
    await editMyComment(id, editBody); setEditId(null); await refresh();
  }
  async function removeMine(id: string) {
    if (!confirm("Delete your comment?")) return;
    await deleteMyComment(id); await refresh();
  }
  async function adminMark(c: Comment) {
    await adminSetStatus(c.id, c.status === "addressed" ? "open" : "addressed", secret); await refresh();
  }
  async function adminRemove(id: string) {
    if (!confirm("Delete this comment (admin)?")) return;
    await adminDelete(id, secret); await refresh();
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
        in the order it came in. You can edit or delete your own comments; you cannot change anyone else's.
      </p>

      <Card title="Add a comment">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Your comment…"
          style={ta} />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" style={inp} />
          <button onClick={post} disabled={posting || !body.trim()} style={primaryBtn(!!body.trim())}>
            {posting ? "Posting…" : "Post comment"}
          </button>
        </div>
      </Card>

      <Card title={`Thread${data ? ` (${data.length})` : ""}`}>
        {isLoading && <p style={{ color: "var(--text-muted)" }}>Loading comments…</p>}
        {error && <p style={{ color: "var(--c-low)" }}>Could not load comments. If this just launched, make sure the comments table exists in Supabase.</p>}
        {data && data.length === 0 && <p style={{ color: "var(--text-muted)" }}>No comments yet. Be the first.</p>}
        {data && data.map((c) => {
          const mine = isMine(c.id);
          return (
            <div key={c.id} style={{ borderTop: "1px solid var(--border)", padding: "12px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={badge(c.status)}>{c.status === "addressed" ? "ADDRESSED" : "OPEN"}</span>
                <b style={{ fontSize: 14 }}>{c.name || "Anonymous"}</b>
                {mine && <span style={{ fontSize: 11, color: "var(--accent)" }}>you</span>}
                {c.context && c.context !== "General" && (
                  <span style={{ fontSize: 11.5, color: "var(--accent)", background: "var(--accent-weak)", borderRadius: 999, padding: "1px 8px" }}>{c.context}</span>
                )}
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>{new Date(c.created_at).toLocaleString()}</span>
              </div>

              {editId === c.id ? (
                <div>
                  <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} style={ta} />
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button onClick={() => saveEdit(c.id)} style={smallBtn(true)}>Save</button>
                    <button onClick={() => setEditId(null)} style={smallBtn(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 14.5, whiteSpace: "pre-wrap" }}>{c.body}</div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                {mine && editId !== c.id && (
                  <>
                    <button onClick={() => { setEditId(c.id); setEditBody(c.body); }} style={ghost}>Edit</button>
                    <button onClick={() => removeMine(c.id)} style={ghost}>Delete</button>
                  </>
                )}
                {adminOn && (
                  <>
                    <button onClick={() => adminMark(c)} style={ghost}>{c.status === "addressed" ? "Reopen" : "Mark addressed"}</button>
                    <button onClick={() => adminRemove(c.id)} style={{ ...ghost, color: "var(--c-low)" }}>Delete (admin)</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--text-muted)" }}>
        {adminOn ? (
          <span>Admin mode on. <button onClick={() => { setAdminOn(false); setSecret(""); }} style={linkBtn}>turn off</button></span>
        ) : (
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="admin code" type="password"
              style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", fontSize: 12, background: "var(--surface)", color: "var(--text)" }} />
            <button onClick={() => { if (secret) setAdminOn(true); }} style={linkBtn}>unlock admin</button>
          </span>
        )}
      </div>
    </>
  );
}

const ta: CSSProperties = { width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 14.5, fontFamily: "inherit", resize: "vertical", background: "var(--surface)", color: "var(--text)" };
const inp: CSSProperties = { flex: 1, border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 13.5, background: "var(--surface)", color: "var(--text)" };
const linkBtn: CSSProperties = { background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12.5, padding: 0 };
const ghost: CSSProperties = { fontSize: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", borderRadius: 6, padding: "3px 10px", cursor: "pointer" };
function primaryBtn(on: boolean): CSSProperties {
  return { background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 600, cursor: on ? "pointer" : "default", opacity: on ? 1 : 0.6 };
}
function smallBtn(primary: boolean): CSSProperties {
  return { background: primary ? "var(--accent)" : "var(--surface)", color: primary ? "#fff" : "var(--text-muted)", border: primary ? "none" : "1px solid var(--border)", borderRadius: 6, padding: "5px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
}
function badge(status: string): CSSProperties {
  return { fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "1px 7px", color: status === "addressed" ? "var(--c-high)" : "var(--c-medium)", background: status === "addressed" ? "var(--c-high-bg)" : "var(--c-medium-bg)" };
}
