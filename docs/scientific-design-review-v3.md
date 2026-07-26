# Scientific Design Review: The QurieGen Scientific Decision Engine

Prepared as an independent scientific advisory board review. The remit is adversarial: challenge
every assumption before years of engineering are committed, and recommend the architecture this
board would defend in front of pharma R&D leadership, a scientific advisory board, and technical
due diligence.

Evidence labels used throughout: **[KNOWN]** verified against a primary source named in section 8;
**[LIKELY]** well-supported but a specific figure not re-verified; **[HYPOTHESIS]** a design
inference, not an established claim. This document supersedes nothing in the running platform; it
sets direction for Version 3 and beyond. It is a companion to `scoring-engine-design-review.md`,
which covers the scoring engine specifically. This document covers the whole platform.

---

## 1. Executive Summary

The board's consensus is that QurieGen is building the right thing for the wrong reason if it
frames itself as a target ranking engine, and the right thing for the right reason if it frames
itself as a **scientific decision engine with an auditable evidence and reasoning substrate**. The
distinction is not semantic. It determines what gets validated, what pharma pays for, and whether
the platform is defensible in three years.

Three conclusions dominate the review.

First, the durable moat is not a model. Every organization in the competitive set that is winning
on models (structure prediction, generative chemistry, phenomics) is a design or data company, not
a target-decision company, and none of them expose provenance, calibrated uncertainty, and
traceable reasoning together. That combination, the Scientific Trust Layer, is the one thing
QurieGen already has that the field structurally lacks. It should be the center of the platform,
not a supporting feature.

Second, the science that determines commercial value is causal human genetics and honest
uncertainty, not aggregation cleverness. Genetically supported targets succeed roughly two to two
and a half times more often, and efficacy failure from wrong-target biology is the single largest
cause of late-stage attrition [KNOWN: Nelson 2015; Minikel 2024; Hay 2014; Wong 2019]. A decision
engine that does not put causal genetics at its core and does not attach calibrated confidence to
every recommendation is not scientifically defensible, however sophisticated its plumbing.

Third, most of the exciting method list on the table today (reinforcement learning, single-cell
foundation models as primary evidence, multi-agent LLM swarms, mechanistic whole-cell models)
should be deferred. They are either immature, unfaithful as explanations, or wrong for a small
team's return on engineering. The methods that earn their place now are unglamorous and
well-understood: Bayesian evidence fusion with source-correlation modeling, Mendelian
randomization, desirability aggregation, conformal prediction, path-based knowledge-graph
explanation, and retrieval-grounded language models confined strictly to explanation with human
sign-off.

The recommended posture is ambition in framing, conservatism in method, and radical seriousness
about validation and provenance. That is the combination that survives due diligence.

---

## 2. Key Findings

