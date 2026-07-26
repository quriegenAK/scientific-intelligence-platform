# Scientific Design Review: Target Opportunity Scoring, and a Version 3 Architecture

Prepared as an adversarial scientific review. The goal is not to validate Version 1. The goal is
to challenge it against how the best organizations and the peer-reviewed literature actually do
target prioritization, and to redesign the scoring engine from first principles so it could
credibly become a gold standard for explainable, trustworthy, AI-assisted target intelligence.

Evidence labels used throughout: **[KNOWN]** verified against a primary source; **[LIKELY]**
well-supported but a specific figure not re-verified; **[HYPOTHESIS]** a design inference, not an
established claim. Citations are listed in section 8.

---

## 0. The honest verdict up front

Three findings from the literature should reshape the whole engine.

1. **Human genetic and causal evidence is the single best-validated predictor of clinical
   success, and our Version 1 barely uses it.** Genetically supported mechanisms succeed about
   2 to 2.6 times more often, roughly two thirds of 2021 FDA approvals had human genetic support,
   and the effect survives a strict train-on-the-past, test-on-the-future split (odds ratio around
   2.8 to 3.5) [KNOWN: Nelson 2015; Minikel 2024; Ochoa 2022; temporal-validation preprint 2026].
   Version 1's validation term V is the single strongest Open Targets disease association, which
   throws away most of this signal and does not distinguish causal genetic evidence from text
   mining.

2. **The thing a target score is supposed to prevent, efficacy failure from wrong-target biology,
   is the largest cause of late-stage attrition, larger than safety** [KNOWN: Hay 2014; Harrison
   2016; Wong 2019]. So the science of the score matters commercially, and it must be validated
   against real clinical outcomes, not just face-validity checks.

3. **Literature and news "momentum" signals leak the future and are the most gameable inputs.** In
   a published temporal ablation, a literature-only model nearly matched a full model, while
   genetics alone added about one point of precision, meaning much apparent skill was literature
   leakage [KNOWN: temporal-validation preprint 2026]. This is a direct warning against the
   momentum-from-publications idea in our proposed Version 2.

Where Version 1 is genuinely ahead: the **Scientific Trust Layer** (provenance, versioning,
reproducibility, per-fact confidence, click-through citations) is something most competitors do
not expose, and it is exactly what pharma diligence and regulators want. That is a real moat and
should be deepened, not replaced. The multiplicative "must have all three" instinct is also
correct in spirit; it is an informal desirability function, a known and respected construction
[KNOWN: Derringer-Suich 1980; Segall 2012]. The redesign keeps these and fixes the rest.

---

## 1. How the best organizations actually do this

No serious competitor publishes a full scoring formula; all treat the aggregation weights as
proprietary. But the public methods and validations are informative.

**Open Targets** is the closest reference design and is more sophisticated than we are giving it
credit for [KNOWN, all from the Platform papers and docs: Ochoa 2021, 2023; Buniello 2025].
- It aggregates evidence with a **rank-discounted harmonic sum**: within a datasource, evidence is
  sorted and scored as the sum of score_i divided by i-squared, normalized by the theoretical
  maximum. The best few pieces of evidence dominate and piling on weak evidence gives diminishing
  returns. This is a much better aggregator than our simple average, and it is the single most
  copyable idea for us.
- Datasource weights are explicit (text mining and expression down-weighted to 0.2, most sources
  1.0) and are now user-adjustable.
- It scores **target-disease pairs**, not targets in isolation, with ontology propagation across
  disease terms.
- Its **Target Prioritisation** view scores every target on about 13 disease-agnostic factors
  grouped as precedence, tractability, doability, and **safety** (genetic constraint, essentiality,
  mouse knockout severity, tissue specificity, known safety events), rendered on a signed red-to-
  green scale.
- **Locus-to-Gene (L2G)** is a gradient-boosted model that assigns the causal gene at a GWAS locus
  from distance, QTL colocalization, variant effect, and enhancer-to-gene features, trained on
  curated effector genes [KNOWN: Mountjoy 2021]. This is how genetics becomes a target signal.

