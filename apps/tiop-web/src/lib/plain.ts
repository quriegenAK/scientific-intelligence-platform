// Plain-language layer (see docs/experience-brief.md). One place, so wording stays
// consistent across the app. No jargon, no buzzwords, no long dashes.

export function clean(s: unknown): string {
  return String(s ?? "")
    .replace(/ — /g, ", ").replace(/—/g, ", ")
    .replace(/ – /g, ", ").replace(/–/g, "-")
    .replace(/ , /g, ", ");
}

export const DEV_LEVEL: Record<string, string> = {
  Tclin: "Has an approved drug",
  Tchem: "Has drugs in testing",
  Tbio: "Studied, no drug yet",
};

export const CONFIDENCE_PLAIN: Record<string, string> = {
  HIGH: "Strong data",
  MEDIUM: "Some data gaps",
  DERIVED: "Worked out from the data",
  LOW: "Limited data",
};

export function opportunityTag(rank: number, n: number): { label: string; color: string } {
  if (rank === n) return { label: "Benchmark", color: "#6b7280" };
  if (rank <= Math.floor(n / 3)) return { label: "Open", color: "#087443" };
  if (rank <= Math.floor((2 * n) / 3)) return { label: "Some room", color: "#b45309" };
  return { label: "Crowded", color: "#9a6a00" };
}

export function plainRead(group: string, rank: number, n: number): string {
  const intra = group === "emerging_intracellular";
  if (rank === n) return "Proven, but very crowded. We use this as our benchmark, not as an opening.";
  if (rank <= Math.floor(n / 3)) {
    return intra
      ? "Proven biology, still room to move, and it sits inside the cell where our platform has an edge."
      : "Proven biology with room still open in the field.";
  }
  if (intra) return "Inside the cell and promising, but still early.";
  return "Real biology with a moderate amount of competition.";
}

export function plainQurie(v: unknown): string {
  const s = String(v ?? "");
  if (s.includes("High edge")) return "A strong fit for our platform: proven, not crowded, and inside the cell.";
  if (s.includes("White-space") || s.toLowerCase().includes("opportunity")) return "An opening worth tracking.";
  if (s.includes("Benchmark") || s.includes("saturated")) return "We use this as a benchmark, not an opening.";
  return clean(s);
}

// science rows shown when a target is opened: plain label -> contract field
export const SCIENCE_ROWS: [string, string][] = [
  ["how it works", "mechanism_moa"],
  ["approved drugs", "approved_drugs"],
  ["highest stage of testing", "highest_phase"],
  ["companies working on it", "companies_developing"],
  ["main diseases", "disease_indication"],
  ["where it sits in the cell", "subcellular_location"],
  ["why it matters to us", "qurie_relevance"],
];
