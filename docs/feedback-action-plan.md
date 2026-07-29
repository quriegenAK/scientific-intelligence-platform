# TIOP Team Feedback: Action Plan

Source: the six in-app comments (Klaske, Jan, Kinga, Martina x2, Thiago) plus Thiago's direct
chat feedback on the tractability (T) redesign. This plan turns them into discrete, tagged,
sequenced actions, decides the data-source and licensing strategy the feedback forces, and lists
the few items that need a written reply to the team. Decisions first, answers second, as requested.

Tags: **[BUG]** a correctness error to fix now; **[UI]** contained interface or copy work;
**[METHOD]** a scoring-methodology change that belongs in Version 3, not a v1 hack; **[DATA]** a
data-source or licensing decision. Evidence labels: **[KNOWN]** verified against a primary source;
**[LIKELY]** supported but not fully re-verified.

---

## 0. The one decision that gates several others: data sources and licensing

Martina's observation is exactly right and it is the crux: the biology the team wants (precise
localization, organized gene and disease detail) is available in open sources but is scattered.
GeneCards and MalaCards organize it nicely, so the instinct to use them is natural. The licensing
check says we must not, for the product.

**GeneCards and MalaCards (LifeMap Sciences) are out for the product [KNOWN, from their Terms of
Use].** Commercial use is strictly prohibited without a paid license; there is no free API and
automated access, scraping, and crawling are explicitly forbidden; redistribution is prohibited;
and using their data to train AI or ML models is prohibited without written permission. For a
commercial platform that also wants to train discovery agents, every one of those is a blocker.
The academic free tier is "internal use only," which does not cover a product shown to third
parties. So GeneCards cannot be an API we wrap, a source we redistribute, or training data.

**The important point that makes this a non-loss: GeneCards is mostly an aggregator of open
primary sources**, which it lists itself. Its value is organization, not proprietary facts. So we
can legitimately rebuild the same organized view from the same open primaries, which is also
better engineering: real APIs, reproducible, versioned, and fully inside our swappable source
boundary.

**The open, commercially-usable stack we build on instead:**

| Source | License | Access | What it gives us |
|---|---|---|---|
| UniProt | CC-BY 4.0 [KNOWN] | Free REST API | Curated subcellular location, protein function, target class |
| Human Protein Atlas | CC-BY-SA 4.0 [KNOWN, from their licence page] | Download + programmatic | Subcellular localization with reliability, tissue expression |
| Gene Ontology (Cellular Component) | CC-BY 4.0 [KNOWN] | Free download/API | Structured cellular-component terms |
| COMPARTMENTS (Jensen lab) | CC-BY 4.0 [LIKELY, verify] | Free download/API | Localization evidence with confidence scores |
| Open Targets | Permissive, already in use | GraphQL | Already aggregates UniProt/HPA/GO localization and target class |

One caveat to respect: Human Protein Atlas is CC-BY-**SA** (share-alike), so if we redistribute an
HPA-derived dataset as data, the derivative may need the same license. Displaying HPA facts inside
the product with attribution and a link is fine; bundling HPA into a redistributed database needs a
license check. UniProt and GO are plain CC-BY, so they carry no share-alike obligation and should be
the primary spine. Attribution and per-fact source links are required for all of them, which we
already do through the Trust Layer.

**Decision:** build the localization and biology layer from UniProt + GO + HPA (+ COMPARTMENTS for
confidence), never GeneCards or MalaCards. This is legit, reproducible, and free.

---

## 1. Bugs (fix now)

**[BUG] B1. HAVCR2 clinical-stage inconsistency (Martina).** HAVCR2 shows no approved drug, but
"Highest stage of testing" reads approved (Phase 4), and the ClinicalTrials.gov deep link points at
the wrong set of trials. Root cause is almost certainly the trial-matching or drug-to-target linking
step returning trials that are not actually for HAVCR2. This is the highest-priority fix because a
wrong clinical stage discredits every number on the card. Action: audit the CT.gov query and the
drug-target join for HAVCR2, add a per-target sanity check that the linked trials actually name the
target's drugs, and re-pin the snapshot.

**[BUG/METHOD] B2. S = 0 does not mean "nothing found" (Thiago).** Because the four crowding
signals are log-transformed then min-max scaled across the cohort, a component of 0.0 means "lowest
in this cohort," not "zero activity." The display can therefore imply no drugs or trials where some
exist. Interim fix (now): show the raw counts next to the scaled signal so 0.0 is never read as
absolute zero. Real fix (V3): make S absolute with thresholds, see M3.

---

## 2. Methodology changes (Version 3, do not hack into v1)

**[METHOD] M1. Score target-disease pairs, not targets (Thiago, and the core V3 recommendation).**
Stop taking the single highest disease association as V. Score each target-disease pair, state at
the top of the card which disease the score applies to, allow one target to carry several
opportunity values by indication, and let users group and filter by disease. This is already the
central move in the V3 design review; Thiago arrived at it independently, which is strong
corroboration.