**Insilico Medicine (PandaOmics / TargetPro / TargetBench)** is the deepest published target-
discovery engine [KNOWN: Kamya 2024; Pun 2022; TargetPro preprint 2025]. It ensembles more than
20 models across omics, network propagation, matrix factorization, attention, and literature NLP
into a combined metascore, and it now ships a public benchmark. Its validation ladder is the
strongest in the field: an AI-nominated target (TNIK) became a clinical asset that reported a
positive Phase 2a efficacy signal [KNOWN: Rentosertib, Nature Biotechnology 2024, Nature Medicine
2025]. Caution: the reported "71.6 percent clinical-target retrieval" is a retrospective recall
figure whose temporal split we could not verify, so it should not be read as prospective skill.

**BenevolentAI** ranks disease-target hypotheses by reasoning over a biomedical knowledge graph and
is notable for **explainable evidence paths**; it produced the baricitinib-for-COVID prediction
that reached FDA authorization [KNOWN: Richardson 2020]. Explanations are a first-class output, and
a clinician study on a related graph model (TxGNN) showed explanations raised both accuracy and
confidence [KNOWN: Huang 2024].

**Recursion** and **Owkin** compete on proprietary data rather than formulas: Recursion on genome-
scale phenomics with a vision foundation model and known-relationship recall benchmarks [KNOWN:
RxRx3; Kraus 2024]; Owkin on federated hospital multi-omics with clinical-outcome-anchored ranking
[KNOWN, vendor-reported multipliers]. **DeepMind and Isomorphic** provide structure and variant
tools (AlphaFold, AlphaMissense) that feed druggability and genetics, not an end-to-end target
ranker [KNOWN: Jumper 2021; Abramson 2024; Cheng 2023]. **Atomwise, Generate, Exscientia,
BenchSci** are molecule or evidence tools, not target rankers.

The academic frontier for target-disease ranking has moved network-propagation to embeddings to
explainable reinforcement-learning paths to **zero-shot graph foundation models**, the strongest
being **TxGNN** over the PrimeKG knowledge graph, validated with held-out disease areas, a
clinician study, and 1.27 million patient records [KNOWN: Himmelstein 2017; Liu 2021; Huang 2024].

**Two competitive lessons.** First, the moat is data plus validation plus trust, not the formula;
our formula is replicable, so our defensibility must come from the Trust Layer, a real benchmark,
and eventually proprietary data. Second, the one thing we already do that most of them do not is
expose full provenance and reproducibility. Keep that lead.

---

## 2. Methods that matter (what to build with)

- **Evidence aggregation.** Rank-discounted harmonic sum (Open Targets) or **noisy-OR Bayesian
  aggregation**, where each evidence type is a noisy cause of "good target" with an explicit
  reliability, giving an interpretable, monotone, probabilistic score that degrades gracefully
  when a channel is missing [KNOWN: Troyanskaya 2003; Open Targets docs]. Both beat naive
  averaging and stay explainable.
- **Multi-objective aggregation.** **Desirability functions** map each objective to 0 to 1 and
  combine by geometric mean, so any zero vetoes the candidate; **multi-parameter optimization**
  adds uncertainty propagation so ranking reflects confidence, not just point estimates [KNOWN:
  Derringer-Suich 1980; Segall 2012]. Our multiplicative score is a crude special case of this;
  formalizing it is a clean upgrade. For genuinely conflicting objectives, expose a **Pareto
  front** rather than hiding trade-offs in one number [KNOWN: NSGA-II, Deb 2002 LIKELY].
- **Uncertainty.** **Conformal prediction** gives distribution-free, finite-sample coverage and is
  proven in cheminformatics, especially **Mondrian/class-conditional** variants for imbalanced
  data [KNOWN: Angelopoulos 2021; Bosc 2018; Norinder 2017]. **Deep ensembles** and **evidential
  deep learning** separate epistemic from aleatoric uncertainty [KNOWN: Lakshminarayanan 2017;
  Amini 2020; Hirschfeld 2020].
- **Calibration.** **Temperature scaling**, **reliability diagrams**, and **expected calibration
  error** are the standard toolkit; report several metrics and validate calibration on temporally
  held-out data because it degrades under the shift typical of prospective discovery [KNOWN: Guo
  2017; Minderer 2021].