**F1. TIOP is a scientific decision engine, and should be built as one (answers Q1).** Not a
ranking engine (too shallow, commoditized by Open Targets), not a pure reasoning engine (too
open-ended to validate), not only a hypothesis generator (generation without decision support and
uncertainty is where BenevolentAI's novel-target program failed). A decision engine produces a
recommendation, the evidence and reasoning behind it, a calibrated confidence, and the next
experiment that would most change the decision. Each of those four is independently checkable,
which is what makes the whole thing defensible.

**F2. The output must not be a single score (answers Q3).** A single number destroys exactly the
information pharma diligence demands: how sure are we, on what basis, and along which axis. The
scientifically defensible representation is a small structured object: separate scientific merit
and strategic (white space) axes, each with a calibrated uncertainty interval, a decomposition
into contributing evidence, and a position on a Pareto view rather than a forced scalar ranking
[KNOWN: multi-objective and desirability practice, Segall 2012; Derringer-Suich 1980]. A headline
number can still be shown for triage, but it is a lossy summary of the object, never the object
itself.

**F3. Causal human genetics is underused and is the highest-value scientific investment (answers
Q4, Q7).** Mendelian randomization turns genetic variants into natural randomized experiments on
target modulation and is the single strongest causal tool available for target validation today
[KNOWN: Nelson 2015; King 2019; canonical PCSK9 and IL6R cases]. Version 1's validation term
throws most of this away. Adding a genetics-first causal axis, with mandatory pleiotropy
sensitivity analysis, is the largest defensible improvement in scientific credibility per unit of
engineering.

**F4. Literature and news momentum leaks the future and is the most gameable signal (answers Q4,
Q7, and a direct correction to the proposed Version 2).** In a published temporal ablation a
literature-only model nearly matched a full model, meaning much apparent skill was literature
leakage [KNOWN: temporal-validation preprint 2026]. Momentum from trial and patent activity is
defensible; momentum from publication counts as a core predictor is not and should be dropped from
the roadmap.

**F5. The field's shared blind spot is uncertainty (answers Q3, Q4, Q6).** Across Open Targets,
Insilico, Recursion, Xaira, Isomorphic, BenevolentAI, Owkin and Generate, uncertainty
quantification is near-universally weak or undisclosed; most expose point scores or heuristic
confidence, not calibrated probabilities [LIKELY: competitive brief synthesis]. Calibrated,
distribution-free uncertainty via conformal prediction is a cheap, mature capability that would
make QurieGen visibly more rigorous than the entire competitive set.

**F6. Explainability must be faithful, not decorative (answers Q4, Q5).** The common explainability
tools that look good in demos are not faithful: post-hoc GNN explainers are unstable and often do
not reflect the model's decision, attention is not explanation, and chain-of-thought can be
post-hoc rationalization [KNOWN: Jain-Wallace 2019; GNNExplainer faithfulness critiques; Turpin
2023]. The faithful substrate is path-based knowledge-graph reasoning and evidence decomposition,
where every claim resolves to a source. Any deep model is a hypothesis generator behind that
substrate, never the explanation itself.

**F7. Most of the advanced method wishlist should be deferred (answers Q4, Q8).** Reinforcement
learning for experiment selection, mechanistic whole-cell or QSP models as a platform primitive,
single-cell foundation models as primary evidence, and multi-agent LLM swarms for decisions are
each either speculative, cost-prohibitive for a small team, or low in auditability. Active learning
with Bayesian optimization captures most of the closed-loop value of RL at a fraction of the cost
and risk [KNOWN: method maturity synthesis].

**F8. Score target-disease pairs, not targets (answers Q2).** A target is not good or bad in the
abstract; it is good or bad for a disease, in a context. Every serious method (Open Targets
associations, MR, L2G) is intrinsically target-disease. Scoring bare targets discards the unit of
analysis the science actually supports.

---

## 3. Scientific Recommendations

**S1. Adopt a target-disease unit of analysis with an explicit context.** Every recommendation is
a triple: target, disease, and the evidence context (population, modality assumption). This aligns
the platform with the epidemiology and with Open Targets, and it is the only unit against which a
temporal back-test can be run honestly.

**S2. Build a causal genetic validation axis first.** Mendelian randomization from GWAS summary
statistics, with MR-Egger, weighted-median, and MR-PRESSO sensitivity analyses reported alongside
the estimate, never a lone inverse-variance-weighted number [KNOWN: MR pleiotropy methodology].
Anchor validation on human genetics and colocalization (the L2G idea), and keep text-mined evidence
explicitly down-weighted, as Open Targets does [KNOWN: Ochoa 2021].

**S3. Add a safety and tolerability axis as a first-class dimension.** Safety is a top cause of
attrition and is absent from Version 1. Genetic constraint (gnomAD LOEUF), known on-target adverse
effects, and tissue-expression specificity give a defensible, source-backed safety signal without
new modeling [KNOWN: Open Targets target prioritisation factors].

**S4. Represent uncertainty on every number.** Wrap every predictive component in conformal
prediction for distribution-free coverage, and temperature-scale any classifier for calibration
[KNOWN: Angelopoulos-Bates 2021; Guo 2017]. Report and monitor calibration (ECE with multiple
binnings). Treat conformal coverage as breaking under distribution shift and say so; novel targets
are exactly the shift regime, so confidence must widen there, not narrow.

**S5. Aggregate with desirability, not a fresh formula.** Replace flat averaging with
rank-discounted evidence aggregation within each source (the Open Targets harmonic sum is the
single most copyable idea) and combine dimensions with a desirability function that propagates
uncertainty [KNOWN: Ochoa 2021; Segall 2012]. This keeps the multiplicative veto instinct of
Version 1 while making it principled and tunable.

**S6. Keep language models on a short leash.** Retrieval-augmented generation with chain-of-
verification, every claim grounded in a retrieved citation, human sign-off before anything enters
a decision [KNOWN: Lewis 2020; Dhuliawala 2023]. Never use an LLM's self-explanation as evidence.

**S7. Drop publication momentum as a predictor.** Retain trial-date and patent momentum as
optional, clearly-labeled strategic context, not as a core scientific term.

---

## 4. Architectural Recommendations

The platform is one pipeline, not a zoo of models, and it maps cleanly onto the four-layer
separation the platform already uses (data, model/inference, API, UI). The board recommends the
following inference stack, layered from evidence to recommendation.

```
                    THE SCIENTIFIC DECISION ENGINE (V3)

  [ Raw evidence ]  genetics, expression, perturbation, chemistry, trials,
        |           literature, safety           (swappable Source adapters)
        v
  [ 1. Evidence layer ]
        curated knowledge graph + metapath (degree-weighted path) scoring
        as the interpretable, faithful baseline and explanation substrate;
        GNN embeddings as a PILOT hypothesis-generator that must beat the
        metapath baseline before it earns any trust
        |
        v
  [ 2. Causal de-risking ]
        Mendelian randomization + colocalization, with mandatory pleiotropy
        sensitivity analysis         <-- highest-value differentiator
        |
        v
  [ 3. Evidence fusion ]
        Bayesian fusion with explicit source-correlation modeling
        (no double-counting of shared-origin evidence);
        conformal + temperature-scaling uncertainty wrapping every component
        |
        v
  [ 4. Dimension scores ]  D1 causal genetics | D2 broader biology |
        D3 tractability | D4 safety | D5 competitive white space |
        D6 disease burden     each: value + calibrated interval + evidence
        |
        v
  [ 5. Aggregation + recommendation ]
        desirability aggregation (uncertainty-propagating) ->
        separate Merit and Strategic axes -> Pareto view ->
        expected-utility ranking for triage
        |
        v
  [ 6. Next-experiment ]
        active learning / Bayesian optimization driven by value-of-information
        |
        v
  [ Scientific Trust Layer  ==  cross-cutting, wraps every stage ]
        provenance on every fact, reasoning provenance on every model touch,
        versioning, per-fact confidence, click-through citations, reproducible
        content hashes
```

**A1. The Trust Layer is the spine, not a side feature.** It wraps every stage. This is the moat
and the reason a pharma partner can defend a QurieGen recommendation to their own review board.

**A2. Keep the swappable source boundary.** Adding Martina's sources (FDA, EMA, patents, registries,
Pharos) changes how completely each dimension is measured, not the architecture. The adapter seam
already in the platform is correct and should be held [KNOWN: current platform design].