**[METHOD] M2. Redesign T around target-intrinsic properties, not drug stage (Thiago). Detailed in
section 3.** Agreed in direction, refined in method.

**[METHOD] M3. Make S absolute, with thresholds (Thiago, and Martina's CBLB case).** Replace
cohort-relative min-max with fixed reference points, so "no approved drugs" maps to a true zero and
scores are comparable across any disease area. This is what makes an open white space like CBLB
read as open instead of being dragged around by whoever else is on screen.

**[METHOD] M4. Answer and fix the CBLB case (Martina). Needs a written reply, see section 5.** CBLB
shows "some room" and 29.8 with no registered industry activity, and Martina reads that as a large
white space, not "some room." She is likely right, and the score is likely wrong for a diagnosable
reason: the cohort-relative S (M3) plus a low V or T are dragging down a genuinely open target. The
fix is M3 plus the Merit-versus-Strategic split from the review, so "open field" is shown on its own
axis and is not hidden by weak validation. This is the single most valuable comment in the set: an
expert disagreeing with the score is exactly the signal the validation plan exists to adjudicate.

**[METHOD] M5. Offer Jan's novelty clustering as a complementary view (Jan).** Jan proposes dropping
the complex score in favour of four novelty tiers (no known drugs, pre-clinical candidates, clinical
candidates, approved). We should not drop the score, but this maps almost exactly onto the Strategic
white-space axis and is a clean, legible lens. Add it as a grouping and filter, not a replacement.

**[METHOD] M6. Discovery agent for unexplored targets (Jan). Needs a written reply, see section 5.**
Already scoped: this is the ANNi and HGT discovery front-end in the V3 review, feeding the decision
core at V4 to V5. Answer is yes, with a timeline and the data dependency.

---

## 3. The T redesign (Thiago's proposal, with a refinement)

**Where Thiago is right.** Stage-of-development weighting conflates the drug with the target. Being
in Advanced Clinical is a property of a drug that happens to hit the target, not of the target's
druggability, and multiple drugs on the same target routinely diverge. The review made the same
critique. So dropping the stage-based weights is correct.

**Where the proposal needs refining.** Localization alone is not tractability, and the specific
ordering has a modality problem that would introduce a new error if applied flat:

- "Surface easiest, nucleus hardest" is true for antibodies and other biologics, which cannot cross
  the membrane and so need extracellular targets.
- For small molecules it is not true. Small molecules cross membranes routinely. The most drugged
  target class, kinases, is cytoplasmic, and nuclear receptors (estrogen, androgen, glucocorticoid)
  are among the most successfully drugged targets in history and sit in the nucleus. A flat
  "nucleus 0.6" would wrongly penalize exactly those.

So localization is really a proxy for **modality accessibility**, not tractability itself, and it
must be modality-aware. This also connects to the modality-weighting question already open on T
(small molecule vs antibody vs PROTAC).

**A second point that saves work:** the Open Targets tractability buckets are a mix, not all
stage-based. The bottom buckets, Structure with Ligand, High-Quality Ligand, High-Quality Pocket,
Small Molecule Binder, are already target-intrinsic ligandability, which is exactly what Thiago
wants. Only the top three, Approved Drug, Advanced Clinical, Phase 1 Clinical, are the stage-based
ones he objects to. So we do not throw out the buckets; we drop the stage-based ones and keep the
intrinsic ones, then add localization.

**Refined T (proposed V3 shape):** T combines two target-intrinsic components, per modality.

1. **Ligandability** from the intrinsic OT buckets (pocket, ligand, structure, binder). Keep.
2. **Modality accessibility** from cellular localization, sourced from UniProt + HPA + GO. Applied
   modality-aware: surface favours antibody viability, an intracellular target with a good pocket
   favours small-molecule viability, so nuclear receptors are not penalized.

Thiago's weights are a good v0 starting point for the accessibility component, kept explicitly as
judgement and clearly labeled:

```
Ubiquitous (surface + cytoplasm + nucleus): 1.0
Plasma membrane / cell surface:             0.9
Cytoplasm:                                  0.8
Nucleus:                                    0.6
```

with the standing caveat that for a small-molecule modality the intracellular penalty should be
softened or removed, because membrane permeability makes intracellular targets fully accessible.
Chemical property (protein vs lipid) is deferred; it is rare among targets and we do not yet have a
principled weight, as Thiago also noted. Localization comes from UniProt and HPA and GO, never
GeneCards.

**Net:** keep intrinsic ligandability, add localization as modality-aware accessibility, drop the
three stage-based buckets. This delivers Thiago's intent (target-intrinsic T) without importing the
nuclear-receptor error a flat localization scale would create.

---

## 4. UI and copy (quick wins, mostly independent of methodology)

**[UI] U1. Apply Kinga's label rewrite.** Kinga posted a complete current-to-suggested copy spec
(Opportunity Score, Biological validation, Druggability, Competitive whitespace, Mechanism, Approved
therapies, Highest clinical stage, Active developers, Primary indications, Cellular localization,
Platform fit, and the reproducibility line). Ready to apply as-is. Highest-visibility quick win.

**[UI] U2. Tooltips on every button and score (Jan).** Add a hover explanation to every score and
control, reusing the Methods copy. Pairs naturally with U1.

**[UI] U3. Filtering and grouping (Klaske, Jan, Thiago).** Add filters for opportunity type, room
type, cellular localization, and failed versus ongoing trials (Klaske); a therapeutic-area filter
(Jan); grouping by disease indication (Thiago). Depends on D-items for the localization and TA data.

**[UI] U4. Show the opportunity as a percentage (Klaske).** Display the 0 to 100 score with a % or a
clear "out of 100" label.

**[UI] U5. Colour gradient on the 0 to 1 bars (Klaske).** Partly done via the green-to-red scale;
extend it to the three V, T, room-left bars.

**[UI] U6. Show failed past drugs, not just current progress (Klaske).** Surface discontinued or
failed programs on the card, from ChEMBL and CT.gov status, so a crowded-but-failed field is
visible.

**[UI] U7. Remove "why it matters to us"; fix or remove "how it works" (Jan, Thiago).** Consensus to
cut "why it matters." "How it works" currently only shows the full name; either make it a real
one-line mechanism or remove it. Recommend remove for now.

**[UI] U8. Rephrase "proven biology" (Klaske).** Superseded by Kinga's "Biological validation";
U1 covers it.

---

## 5. Items that need a written reply to the team

Most comments become actions and need no reply. Four need an actual response, drafted here for you
to send or adjust.

**To Martina, on CBLB (M4).** "You are probably right. CBLB looks like a real white space, and the
29.8 is an artifact of two things we are fixing: crowding is currently scored relative to the other
targets on screen rather than on an absolute scale, and a low validation or tractability input can
drag the headline number down even when the field is genuinely open. In V3 we are making crowding
absolute and splitting the score into a scientific-merit axis and a separate white-space axis, so an
open field like CBLB shows as open on its own axis instead of being hidden. Keep flagging these; an
expert disagreeing with the score is exactly what we want to catch."

**To Thiago, on what to extract and from where.** "Two things. On T, we agree with dropping the
stage-based weights; we are keeping the target-intrinsic ligandability buckets (pocket, ligand,
structure) and adding your cellular-localization idea as a modality-aware accessibility factor, with
one caveat: for small molecules we should not penalize intracellular or nuclear targets, since
kinases and nuclear receptors are highly druggable there. On the source: we should not pull from
GeneCards, its terms forbid commercial use, programmatic access, and AI training. The same
localization data is open in UniProt, the Human Protein Atlas, and GO, which we can use freely with
attribution. So tell us the exact fields you want, membrane, cytoplasm, nucleus, multi-location, and
we will map each to the open source rather than to GeneCards."

**To Jan, on the discovery agent (M6).** "Yes, and it is already in the plan. It is the discovery
front-end in the V3 design review: a swarm or graph model that proposes previously unexplored
targets, feeding our scoring engine. It comes online at V4 to V5 and depends on the wet lab
producing the multi-omics data it runs on, which you confirmed is coming."

**To Thiago, on where the classifications come from (quick factual).** "The category filter is built
from the Open Targets target-class taxonomy, which is open. We can extend it with a therapeutic-area
taxonomy from the EFO disease ontology for the TA filter Jan asked for."

---

## 6. Sequence

**Now (this week, contained):** B1 (HAVCR2 bug), U1 (Kinga's labels), U7 (remove sections), U4
(percentage), U5 (gradient), and the four replies in section 5. B2 interim display fix.

**Next (data layer, unblocks the rest):** stand up the open localization and biology layer from
UniProt + GO + HPA (D-items), which feeds D1 localization, D2 biology detail, and the T redesign.
Build the EFO therapeutic-area taxonomy for U3.

**V3 (methodology):** M1 target-disease scoring, M2 refined T, M3 absolute S, M4 Merit-vs-Strategic
split, M5 novelty clustering view. All validated through the temporal back-test before they ship.

**V4 to V5:** M6 discovery agent, once wet-lab data exists.

---

## 7. Open questions for you

- The refined T mixes ligandability and localization. Do you want localization applied modality-aware
  from the start (correct but more work), or Thiago's flat localization scale as a v0 with the
  nuclear-receptor caveat noted, then refined? Recommend modality-aware, but flat is a faster first
  cut.
- HPA is share-alike. Are we comfortable using it with attribution for in-product display (fine), and
  do we want to keep any HPA-derived bundle internal to avoid the share-alike redistribution
  question? Recommend UniProt + GO as the spine, HPA as an enrichment shown with attribution.
- COMPARTMENTS license should be confirmed CC-BY before we build on it; treat as [LIKELY] until then.
