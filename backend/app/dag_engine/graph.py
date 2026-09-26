from collections import defaultdict
from typing import Dict, List, Set, Tuple

class AdjacencyGraph:
    """
    In-memory DAG adjacency list representation.
    - dependents_of: precursor_id -> list of dependent_ids (outgoing edges)
    - precursors_of: dependent_id -> list of precursor_ids (incoming edges)
    """

    def __init__(self, task_ids: Set[int], edges: List[Tuple[int, int]]):
        self.nodes: Set[int] = set(task_ids)
        self.dependents_of: Dict[int, List[int]] = defaultdict(list)
        self.precursors_of: Dict[int, List[int]] = defaultdict(list)

        for u, v in edges:
            if u in self.nodes and v in self.nodes:
                self.dependents_of[u].append(v)
                self.precursors_of[v].append(u)

    def add_edge(self, u: int, v: int):
        self.dependents_of[u].append(v)
        self.precursors_of[v].append(u)

    def remove_edge(self, u: int, v: int):
        if v in self.dependents_of[u]:
            self.dependents_of[u].remove(v)
        if u in self.precursors_of[v]:
            self.precursors_of[v].remove(u)