**A3. Deep models live behind the faithful substrate, never in front of it.** Any GNN, embedding,
or language model is a hypothesis generator or a feature source. The human-facing explanation is
always the path and the evidence decomposition.

**A4. Contract-first between layers.** The versioned API contract between inference and UI lets the
science and the interface evolve independently and lets every number carry its score version. This
is already in place and is a genuine strength.

---

## 5. Mathematical Framework

The board assessed thirteen candidate approaches. The verdict, in three tiers, is below. The
governing principle: spend the limited engineering budget on calibration, causal grounding, and
faithful explanation, not on the flashiest deep-learning tier.

**Build now (core, mature, high return on effort).**
- **Bayesian evidence fusion** for combining heterogeneous sources of differing reliability, with
  explicit modeling of source correlation to avoid overconfidence from shared-origin evidence
  [KNOWN]. This is the fusion core.
- **Mendelian randomization** for causal target validation, with pleiotropy sensitivity analysis
  [KNOWN]. Highest-value differentiator.
- **Desirability / multi-parameter optimization** for aggregation across conflicting objectives
  [KNOWN: Segall 2012; Derringer-Suich 1980], and rank-discounted (harmonic-sum) within-source
  aggregation [KNOWN: Ochoa 2021].
- **Decision theory / expected utility** as the recommendation layer, enabling value-of-information
  [KNOWN].
- **Conformal prediction and temperature scaling** for calibrated, distribution-free uncertainty
  [KNOWN: Angelopoulos-Bates 2021; Guo 2017].
- **Path-based knowledge-graph reasoning** (degree-weighted metapaths) as the faithful explanation
  substrate [KNOWN: Himmelstein 2017].
- **Protein language-model embeddings (ESM)** as cheap, validated features [KNOWN].
- **Retrieval-augmented generation with chain-of-verification**, citations mandatory, human sign-off
  [KNOWN: Lewis 2020; Dhuliawala 2023].

**Pilot with guardrails (emerging, real value, needs baselines).**
- **Graph neural networks on the knowledge graph** for hypothesis generation and candidate
  expansion only, always benchmarked against the metapath baseline, never as standalone evidence.
  Watch degree-bias shortcut learning and inflated link-prediction metrics [KNOWN: TxGNN, PoLo;
  degree-bias critiques].
- **Active learning / Bayesian optimization** for next-experiment selection, with honest holdout
  evaluation and batch diversity [KNOWN].
- **Small, hand-specified probabilistic graphical models** for well-understood sub-problems only.
  Do not attempt to learn a giant biomedical DAG [KNOWN: structure learning is NP-hard].