- **Causal evidence.** **Mendelian randomization** with cis-QTL instruments and colocalization
  tests whether perturbing a target causally moves a disease, mimicking a trial [KNOWN: Schmidt
  2020; Gill 2021]. **Invariant causal prediction** identifies predictors whose effect is stable
  across environments [KNOWN: Peters 2016]. These are how "validation" becomes causal rather than
  correlational.
- **Learning to rank.** Listwise or pairwise learning to rank (**LambdaMART**) directly optimizes
  ranking metrics and, with tree models, keeps feature attributions interpretable [KNOWN: Burges
  2010]. This is how we move from a fixed heuristic to a model trained on real clinical outcomes
  while staying explainable.
- **Explainability.** **SHAP** and **integrated gradients** for attributions, **GNNExplainer** and
  path-based reasoning for graph evidence, with the caution that **attention is not a faithful
  explanation** [KNOWN: Lundberg 2017; Ying 2019; Jain-Wallace 2019]. Measure explanation
  faithfulness and stability, not only plausibility.
- **LLM grounding.** Retrieval-augmented generation, chain-of-verification, and self-consistency;
  require every model-surfaced claim to carry a retrieved citation and a verification pass, and
  treat unresolved claims as abstentions [KNOWN: Lewis 2020; Dhuliawala 2024; Wang 2023].
- **Benchmarks.** **Therapeutics Data Commons** provides adjacent tasks (gene-disease association,
  trial-outcome) but, importantly, **no ready-made target-prioritization-to-approval benchmark**,
  so a bespoke temporal benchmark must be built [KNOWN: Huang 2021].

---

## 3. Critique of Version 1

Version 1 is: Opportunity = 100 x V x T x (1 - S), with V the top Open Targets association, T a
hand-weighted tractability bucket, and S a cohort-relative average of four crowding counts. Judged
against sections 1 and 2, here is what is weak, missing, and unscalable, by reviewer.

### 3.1 What a pharma / computational-biology reviewer will attack

1. **It scores targets, not target-disease pairs.** Opportunity is contextual: a target is an
   opportunity *for a disease*. Everyone serious works at target-disease resolution [KNOWN: Open
   Targets; Minikel; TxGNN]. Version 1 secretly picks the top disease to compute V, then discards
   it, while S is measured over all the target's drugs across all diseases. That is incoherent.
2. **Validation ignores the best predictor.** V is one association score that blends genetics with
   text mining. It does not privilege human genetic or causal evidence, which is the signal most
   tied to approval [KNOWN: Minikel 2024]. A validation axis that does not center genetics is
   scientifically behind Open Targets, which already separates and weights evidence types.
3. **No safety axis.** Safety and tolerability are a top-two cause of failure and a whole axis in
   Open Targets prioritisation; Version 1 has none [KNOWN: Hay 2014; Open Targets].
4. **The numbers are not probabilities.** V, T, and S are arbitrary 0 to 1 quantities multiplied
   together. The result, 55.8, is not a probability of anything and has no units, so it cannot be
   calibrated or checked against outcomes.
5. **Saturation conflates two different things.** A crowded field can mean the target is validated
   and de-risked, not that it is a bad opportunity. Collapsing competition into the same number as
   scientific quality hides the actual strategic question.
6. **Cohort-relative scaling and hand-set tractability weights** are known weaknesses we have
   already flagged; they make scores unstable and subjective.

### 3.2 What VC technical diligence will attack

1. **No defensible moat in the formula.** It is a hand-weighted heuristic over public data that a
   competent team could reproduce in a week. The moat has to be the Trust Layer, a validated
   benchmark, and proprietary data, none of which the formula provides on its own.
2. **No benchmark and no calibration.** The only evaluation is a small face-validity gate. There is
   no temporal back-test against clinical outcomes, no precision-at-k, no calibration curve. A
   diligence scientist will ask "how do you know it is right," and today the answer is thin.
3. **No uncertainty.** Every score is a point estimate. A thinly-evidenced target and a richly-
   evidenced one can tie, with nothing to distinguish confidence.

### 3.3 What an AI researcher will attack

1. **Nothing is learned.** It is a static rule with no training signal from real outcomes, so it
   cannot improve with data or be compared to a learned baseline.
2. **No hierarchy and no evidence modeling.** A single scalar hides the structure that makes a
   score trustworthy: per-axis sub-scores, per-fact reliability, and uncertainty.
