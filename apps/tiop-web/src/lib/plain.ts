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

export function opportunityLabel(rank: number, n: number): string {
  if (rank === n) return "Benchmark";
  if (rank <= Math.floor(n / 3)) return "Open";
  if (rank <= Math.floor((2 * n) / 3)) return "Some room";
  return "Crowded";
}

// Continuous green -> amber -> orange -> red scale keyed to the opportunity score,
// so scientists read openness at a glance. Higher (more open) = greener.
export function scoreColor(v: number): string {
  if (v >= 45) return "#0f8a4d"; // green   - open
  if (v >= 35) return "#5f9b1f"; // yellow-green
  if (v >= 27) return "#d19100"; // amber
  if (v >= 18) return "#e8730c"; // orange
  return "#cf3c2e";              // red     - crowded
}

// Tag pill color: benchmark is a neutral reference, everything else follows the ramp.
export function tagColor(label: string, score: number): string {
  return label === "Benchmark" ? "#475569" : scoreColor(score);
}

// The CBO functional taxonomy, in display order.
export const CATEGORY_ORDER = [
  "Receptors", "Ion channels", "Enzymes", "Transporters and pumps",
  "Transcription factors and gene regulators", "Structural and cytoskeletal proteins",
  "Signalling adaptors and protein-protein interactions",
  "Secreted ligands and extracellular mediators", "Cell-surface antigens",
  "Nucleic acids and genes", "Translational machinery", "Pathogen-specific targets",
];

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
