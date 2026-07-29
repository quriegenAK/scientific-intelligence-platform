# TIOP Data Sources: License, API, and Fit Assessment

Assessment of the proposed source list (10 primary open, 4 commercial enrichment) for Agent 6.
For each source: is it open, is there a real developer API we can wrap, what does it feed in the
scoring engine, and what does using it do to the reproducibility moat. Decisions are at the end.

Evidence labels: **[KNOWN]** verified against the source's own license or policy page during this
review; **[LIKELY]** established but not re-verified this pass; **[VERIFY]** confirm before building
on it.

---

## 0. The governing principle: reproducibility decides the tiering

The platform's moat is the Scientific Trust Layer: every fact traces to a source the user can open,
and every score reproduces from pinned snapshots. That principle sorts sources into two tiers on its
own.

Open sources can be the **spine**: we can snapshot them, version them, let users click through to the
exact record, and reproduce any number. Closed commercial sources can only be **internal
enrichment**: their licenses typically forbid redistributing the underlying facts and there is no
public record to click through to, so a score that depends on them is neither reproducible by the
user nor traceable. That does not make them useless, but it does mean they can never sit under a
headline scientific number without breaking the moat. They augment the competitive and commercial
view, tagged as licensed, not the scientific core.

This is also why the two license traps below matter: a source that looks open academically but is
closed commercially (KEGG, GeneCards) gives the worst of both, a dependency we cannot ship.

---

## 1. Primary sources (open, the spine)

| Source | License | Dev API | Feeds | Status |
|---|---|---|---|---|
| Open Targets | Permissive, open [KNOWN] | GraphQL | V, T, S, disease burden, target class | In use |
| ChEMBL | CC-BY-SA 3.0 [KNOWN] | REST | S (approvals), T (bioactivity, ligandability) | In use |
| ClinicalTrials.gov | US public domain [KNOWN] | REST v2 | S (trials, sponsors), momentum (dates) | In use |
| UniProt | CC-BY 4.0 [KNOWN] | REST | T (localization), biology detail, ID mapping | Add |
| Ensembl | Open, no restriction (EMBL-EBI) [LIKELY] | REST | Identity and coordinate spine, gene mapping | Add |
| gnomAD | Open, free incl. commercial [KNOWN via AWS Open Data listing; policy page not re-read] | GraphQL + AWS | Safety (LOEUF constraint), genetics | Add (safety axis) |
| ClinVar | US public domain (NCBI) [KNOWN] | E-utilities | Causal genetics (variant-disease) | Add |
| Reactome | CC-BY 4.0 [LIKELY, VERIFY] | REST + download | Biological validation (pathways) | Add |
| PubMed | US public domain (NCBI) [KNOWN] | E-utilities | Literature retrieval for RAG, not a core predictor | Add (guarded) |
| KEGG | Academic free, **commercial requires paid license** [KNOWN] | REST, but license-gated | Pathways (Reactome is the open substitute) | **Avoid** |

**KEGG is a commercial-license trap [KNOWN, from Pathway Solutions].** Free for academic users, but
commercial use, including the REST API and FTP, requires a paid End User or Service Provider license.
For a commercial product this is the same blocker as GeneCards. Do not wrap the KEGG API. Use
**Reactome** (CC-BY 4.0) for pathways, which is open, commercially usable with attribution, and has a
real API. Where a KEGG-only pathway is genuinely needed, get it via an open intermediary or a
licensed feed, never by scraping KEGG.

**Two share-alike notes.** ChEMBL is CC-BY-**SA** 3.0 and Reactome and HPA carry attribution or
share-alike terms. Displaying their facts in-product with attribution and a source link is fine, which
is what the Trust Layer already does. The share-alike obligation only bites if we redistribute a
derived *dataset*, so keep any derived bundles internal and expose facts with attribution.

**PubMed caution.** The design review found literature and news momentum leaks the future and is the
most gameable signal. So PubMed is in scope for retrieval and evidence display (RAG with citations),
and explicitly not as a core predictive term. Keep it on the evidence-and-explanation side.

---

## 2. Commercial enrichment (closed, internal augmentation only)