3. **Momentum and text signals, as proposed for Version 2, are leakage-prone and gameable** [KNOWN:
   temporal ablation 2026]. Building momentum on publications and news risks a model that looks
   skillful in back-test but is reading the future.

### 3.4 What is already right (keep)

The Trust Layer, the pre-registered back-test discipline including keeping a falsified check
visible, the multiplicative desirability instinct, and the explainability-first strategy are all
sound and, in the case of the Trust Layer, ahead of most competitors.

---

## 4. Version 3: a hierarchical scoring architecture

Designed from first principles, for a startup-sized team, to stay explainable, reproducible,
modular, deterministic where it should be, and AI-assisted only where that adds value.

### 4.1 Five design commitments

1. **Score target-disease pairs.** The unit of opportunity is a (target, disease) pair. Target-
   level views are aggregations of pair-level scores.
2. **Separate "should we" from "can we win."** Split into a **Target-Disease Merit** score (the
   science: is this a good, safe, druggable, causal target for this disease) and a **Strategic
   Opportunity** layer (competition, timing, unmet need). Merit is benchmarkable against clinical
   outcomes; Strategic is a business overlay. Never fuse them into one number without also showing
   the two parts.
3. **Every sub-score is a defined quantity with uncertainty**, ideally a calibrated probability,
   carrying a confidence interval, not an arbitrary 0 to 1.
4. **Aggregate with a principled, explainable method**: rank-discounted or noisy-OR evidence
   aggregation within an axis, desirability with uncertainty propagation across axes, plus a Pareto
   view for trade-offs.
5. **Two reconciled engines**: a deterministic, fully explainable desirability score for trust, and
   a calibrated learned ranker trained on historical clinical progression for accuracy. Report both
   and their agreement; disagreement is a feature that flags novelty or error.

### 4.2 The dimensions

Each dimension is a module producing a sub-score in a defined range with an uncertainty estimate,
an explanation, and its own validation. All are target-disease specific unless noted.

**D1. Causal genetic validation.**
- *Rationale:* the best-validated predictor of approval [KNOWN: Minikel 2024].
- *Definition:* a calibrated probability that the target causally influences the disease, from
  L2G-assigned GWAS genes, Mendelian evidence (OMIM, ClinVar), direction of effect, and where
  QTL data exist a Mendelian-randomization plus colocalization estimate [KNOWN: Mountjoy 2021;
  Schmidt 2020].
- *Data:* Open Targets Genetics/Gentropy, GWAS Catalog, OMIM, ClinVar, cis-eQTL and pQTL (GTEx,
  UK Biobank PPP, deCODE).
- *Confidence/uncertainty:* fine-mapping credible-set confidence and MR pleiotropy-robust intervals.
- *Explainability:* the specific variant, gene-assignment features, and MR estimate.
- *Validation:* reproduce the roughly 2.6x relative-success enrichment on held-out approvals.

**D2. Biological and functional validation.**
- *Rationale:* corroborating, non-genetic causal weight.
- *Definition:* aggregate of pathway membership, disease-tissue expression specificity, perturbation
  effect (CRISPR dependency where relevant, DepMap), and model-organism phenotype, combined by
  rank-discounted harmonic sum so strong evidence dominates [KNOWN: Open Targets aggregation].
- *Data:* Reactome, GTEx, Tabula Sapiens, DepMap, IMPC/MGI, Expression Atlas.
- *Uncertainty:* per-source reliability weights in a noisy-OR layer.
- *Validation:* incremental precision over D1 alone in the temporal benchmark.

**D3. Tractability.**
- *Definition:* modality-specific probability that a drug can be made, from Open Targets
  tractability buckets plus structural pocket evidence (PDB, AlphaFold-derived pockets) [KNOWN:
  Open Targets tractability; Jumper 2021].
- *Upgrade over V1:* calibrate the bucket-to-score mapping against the historical rate at which
  each bucket yielded a clinical molecule, replacing our hand-set weights.
- *Uncertainty:* modality coverage and structural confidence (pLDDT).

**D4. Safety and tolerability liability (new, signed negative).**
- *Rationale:* second-largest failure cause; absent in V1.
- *Definition:* genetic constraint (gnomAD LOEUF), essentiality (DepMap), expression breadth and
  tissue specificity, known safety events, cancer-driver and paralog flags [KNOWN: Open Targets
  safety axis].
