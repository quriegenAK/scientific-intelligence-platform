"""The proteome -> druggable genome -> approved-target funnel.

These are literature-anchored constants, not API pulls, so each carries a
citation-grade Provenance (paper + DOI + year). Reconciled across sources;
every number is stamped, never guessed.
"""
from __future__ import annotations
from .trust import Provenance, Fact


def _lit(source, version, url, query):
    return Provenance(source=source, endpoint=url, data_version=version,
                      access_utc="2026-07-23T00:00:00Z", query=query, record_url=url)


def build_funnel() -> list[Fact]:
    return [
        Fact(
            field="human_proteome",
            value=20000,
            provenance=_lit("UniProt / Ensembl (human protein-coding genes)", "2026_03",
                            "https://www.uniprot.org/proteomes/UP000005640",
                            "human reference proteome UP000005640 (reviewed ~20,420)"),
            confidence="HIGH",
            notes="~20,000 protein-coding genes; UniProt reviewed human entries ~20,420.",
        ),
        Fact(
            field="druggable_genome",
            value=4479,
            provenance=_lit("Finan et al. 2017, Sci Transl Med", "2017",
                            "https://doi.org/10.1126/scitranslmed.aag1166",
                            "The druggable genome and support for target identification"),
            confidence="HIGH",
            notes="4,479 genes in the druggable genome (Tier 1-3).",
        ),
        Fact(
            field="approved_drug_targets",
            value=667,
            provenance=_lit("Santos et al. 2017, Nat Rev Drug Discov", "2017",
                            "https://doi.org/10.1038/nrd.2016.230",
                            "A comprehensive map of molecular drug targets"),
            confidence="HIGH",
            notes="667 human protein targets of approved drugs (~700, incl. Pharos Tclin).",
        ),
    ]


def funnel_headline(funnel: list[Fact]) -> str:
    d = {f.field: f.value for f in funnel}
    pct = 100.0 * d["approved_drug_targets"] / d["human_proteome"]
    return (f"Of ~{d['human_proteome']:,} human proteins, ~{d['druggable_genome']:,} are "
            f"druggable and only ~{d['approved_drug_targets']} (~{pct:.1f}%) have yielded an "
            f"approved drug -- the untapped-opportunity headline.")
