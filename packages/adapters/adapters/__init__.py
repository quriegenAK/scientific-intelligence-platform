"""
Source adapter interface (shared package) — the swappable data boundary.

The pipeline calls Source.fetch() and gets normalized records + a DataProvenance. Today an
adapter wraps a pinned snapshot; tomorrow the same interface wraps a live API or an MCP
connector — one line changes, the pipeline does not. Shared as a *contract* from day one
(ADR-0002 §3); concrete TIOP adapters live in apps/tiop until a second consumer justifies
promoting them here.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from provenance import DataProvenance


@dataclass
class SourceResult:
    records: Any
    provenance: DataProvenance


class Source(ABC):
    """One adapter per source. fetch() is the only thing the pipeline sees."""
    key: str

    @abstractmethod
    def fetch(self, target_ref: dict) -> SourceResult:
        """target_ref carries the identifiers a source needs (ensembl / uniprot / gene)."""
        ...