- *Explainability:* each liability shown separately; this axis is a veto-capable input.

**D5. Clinical and competitive landscape (Strategic layer).**
- *Definition:* absolute crowding from approvals (FDA Purple Book, EMA EPAR, ChEMBL), pipeline
  breadth, and trials, plus **momentum from trial start dates**, deliberately not from literature
  or news to avoid leakage and gaming [KNOWN: leakage warning, temporal ablation 2026].
- *Framing:* reported both as "de-risking" (precedent exists) and "crowding" (room left), because
  the same fact means different things to different strategies.

**D6. Disease burden and unmet need (Strategic layer, optional).**
- *Definition:* prevalence, mortality, and current standard-of-care gap, from public epidemiology.
- *Use:* a business weighting, kept separate from scientific merit.

### 4.3 Aggregation

- **Within an axis:** rank-discounted harmonic sum or noisy-OR, both explainable and robust to
  missing data.
- **Merit score:** desirability aggregation of D1 to D4 with uncertainty propagation, geometric-
  mean form so a fatal weakness (for example zero tractability or a hard safety liability) vetoes
  the target [KNOWN: Segall 2012]. Output is a calibrated success-likelihood with an interval.
- **Learned ranker:** a listwise gradient-boosted model (LambdaMART-style) over the same axis
  features, trained on time-split clinical progression labels, wrapped in **conformal prediction**
  for calibrated confidence sets [KNOWN: Burges 2010; Angelopoulos 2021]. SHAP gives per-target
  attributions.
- **Reconciliation:** show the deterministic desirability score, the learned score, and their
  agreement. Large disagreement is surfaced, not hidden.
- **Strategic overlay:** D5 and D6 shown as a separate opportunity layer and a Pareto view, so a
  target that is high-merit but crowded is visibly a different bet from one that is high-merit and
  open.

### 4.4 Trust, confidence, and reasoning

Keep and extend the Trust Layer: every sub-score carries provenance, data version, and a **per-fact
confidence** that propagates into the axis uncertainty via the noisy-OR reliabilities. Confidence
of the whole score is the conformal prediction interval, calibrated on held-out outcomes and
reported as expected calibration error. LLM reasoning is confined to explanation and hypothesis
generation over already-sourced facts, with retrieval-augmented generation, a verification pass,
and abstention on anything unverifiable [KNOWN: Lewis 2020; Dhuliawala 2024]. No score is ever
produced by a language model.

---

## 5. Benchmark framework

A TargetBench-in-spirit framework, but for opportunity ranking and, crucially, calibration. This is
the artifact that turns "we believe" into "we can show."

1. **Temporal back-test (primary).** Freeze all evidence at year T. Rank target-disease pairs.
   Score which advanced by clinical phase or approval after T. Metrics: precision-at-k and hit-
   rate-at-k (decision-relevant), NDCG with graded relevance (approved > Phase 3 > Phase 2),
   AUPRC against the roughly 5 percent base rate, all with **gene-level bootstrap confidence
   intervals** to correct for one target appearing in many pairs [KNOWN: temporal design and the
   3.25 to 2.79 odds-ratio correction, 2026]. Sanity check: the score must reproduce the known
   genetic-support enrichment.
2. **Ablation studies.** Remove each evidence type and re-run. This is mandatory, because a
   published ablation showed apparent skill collapsing to a single leaky literature channel
   [KNOWN, 2026]. If our momentum or text features carry most of the skill, we have a leakage
   problem, not a model.
3. **Confidence calibration.** Reliability diagrams and expected calibration error on the predicted
   success-likelihood, validated on temporally held-out outcomes [KNOWN: Guo 2017].
4. **Ranking stability.** Jaccard overlap of the top-k across bootstraps, seeds, and small time
   shifts. Brittle rankings signal overfitting.
5. **Inter-source consistency.** Concordance with Open Targets association and prioritisation, and
   with the genetic-support gold set; low concordance must be explainable, not silent.
6. **Expert agreement.** Correlation with a blinded scientist panel's rankings on a sample, with a
   structured look at every disagreement.
7. **Blind and prospective.** Register a ranked list now with a timestamp and a content hash, and
   score it as trials read out over subsequent years. Be honest that clean prospective evidence is
   currently anecdotal across the whole field [KNOWN, handful of examples].
