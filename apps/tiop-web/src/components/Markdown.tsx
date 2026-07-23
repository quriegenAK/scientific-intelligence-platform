// Minimal, dependency-free markdown for the executive brief (headings, bold, italics,
// paragraphs). The brief content is model-written but constrained to sourced facts.
import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) nodes.push(<b key={k++}>{tok.slice(2, -2)}</b>);
    else if (tok.startsWith("`")) nodes.push(<code key={k++}>{tok.slice(1, -1)}</code>);
    else nodes.push(<i key={k++}>{tok.slice(1, -1)}</i>);
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ md }: { md: string }) {
  const blocks = md.trim().split(/\n\n+/);
  return (
    <div style={{ maxWidth: 760 }}>
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h3 key={i} style={{ marginBottom: 6 }}>{inline(b.slice(3))}</h3>;
        if (b.startsWith("# ")) return <h2 key={i}>{inline(b.slice(2))}</h2>;
        return <p key={i} style={{ marginTop: 0 }}>{inline(b)}</p>;
      })}
    </div>
  );
}