- **Deep ensembles** for uncertainty if GPU budget allows [KNOWN: Lakshminarayanan 2017].

**Defer or avoid (speculative, or wrong cost-benefit for a small team).**
- **Reinforcement learning** for experiment selection: sample-inefficient, low-auditability, needs a
  simulator a wet-lab-limited startup lacks. Active learning captures most of the value [LIKELY].
- **Mechanistic ODE / QSP** as a platform primitive: high build cost, non-identifiability; commission
  bespoke only for a specific high-value pathway [KNOWN in niche use].
- **Single-cell foundation models** as primary evidence: multiple benchmarks show they often fail to
  beat simple baselines; test against baselines before trusting [KNOWN critique: Kedzierska;
  Ahlmann-Eltze 2024].
- **Evidential deep learning** as sole uncertainty method: documented to not properly learn epistemic
  uncertainty [KNOWN critique].
- **NSGA-II**: overkill unless there is genuinely expensive black-box multi-objective search
  (generative chemistry), which is out of scope here [KNOWN].
- **Multi-agent LLM swarms** for decisions: compounding hallucination, poor auditability, unproven
  over a single structured tool-using agent. Reserve for offline ideation only [HYPOTHESIS].

---

## 6. Validation Strategy

A decision engine is only as credible as its validation, and this is where the platform can
out-rigor the field. The strategy must satisfy four audiences at once: computational biologists
(rigor), pharma partners (clinical relevance), a scientific advisory board (falsifiability), and
technical diligence (reproducibility).

**V1. Temporal back-testing (the primary gate).** Freeze all evidence as of a past date, predict,
and test against what actually happened after that date. This is the only design that does not leak
the future. Report target-disease pairs that advanced or approved versus those that failed, and
require the genetics axis to survive train-on-the-past, test-on-the-future, where it is known to
hold at an odds ratio around two point eight to three point five [KNOWN: temporal-validation
preprint 2026].

**V2. Ablation studies.** Remove each dimension and each source and measure the change in predictive
skill. This is how F4 (literature leakage) was detected in the literature and is how the platform
proves each axis earns its place.

**V3. Calibration.** Report expected calibration error with multiple binnings, and conformal
coverage on held-out and shifted sets. A rigorous, published calibration curve is something no
competitor currently shows and is disproportionately persuasive in diligence.

**V4. Ranking stability.** Perturb inputs and re-rank; a trustworthy engine's top recommendations
should not flip on trivial noise. Report rank correlation under bootstrap.

**V5. Expert agreement.** Blind a panel of target-discovery scientists to the score and measure
agreement, and more importantly measure where the engine and experts disagree and who was right in
back-test. Disagreement that the engine wins is the strongest possible demo.

**V6. Inter-source consistency.** When two independent sources bear on the same fact, measure how
often they agree; surface conflict rather than silently averaging it.

**V7. Reproducibility.** Every number reproduces from pinned source snapshots and a content hash,
already the platform's practice. This is the floor for diligence and the platform already clears it.

**V8. Prospective validation (the eventual proof).** Pre-register predictions and track them
forward. This is slow and is the only thing that ultimately silences a skeptic, so it should start
now even though it pays off later.

---

## 7. Competitive Positioning

The competitive set splits along a fault line that clarifies where QurieGen can be world-class.

**Design companies, not target-discovery companies.** Isomorphic Labs (AlphaFold3-based design) and
Generate Biomedicines (Chroma generative proteins) are downstream of target selection; presenting
them as target discovery is a category error [KNOWN]. They do not compete with TIOP directly.

**Data and phenotype companies.** Recursion (phenomics maps) and Xaira (large-scale Perturb-seq and
a virtual cell) bet on proprietary perturbation and imaging data to infer biology. Their strength is
mechanistic breadth and proprietary data; their weakness is that correlation in an embedding map is
not human causal relevance, and both are pre-clinical on the target-ID claim [KNOWN/LIKELY]. Their
explainability is low by construction.

**Genetics and knowledge-graph companies.** Open Targets is the closest reference design and is
more sophisticated than a first glance suggests: harmonic-sum aggregation, an L2G gradient-boosted
model with SHAP attributions, and a deliberately non-fused target prioritisation view [KNOWN: Ochoa
2021, 2023; L2G docs]. It is open, reproducible, and best-in-class on provenance. BenevolentAI
showed a knowledge graph can produce a real validated win (baricitinib for COVID) and a real
failure (its novel internal target failed Phase II), which is the sector's cautionary tale that
hypothesis generation is not clinical success [KNOWN].