| Source | What it is | Access | Would feed | Verdict |
|---|---|---|---|---|
| GeneCards / MalaCards | Aggregated gene and disease annotation | Proprietary, no API, no commercial use, no AI training [KNOWN] | Biology detail (localization, disease) | **Avoid**; rebuild from UniProt + HPA + GO |
| Clarivate Cortellis | Drug pipeline, competitive, regulatory intelligence | Commercial license, API under contract [LIKELY] | S and momentum (pipeline, deals, competitor programs) | Defer, contract-gated |
| Citeline (Pharmaprojects, Trialtrove; Norstella) | Pipeline and trial intelligence | Commercial license, API under contract [LIKELY] | S and momentum (richer trials, sponsors) | Defer, contract-gated |
| Evaluate Pharma (Norstella) | Consensus forecasts, market and commercial data | Commercial license [LIKELY] | Strategic and commercial sizing, not science | Defer, commercial layer only |

All four are proprietary and license-gated, and all four feed the competitive, commercial, and
momentum view rather than the scientific core. They would genuinely sharpen the crowding (S) and
momentum signals, since trial and pipeline intelligence is their business. But three constraints
hold: cost is high, the data cannot be exposed as click-through provenance, and the licenses
generally forbid redistributing the derived facts. So they are a later, deliberate augmentation
behind a contract, tagged as a licensed source with no public trace, never a spine source under a
headline number. GeneCards is a special case: it is an aggregator of open primaries, so its
organized view is fully reproducible from UniProt, HPA, and GO at zero license cost, which is the
recommended path.

---

## 3. How the open spine maps to the six V3 dimensions

- **D1 causal genetics:** ClinVar, gnomAD, Open Targets Genetics (and GWAS via OT). The strongest
  and most under-used axis; this is where the open genetics sources earn their place.
- **D2 broader biology:** Reactome (pathways), UniProt (function), Gene Ontology, HPA. KEGG avoided.
- **D3 tractability:** Open Targets tractability, ChEMBL (bioactivity and pocket or ligand evidence),
  UniProt (localization for modality accessibility), plus PDB for structures later.
- **D4 safety:** gnomAD (LOEUF constraint), HPA (tissue-expression specificity), known adverse
  effects. This axis is new in V3 and is mostly powered by gnomAD and HPA.
- **D5 competitive white space:** ChEMBL (approvals), ClinicalTrials.gov (trials, sponsors), Open
  Targets (pipeline candidates). Cortellis or Citeline would sharpen this later, behind a contract.
- **D6 disease burden:** EFO and Open Targets disease ontology, plus external epidemiology.
- **Identity spine:** Ensembl and UniProt for stable IDs and cross-source mapping.
- **Momentum M:** ClinicalTrials.gov trial dates now, patents later; Citeline or Evaluate later.
- **Literature:** PubMed for retrieval and RAG explanation, not a core predictor.

Every dimension has a fully open path. No scientific number in V3 needs a closed source. That is the
point: the moat is buildable entirely on open data, and commercial feeds are optional sharpening of
the competitive view only.

---

## 4. Decisions

1. Build the V3 scientific core entirely on the open spine: Open Targets, ChEMBL, ClinicalTrials.gov,
   UniProt, Ensembl, gnomAD, ClinVar, Reactome, with PubMed for retrieval only.
2. Avoid KEGG (commercial license) and GeneCards or MalaCards (commercial license, no API, no AI
   training). Use Reactome for pathways and UniProt + HPA + GO for localization and biology.
3. Treat Cortellis, Citeline, and Evaluate Pharma as a later, contract-gated enrichment of the
   competitive and momentum view only, tagged as licensed, never as click-through provenance.
4. Respect share-alike: expose facts with attribution and source links (Trust Layer already does
   this); keep any derived datasets internal.

---

## 5. To verify before building

- Reactome exact license version (CC-BY 4.0 expected) [VERIFY].
- gnomAD policy page (blocked by robots this pass); AWS Open Data listing already corroborates open,
  commercial-friendly access [VERIFY the attribution wording].
- Ensembl terms (EMBL-EBI, expected no restriction) [VERIFY].
- COMPARTMENTS license if we use it for confidence-scored localization (CC-BY expected) [VERIFY].

Sources checked this pass: KEGG (Pathway Solutions licensing page), GeneCards (LifeMap Terms of Use),
Human Protein Atlas (licence page), UniProt, Reactome (license page, redirect loop; license known
from prior versions).
