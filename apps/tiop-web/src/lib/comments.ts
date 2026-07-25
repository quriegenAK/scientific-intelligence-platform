// In-app comment thread, backed by Supabase (PostgREST). Plain fetch, no SDK.
//
// Ownership without login: each comment carries a secret edit_token generated in the
// poster's browser and kept in localStorage. The token is hidden from reads, so only the
// poster can edit or delete their own comment (enforced by SECURITY DEFINER functions in
// the database). Admin actions (mark addressed, delete any) use a secret you set in the DB
// function, never stored in this repo.

const SUPABASE_URL = "https://svugwghofiiqvfqojugt.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dWd3Z2hvZmlpcXZmcW9qdWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MzcxMDUsImV4cCI6MjEwMDUxMzEwNX0.5bADg3VmcrN84Vqi43C1gxH9nEZrBzjdHBPKAueL3-c";
const REST = `${SUPABASE_URL}/rest/v1`;

export interface Comment {
  id: string;
  created_at: string;
  name: string | null;
  body: string;
  context: string | null;
  status: "open" | "addressed";
}

function headers(extra: Record<string, string> = {}) {
  return { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json", ...extra };
}

// --- per-browser ownership tokens ---
const TOK_PREFIX = "tiop_tok_";
function storeToken(id: string, tok: string) {
  try { localStorage.setItem(TOK_PREFIX + id, tok); } catch { /* ignore */ }
}
export function myToken(id: string): string | null {
  try { return localStorage.getItem(TOK_PREFIX + id); } catch { return null; }
}
export function isMine(id: string): boolean {
  return !!myToken(id);
}
function uuid(): string {
  return (crypto as Crypto).randomUUID();
}

export async function listComments(): Promise<Comment[]> {
  const res = await fetch(`${REST}/comments?select=id,created_at,name,body,context,status&order=created_at.asc`, { headers: headers() });
  if (!res.ok) throw new Error(`list ${res.status}`);
  return res.json();
}

export async function addComment(input: { name: string; body: string; context: string }): Promise<void> {
  const id = uuid();
  const tok = uuid();
  const res = await fetch(`${REST}/comments`, {
    method: "POST",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify({ id, name: input.name || null, body: input.body, context: input.context || null, edit_token: tok }),
  });
  if (!res.ok) throw new Error(`add ${res.status}`);
  storeToken(id, tok);
}

async function rpc(fn: string, args: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${REST}/rpc/${fn}`, { method: "POST", headers: headers(), body: JSON.stringify(args) });
  if (!res.ok) throw new Error(`${fn} ${res.status}`);
}

// owner actions (need the browser's token for that comment)
export async function editMyComment(id: string, newBody: string): Promise<void> {
  const tok = myToken(id);
  if (!tok) throw new Error("not owner");
  await rpc("edit_comment", { cid: id, tok, new_body: newBody });
}
export async function deleteMyComment(id: string): Promise<void> {
  const tok = myToken(id);
  if (!tok) throw new Error("not owner");
  await rpc("delete_comment", { cid: id, tok });
}

// admin actions (need the admin secret you chose in the DB function)
export async function adminSetStatus(id: string, status: "open" | "addressed", secret: string): Promise<void> {
  await rpc("admin_set_status", { cid: id, secret, new_status: status });
}
export async function adminDelete(id: string, secret: string): Promise<void> {
  await rpc("admin_delete", { cid: id, secret });
}
