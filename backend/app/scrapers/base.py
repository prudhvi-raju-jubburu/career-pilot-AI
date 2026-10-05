from abc import ABC, abstractmethod
from typing import List, Dict, Any

class OpportunitySource(ABC):
    """
    Abstract Base Class for opportunity source adapters.
    Each source is responsible for:
      1. Fetching raw source data safely without violating ToS or rate limits.
      2. Normalizing raw item fields into the canonical opportunity schema format.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique identifier name for this source adapter."""
        raise NotImplementedError

    @abstractmethod
    def fetch(self) -> List[Dict[str, Any]]:
        """
        Retrieves raw opportunity records from the provider.
        Must handle its own networking errors gracefully.
        """
        raise NotImplementedError

    @abstractmethod
    def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms provider-specific item structure into canonical opportunity format.
        """
        raise NotImplementedError