**Only two organizations have prospective target-ID-to-clinic evidence at all.** Insilico
(Rentosertib, a TNIK inhibitor, Phase IIa published in Nature Medicine in 2025, but a small,
secondary-endpoint efficacy signal) and BenevolentAI (baricitinib repurposing, approved, but its
novel target failed) [KNOWN: Nat Med 2025; baricitinib record]. Everything else is platform or data
validation, not target-to-clinic validation.

**Where QurieGen can be world-class, realistically.** Not on structure (AlphaFold owns it), not on
proprietary perturbation data at Xaira or Recursion scale, and not on beating Open Targets at open
evidence aggregation. The defensible, winnable position is the **auditable scientific decision
layer**: the only platform that unifies calibrated uncertainty, faithful path-based explanation,
causal genetic grounding, and complete provenance into a single decision object a pharma partner
can defend to their own board. Open Targets has the provenance but not the decision layer or
calibrated uncertainty; the AI-bio companies have the models but not the auditability. That gap is
real and open [HYPOTHESIS, but well-supported by the competitive synthesis].

---

## 8. Risks

**R1. Data-access risk on genetics.** The genetics-first thesis is only as strong as access to GWAS
summary statistics, QTL, and colocalization data. This is an acquisition dependency, not just a
modeling choice, and should be secured early.

**R2. Overfitting the back-test.** A pre-registered, temporal, ablated protocol is the guard, but a
team that tunes against its own back-test will fool itself. Validation must be run by someone who
did not build the model, ideally with a held-out era never touched during development.

**R3. Uncertainty theater.** Conformal coverage breaks under distribution shift, and novel targets
are the shift regime. Reporting a calibration number that only holds in-distribution would be worse
than reporting none. Confidence must widen honestly on novelty.

**R4. Explainability that is not faithful.** If a deep model creeps into the explanation path
(attention maps, GNN post-hoc explainers, chain-of-thought), the platform's central claim
collapses. This requires ongoing discipline, not a one-time decision.

**R5. Scope sprawl.** The method wishlist is seductive. The single biggest execution risk for a
small team is building the deferred tier (RL, foundation models, agent swarms) instead of the core.
The roadmap in section 9 exists to resist this.

**R6. Citation and figure risk.** Several success-rate figures in the literature are labeled LIKELY
and some competitor figures come from press. Before anything goes to external scientists or
diligence, the load-bearing citations must be re-verified against primary artifacts. The two
flagged for re-verification are the exact pharma deal values and the precise BenevolentAI endpoint
wording.

**R7. The "why not build it ourselves" risk from pharma.** Addressed directly in section 11; if the
answer is not durable, the business is not defensible.

---

## 9. Prioritized Recommendations

**Must (do now, Version 3 core).**
- Score target-disease pairs, not targets.
- Build the causal genetic validation axis (MR with pleiotropy sensitivity) and rebuild the
  validation term around it.
- Add the safety axis.
- Attach conformal uncertainty and calibration to every number.
- Replace flat averaging with rank-discounted within-source aggregation and desirability across
  dimensions.
- Make the Trust Layer wrap every stage and carry a score version on every number.
- Stand up the temporal back-test with ablations as the primary validation gate.
- Drop publication momentum from the roadmap.

**Should (next, Version 3 completion into Version 4).**
- Separate Merit and Strategic axes with a Pareto view.
- Make crowding absolute (FDA, EMA) rather than cohort-relative.
- Add the metapath explanation substrate and click-through path reasoning.
- Add RAG-with-verification literature synthesis, human sign-off enforced.
- Add expected-utility triage ranking.

**Could (opportunistic, when data or need appears).**
- Pilot GNN embeddings for candidate expansion, gated on beating the metapath baseline.
- Active learning for next-experiment recommendation once a wet-lab loop exists.
- Deep ensembles for uncertainty if GPU budget allows.
- Small hand-specified PGMs for specific well-understood sub-problems.

**Future (research bets, deliberately deferred).**
- Knowledge-graph causal reasoning at scale.
- Virtual-cell and perturbation integration.
- The closed loop with the wet lab and active-learning-driven experiment design.
- Explicitly avoid, not defer: RL for decisions, single-cell foundation models as primary evidence,
  evidential deep learning as sole UQ, multi-agent LLM swarms for decisions, mechanistic whole-cell
  models as a platform primitive.

---

## 9b. Version Roadmap (Q9: V3 to V6)

Each version is defined by scientific capability, engineering effort, expected impact, validation
milestone, technical risk, and dependency. The rule across all four: no version ships a capability
it cannot validate.

