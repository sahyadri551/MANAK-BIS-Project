from pathlib import Path
import pickle

import faiss
import numpy as np
import pandas as pd


class RetrievalService:
    """Retrieve semantically similar BIS standards from a FAISS index."""

    def __init__(
        self,
        index_path: str | Path,
        metadata_path: str | Path,
    ):
        self.index_path = Path(index_path)
        self.metadata_path = Path(metadata_path)

        if not self.index_path.exists():
            raise FileNotFoundError(f"FAISS index not found: {self.index_path}")
        if not self.metadata_path.exists():
            raise FileNotFoundError(f"Metadata file not found: {self.metadata_path}")

        self.index = faiss.read_index(str(self.index_path))

        with open(self.metadata_path, "rb") as file:
            metadata = pickle.load(file)

        if isinstance(metadata, pd.DataFrame):
            self.metadata = metadata.to_dict(orient="records")
        elif isinstance(metadata, list):
            self.metadata = metadata
        else:
            raise TypeError(
                f"Unsupported metadata format: {type(metadata)}. "
                "Expected pandas.DataFrame or list."
            )

        if len(self.metadata) != self.index.ntotal:
            raise ValueError(
                "Mismatch between FAISS index and metadata records: "
                f"{self.index.ntotal} vectors vs {len(self.metadata)} metadata records."
            )

    def retrieve(
        self,
        query_embedding: list[float],
        top_k: int = 20,
    ) -> list[dict]:
        """Retrieve the top-k semantically similar BIS standards."""
        if not query_embedding:
            raise ValueError("Query embedding cannot be empty.")
        if top_k <= 0:
            raise ValueError("top_k must be greater than zero.")

        query_vector = np.asarray([query_embedding], dtype="float32")
        if query_vector.shape[1] != self.index.d:
            raise ValueError(
                "Embedding dimension mismatch: "
                f"query has {query_vector.shape[1]} dimensions, "
                f"but FAISS index expects {self.index.d}."
            )

        scores, indices = self.index.search(query_vector, top_k)
        results = []

        for score, index_position in zip(scores[0], indices[0]):
            if index_position < 0:
                continue

            index_position = int(index_position)
            record = dict(self.metadata[index_position])
            record["similarity_score"] = float(score)
            record["_index_position"] = index_position
            results.append(record)

        return results
