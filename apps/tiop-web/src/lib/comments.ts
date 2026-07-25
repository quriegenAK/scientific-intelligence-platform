// In-app comment thread, backed by Supabase (PostgREST). Plain fetch, no SDK, so the
// bundle stays small. The anon key is a public client key by design (it ships in every
// Supabase web app); the table's row-level rules are the real security boundary.

const SUPABASE_URL = "https://svugwghofiiqvfqojugt.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dWd3Z2hvZmlpcXZmcW9qdWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MzcxMDUsImV4cCI6MjEwMDUxMzEwNX0.5bADg3VmcrN84Vqi43C1gxH9nEZrBzjdHBPKAueL3-c";
const REST = `${SUPABASE_URL}/rest/v1/comments`;

// Change this to rotate who can mark comments addressed. UI-gated only (see Comments page).
export const ADMIN_CODE = "quriegen-admin";

export interface Comment {
  id: string;
  created_at: string;
  name: string | null;
  body: string;
  context: string | null;
  status: "open" | "addressed";
}

function headers(extra: Record<string, string> = {}) {
  return { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, ...extra };
}

export async function listComments(): Promise<Comment[]> {
  const res = await fetch(`${REST}?select=*&order=created_at.asc`, { headers: headers() });
  if (!res.ok) throw new Error(`list ${res.status}`);
  return res.json();
}

export async function addComment(input: { name: string; body: string; context: string }): Promise<void> {
  const res = await fetch(REST, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify({ name: input.name || null, body: input.body, context: input.context || null }),
  });
  if (!res.ok) throw new Error(`add ${res.status}`);
}

export async function setStatus(id: string, status: "open" | "addressed"): Promise<void> {
  const res = await fetch(`${REST}?id=eq.${id}`, {
    method: "PATCH",
    headers: headers({ "Content-Type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`update ${res.status}`);
}