**Version 3, the trustworthy core (now).**
- *Capability:* target-disease scoring across the six calibrated dimensions, causal genetics axis,
  safety axis, conformal uncertainty, desirability aggregation, faithful path explanation, Trust
  Layer wrapping every stage.
- *Effort:* moderate; almost all methods are mature and cheap. The work is integration and
  discipline, not research.
- *Impact:* this is the version that is scientifically defensible in diligence, the commercial
  foundation.
- *Validation milestone:* pre-registered temporal back-test passes with ablations, and a published
  calibration curve.
- *Risk:* overfitting the back-test; scope creep into deferred methods.
- *Dependency:* access to GWAS, QTL, and colocalization data; FDA and EMA for absolute crowding.

**Version 4, the learned and reasoned layer (next).**
- *Capability:* a learned ranker trained on real clinical-outcome labels once enough are
  accumulated; metapath and pilot GNN hypothesis expansion; expected-utility triage; RAG literature
  synthesis with verification.
- *Effort:* moderate to high; requires an outcome-label dataset and careful guardrails.
- *Impact:* moves from expert-weighted to evidence-learned prioritization, a real accuracy step.
- *Validation milestone:* the learned ranker beats the desirability baseline on held-out future
  eras, not just in-sample.
- *Risk:* label scarcity and leakage; GNN degree-bias; letting a model become the explanation.
- *Dependency:* a curated, versioned clinical-outcome label set; the V3 back-test harness.

**Version 5, the closed experimental loop (later).**
- *Capability:* active-learning and value-of-information experiment recommendation connected to a
  wet-lab loop; predictions feed experiments, results update the models.
- *Effort:* large; needs experimental integration and infrastructure.
- *Impact:* proprietary causal data no competitor has, the compounding moat.
- *Validation milestone:* prospective, experiment-confirmed predictions.
- *Risk:* highest; sim-to-real gap, self-reinforcing model blind spots, cost.
- *Dependency:* a functioning experimental pipeline and calibrated V3/V4 uncertainty to drive
  acquisition.

**Version 6, the causal virtual-cell vision (research bet).**
- *Capability:* mechanistic and perturbation-grounded causal modeling of cellular response
  integrated into the decision engine; the platform proposes, tests, and learns causal biology.
- *Effort:* very large; substantial research risk.
- *Impact:* the durable long-term differentiator if it works, unproven if it does not.
- *Validation milestone:* causal predictions confirmed prospectively against controlled
  perturbation data.
- *Risk:* the highest; this is where Xaira and Recursion are betting and none have proven it.
- *Dependency:* proprietary multi-omics and perturbation data, and everything below it in the stack.

The discipline point: V3 must fully earn trust before V4, and V4 before V5. A team that jumps to
V5 or V6 capabilities before the core is validated is building the deferred tier the board
explicitly warned against in R5.

---

## 10. Final Consensus Architecture

The board's consensus, in one paragraph a diligence team could hold in their head. QurieGen is a
**scientific decision engine for therapeutic target intelligence**, built on a **swappable evidence
layer** feeding six **explainable, calibrated dimensions** (causal genetics, broader biology,
tractability, safety, competitive white space, disease burden), scored per **target-disease pair**,
fused with **uncertainty-aware Bayesian and desirability methods**, aggregated into **separate merit
and strategic axes with a Pareto view and expected-utility triage**, explained through a **faithful
path-based substrate** rather than opaque model internals, and wrapped end-to-end by a **Scientific
Trust Layer** of provenance, versioning, confidence, and reproducibility. Deep models sit behind the
faithful substrate as hypothesis generators, never as explanations. The whole engine is validated by
**pre-registered temporal back-testing with ablations and honest calibration**, and evolves toward a
**closed experimental loop** only after the core earns trust. Ambition in framing, conservatism in
method, radical seriousness about provenance and validation. That is the architecture this board
would defend.

---

## 11. The QurieGen Advantage

If the platform succeeds, why would pharma choose QurieGen over building internally or licensing
Open Targets, PandaOmics, or a phenomics map? The answer must be durable and scientific, not
marketing, and it rests on four things that are individually available elsewhere but are nowhere
combined.

**Traceability that survives a regulator.** Every recommendation resolves to its evidence, its
reasoning path, and the exact data version that produced it. Open Targets has provenance but not a
decision layer; the AI-bio companies have decision-shaped outputs but not auditable provenance. A
pharma partner can defend a QurieGen recommendation to their own review board, which is what they
actually cannot do with a black-box score, and internal teams rarely build this discipline because
it is unglamorous.

**Calibrated honesty about uncertainty.** The platform tells you not just what to pursue but how
sure it is, and where its confidence breaks. In a field where uncertainty quantification is
near-universally absent, a calibrated engine is more trustworthy precisely because it declines to
overclaim. This is a scientific advantage, not a feature.