8. **Reproducibility.** Deterministic re-run to an identical content hash, which we already have,
   extended to the full pipeline.

Report every number as a lift over the Wong 13.8 percent and Hay 10.4 percent clinical base rates,
never in isolation [KNOWN: Wong 2019; Hay 2014].

---

## 6. Roadmap: Version 2 to Version 5

Each version lists research, engineering, impact, risk, validation, datasets, models, and rough
complexity. Effort assumes a small team.

**Version 2 (weeks; harden the current product).**
- *Do:* move to target-disease scoring; put human genetics at the core of validation via Open
  Targets Genetics/L2G; add a safety axis; source approvals from FDA and EMA; make saturation
  absolute; replace hand-set tractability weights with historical-rate calibration; take momentum
  only from trial dates; add confidence tiers; ship the temporal back-test v1.
- *Research:* low. *Engineering:* moderate. *Impact:* high, fixes the worst scientific gaps and
  the diligence exposure. *Risk:* low. *Validation:* temporal back-test plus reproduce the genetic-
  support odds ratio. *Datasets:* Open Targets full, FDA Purple Book, EMA EPAR, GWAS Catalog,
  gnomAD, DepMap. *Models:* none new. *Complexity:* low-medium.

**Version 3 (months; the hierarchical engine).**
- *Do:* implement D1 to D6 as modules with uncertainty; desirability aggregation with propagation;
  the learned listwise ranker with conformal prediction; the full benchmark framework with
  calibration and ablations; Pareto and merit-vs-strategic views.
- *Research:* medium (calibration, conformal, MR pipeline). *Engineering:* significant. *Impact:*
  gold-standard-credible; this is the version a diligence scientist respects. *Risk:* medium, in
  data engineering and benchmark rigor. *Validation:* the section 5 framework. *Datasets:* add
  cis-eQTL and pQTL (GTEx, UK Biobank PPP), Reactome, IMPC, structural data. *Models:* gradient-
  boosted ranker plus conformal and ensembles. *Complexity:* high.

**Version 4 (later; graph and causal intelligence).**
- *Do:* a knowledge-graph and graph-neural-network layer for novel target-disease link prediction
  with explainable paths, in the spirit of TxGNN over a PrimeKG-like graph; a causal layer with a
  productionized Mendelian-randomization and colocalization pipeline and invariant prediction
  across cohorts; foundation-model embeddings for evidence [KNOWN: Huang 2024; Schmidt 2020;
  Peters 2016].
- *Research:* high. *Engineering:* large. *Impact:* a genuine discovery and novelty leap, moving
  from scoring known targets to proposing new ones with explanations. *Risk:* high, research
  uncertainty. *Validation:* zero-shot and held-out-disease-area design like TxGNN, plus the
  temporal benchmark. *Datasets:* a curated biomedical KG, perturbation atlases, broad QTL.
  *Models:* heterogeneous GNN, MR pipeline, embeddings. *Complexity:* very high.

**Version 5 (vision; the closed loop with the wet lab).**
- *Do:* connect predictions to experiments, QuRIE-seq and Perturb-seq, feed results back to update
  the models through active learning, and integrate the Virtual Cell so the platform proposes,
  tests, and learns. Active learning is where uncertainty estimates from Version 3 pay off, by
  choosing the most informative experiments [KNOWN: uncertainty-guided active learning, evidential
  and conformal literature].
- *Research:* very high. *Engineering:* very large. *Impact:* the durable moat, proprietary causal
  data no competitor has. *Risk:* highest. *Validation:* prospective, experiment-confirmed
  predictions. *Datasets:* internal multi-omics. *Models:* causal generative plus active learning.
  *Complexity:* highest.

---

## 7. What to adopt, and what to deliberately avoid

**Adopt.** Open Targets rank-discounted evidence aggregation and its genetics anchoring and safety
axis; desirability with uncertainty propagation (Segall) as the explainable aggregator; conformal
prediction and ensembles for calibrated confidence; strict temporal back-testing with ablations;
TxGNN-style explainable knowledge-graph reasoning for the discovery layer; retrieval-augmented,
verified LLM reasoning confined to explanation.