**Causal grounding over correlation.** By anchoring on human genetics and Mendelian randomization,
the platform targets the one signal with the strongest evidence of predicting clinical success,
rather than the literature and phenotype correlations that leak and mislead.

**An integration and validation asset that compounds.** The swappable source layer plus the
pre-registered back-test means every new source and every passing quarter makes the engine more
complete and more provably accurate, and that accumulated, versioned, validated evidence base is
proprietary and hard to replicate. A pharma company could build any one piece; assembling all four,
maintained and validated over years, is the durable moat.

The honest caveat: this advantage is real only if the platform actually delivers calibration,
causal grounding, and faithful explanation, and actually runs the validation. The moat is not the
idea; it is the disciplined execution of the idea, sustained. That is within reach of a focused
team, and it is not within easy reach of a competitor who has bet on models instead of trust.

---

## 12. Addendum: Discovery front-ends (ANNi, HGT) and the Bayesian decision core

This addendum resolves two questions raised after the main review: where swarm neural networks
(ANNi) fit, and whether Agent 6 should use a heterogeneous graph transformer (HGT), as the wider
AIVC OS vision proposed, or Bayesian fusion, as this review recommends. Both resolve the same way:
they are not competitors with the decision core; they are discovery front-ends that feed it.

### 12.1 The layering principle

Agent 6 has two separable jobs. **Discovery** proposes candidate target-disease hypotheses.
**Decision** turns evidence about a candidate into a defensible recommendation with calibrated
uncertainty, provenance, and a faithful decomposition. Discovery is a representation and
feature-selection problem. Decision is a reliability-weighted evidence-fusion problem. Using a
discovery tool as the decision-maker forfeits the moat, because discovery tools do not natively
produce calibration or provenance.

```
  DISCOVERY FRONT-ENDS (hypothesis generators, behind the faithful substrate)
    ANNi / swarm neural networks   <- raw proprietary multi-omics (wet lab, later)
    HGT / graph transformer        <- novel links from the knowledge graph (V4+)
        |
        v  candidate target-disease pairs, each tagged with a discovery confidence
  DECISION CORE
    Bayesian evidence fusion (reliability-weighted, source-correlation modeled)
      + desirability aggregation + conformal uncertainty
        |
        v
    calibrated decision object, wrapped by the Scientific Trust Layer
        (metapath paths are the explanation over the whole pipeline)
```

### 12.2 ANNi (swarm neural networks) as the proprietary discovery front-end

ANNi is not a peer of Agent 6; it is a peer of the discovery methods in Graham's comparison table
(differential expression, LASSO, WGCNA, MOFA, DIABLO, ARACNe, MOGONET). It operates on raw cohort
multi-omics and identifies phenotype-informative features and network drivers, including
interaction-driven targets that differential expression misses [LIKELY: the muscle-ageing ANNi
application and swarm-based AML work cited in the source deck].

Why it matters for QurieGen: it is a candidate for the proprietary discovery asset the main review
found missing against Xaira and Recursion. Three properties make it fit the platform rather than
fight it. Its stability mechanic (selection frequency and rank consistency across resamples,
cohorts, and omics layers) is formal stability selection and is a genuine discovery-layer
confidence signal that plugs into the Trust Layer and the ranking-stability validation milestone.
Its per-model evidence trail (feature in, phenotype out, samples held out, error, selection
frequency) is provenance one layer upstream of ours. And it sits on the phenotype-and-network-first
side of the methodological fault line, so it hedges the genetics-first core: genetics gives causal
human relevance, ANNi gives mechanistic breadth.

The hard constraints, stated honestly. ANNi's own documentation concedes its network directions are
"computational hypotheses rather than proven causal edges" and that its evidence base is smaller
than that of established statistical methods. So it is [EMERGING], it must never be presented as
causal until confirmed by genetics, time-series, or perturbation, and it must clear the same
pre-registered temporal and ablation gate as any model. It also carries a data-generation
dependency: it needs labeled multi-omics cohorts, which the QurieGen wet lab will produce later.
This places ANNi at Version 5 (the closed experimental loop), not in the Version 3 core.

### 12.3 HGT versus Bayesian for the decision core: Bayesian

For Agent 6's decision core, Bayesian evidence fusion is the correct choice, and HGT belongs in the
discovery layer, for three reasons.

First, the deliverable. Agent 6 must state how sure it is, on what basis, and along which axis.
Bayesian fusion gives all three natively: the posterior propagates uncertainty, priors and
per-source likelihoods are inspectable, and each source's contribution decomposes. HGT yields a
learned score with attention weights that are not faithful explanations [KNOWN: Jain-Wallace 2019]
and no native calibration or provenance.

Second, the evidence structure. Agent 6 fuses sources of very different reliability and must not
double-count evidence of shared origin. Bayesian fusion models source reliability and correlation
explicitly; HGT learns from topology and inherits knowledge-graph degree and popularity bias, so it
tends to predict on how well-studied a gene is rather than on biology [KNOWN: GNN degree-bias
critiques].

Third, the data reality. Near-term Agent 6 scores tens to a few hundred known target-disease pairs
from curated public evidence. HGT is data-hungry and earns its value on large graphs for novel-link
discovery; using it to score a small set of known pairs is over-engineering with worse auditability,
and it is the "single black-box target picker" this review told the team to avoid [KNOWN: HGT, Hu et
al., WWW 2020].

Where HGT does belong: the evidence and discovery layer, as a pilot hypothesis generator over the
knowledge graph, gated on beating a degree-weighted metapath baseline, feeding the Bayesian core as
one confidence-tagged evidence input, never as the decision and never as the explanation.

### 12.4 Reconciling the AIVC OS vision

The AIVC OS bet on HGT and this review's Bayesian recommendation are both correct, for different
layers. HGT is a sound knowledge-graph reasoning and discovery substrate; Bayesian fusion is the
decision core. The only error would be letting HGT become the decision-maker, which would trade the
platform's auditability moat for a black box. Sequencing follows the roadmap: Bayesian fusion plus
metapath explanation in Version 3 now; HGT as a gated discovery pilot at Version 4-plus when the
graph is large and discovery matters; ANNi as the proprietary discovery front-end at Version 5-plus
when the wet lab delivers labeled multi-omics data.

---

## Citations

Genetics and clinical success: Nelson et al., Nat Genet 2015 (ng.3314); King, Davis, Degner, PLoS
Genet 2019 (pgen.1008489); Minikel et al., Nature 2024 (s41586-024-07316-0); Ochoa et al., Nat Rev
Drug Discov 2022 (PMID 35804044); temporal-validation preprint arXiv 2026. Attrition: Hay et al.,
Nat Biotechnol 2014 (nbt.2786); Wong, Siah, Lo, Biostatistics 2019 (kxx069); Harrison, Nat Rev Drug
Discov 2016 (nrd.2016.184). Open Targets: Ochoa et al., NAR 2021 (gkaa1027) and 2023 (gkac1046);
Buniello et al., NAR 2025 (gkae1128); Mountjoy et al., Nat Genet 2021 (s41588-021-00945-5); Platform
docs (associations, target-prioritisation, tractability, locus-to-gene). Competitors: Insilico
Rentosertib, Nature Medicine 2025 (EurekAlert 1086096) and Phase III initiation (PRNewswire);
Isomorphic Labs AlphaFold3, Nature 2024 (s41586-024-07487-w) and 2025 raise/deals (credible press);
Recursion Q2 2025 (investor relations); BenevolentAI baricitinib (Richardson et al., Lancet 2020)
and BEN-2293 setback (FierceBiotech); Generate Biomedicines Chroma, Nature 2023; Xaira X-Atlas/Orion
(BusinessWire 2025); Owkin MOSAIC and interpretable MIL (owkin.com publications). Methods:
Himmelstein et al. (Hetionet/Rephetio), eLife 2017 (e26726); Huang et al. (TxGNN), Nat Med 2024
(s41591-024-03233-x); Liu et al. (PoLo), ESWC 2021; Jain, Wallace, NAACL 2019; Turpin et al.,
NeurIPS 2023; Derringer, Suich, J Qual Technol 1980; Segall, Curr Pharm Des 2012 (PMID 22316157);
Peters, Buhlmann, Meinshausen, JRSS-B 2016 (rssb.12167); Angelopoulos, Bates, arXiv 2107.07511; Guo
et al., ICML 2017 (arXiv 1706.04599); Lakshminarayanan et al., NeurIPS 2017 (arXiv 1612.01474);
Lewis et al. (RAG), NeurIPS 2020 (arXiv 2005.11401); Dhuliawala et al. (chain-of-verification), ACL
Findings 2024 (arXiv 2309.11495); Kedzierska et al. 2023 and Ahlmann-Eltze et al. 2024 (single-cell
foundation-model baselines).

Confidence labels are applied inline. Treat vendor press claims and preprints as provisional until
peer-reviewed; the deal values and the BenevolentAI endpoint wording should be re-verified against
primary artifacts before external circulation.