**Avoid.** Opaque metascores with hidden weights, the PandaOmics pattern, because they conflict
with our explainability moat and with pharma diligence; literature and news momentum as a core
predictive signal, because it leaks and is gameable; attention weights presented as explanations,
because they are not faithful; Dempster-Shafer combination under high evidence conflict; and the
temptation to chase a single black-box "target picker," because the moat is data, validation, and
trust, not a magic model.

**Where Version 1 is already correct.** The Trust Layer is a real and rare advantage; keep
extending it. The multiplicative veto instinct is a sound desirability function; formalize it. The
pre-registered, falsifiable back-test discipline is exactly right; scale it into the section 5
framework. Explainability-first is the correct strategic bet, and the literature shows explanations
measurably raise expert trust and accuracy.

---

## 8. Citations

Genetics and clinical success: Nelson et al., Nat Genet 2015 (ng.3314); King, Davis, Degner, PLoS
Genet 2019 (pgen.1008489); Minikel et al., Nature 2024 (s41586-024-07316-0); Ochoa et al., Nat Rev
Drug Discov 2022 (PMID 35804044); temporal-validation preprint arXiv 2026. Attrition: Hay et al.,
Nat Biotechnol 2014 (nbt.2786); Wong, Siah, Lo, Biostatistics 2019 (kxx069); Harrison, Nat Rev Drug
Discov 2016 (nrd.2016.184). Open Targets: Ochoa et al., NAR 2021 (gkaa1027) and 2023 (gkac1046);
Buniello et al., NAR 2025 (gkae1128); Mountjoy et al., Nat Genet 2021 (s41588-021-00945-5); Finan
et al., Sci Transl Med 2017 (aag1166); Platform docs (associations, target-prioritisation,
tractability, L2G). Competitors: Kamya et al., JCIM 2024 (jcim.3c01619); Pun et al., Front Aging
Neurosci 2022; TargetPro/TargetBench preprint bioRxiv 2025 (2025.08.06.668866); Rentosertib, Nat
Biotechnol 2024 and Nat Med 2025; Richardson et al., Lancet 2020; Huang et al. (TxGNN), Nat Med
2024 (s41591-024-03233-x); Himmelstein et al., eLife 2017 (e26726); Liu et al. (PoLo), ESWC 2021;
Kraus et al., CVPR 2024 (arXiv 2309.16064); Jumper et al., Nature 2021 (s41586-021-03819-2);
Abramson et al., Nature 2024 (s41586-024-07487-w); Cheng et al. (AlphaMissense), Science 2023
(adg7492). Methods: Derringer, Suich, J Qual Technol 1980; Segall, Curr Pharm Des 2012 (PMID
22316157); Deb et al. (NSGA-II), IEEE TEC 2002; Burges, MSR-TR-2010-82; Lundberg, Lee (SHAP),
NeurIPS 2017 (arXiv 1705.07874); Ying et al. (GNNExplainer), NeurIPS 2019 (arXiv 1903.03894); Jain,
Wallace, NAACL 2019; Angelopoulos, Bates, arXiv 2107.07511; Bosc et al., J Cheminform 2018
(s13321-018-0325-4); Norinder et al., JCIM 2017 (jcim.7b00159); Lakshminarayanan et al., NeurIPS
2017 (arXiv 1612.01474); Amini et al., NeurIPS 2020 (arXiv 1910.02600); Hirschfeld et al., JCIM
2020 (jcim.0c00502); Guo et al., ICML 2017 (arXiv 1706.04599); Minderer et al., NeurIPS 2021;
Troyanskaya et al., PNAS 2003 (PMC166232); Schmidt et al., Nat Commun 2020 (s41467-020-16969-0);
Gill et al., Wellcome Open Res 2021 (PMC7903200); Peters, Buhlmann, Meinshausen, JRSS-B 2016
(rssb.12167); Huang et al. (TDC), NeurIPS 2021 (arXiv 2102.09548); Lewis et al. (RAG), NeurIPS 2020
(arXiv 2005.11401); Dhuliawala et al. (chain-of-verification), ACL Findings 2024 (arXiv 2309.11495);
Wang et al. (self-consistency), ICLR 2023 (arXiv 2203.11171).

Confidence labels and any unverified figures are noted inline in the source research; treat vendor
press claims and preprints as provisional until peer-reviewed.
