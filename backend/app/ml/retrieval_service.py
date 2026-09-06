from pathlib import Path
import pickle

import faiss
import numpy as np
import pandas as pd


class RetrievalService:
    """
    Retrieves semantically similar BIS standards from FAISS.

    The FAISS index and metadata must have the same record order.

    Supported metadata formats:
        - pandas.DataFrame
        - list[dict]
    """

    def __init__(
        self,
        index_path: str | Path,
        metadata_path: str | Path,
    ):
        self.index_path = Path(index_path)
        self.metadata_path = Path(metadata_path)

        # --------------------------------------------------
        # Validate files
        # --------------------------------------------------

        if not self.index_path.exists():
            raise FileNotFoundError(
                f"FAISS index not found: {self.index_path}"
            )

        if not self.metadata_path.exists():
            raise FileNotFoundError(
                f"Metadata file not found: {self.metadata_path}"
            )

        # --------------------------------------------------
        # Load FAISS index
        # --------------------------------------------------

        print(
            f"Loading FAISS index: {self.index_path}"
        )

        self.index = faiss.read_index(
            str(self.index_path)
        )

        print(
            f"FAISS index loaded: "
            f"{self.index.ntotal} vectors"
        )

        # --------------------------------------------------
        # Load metadata
        # --------------------------------------------------

        print(
            f"Loading BIS metadata: "
            f"{self.metadata_path}"
        )

        with open(
            self.metadata_path,
            "rb",
        ) as file:
            metadata = pickle.load(file)

        # --------------------------------------------------
        # Normalize metadata format
        # --------------------------------------------------

        if isinstance(metadata, pd.DataFrame):

            print(
                "Metadata format: pandas DataFrame"
            )

            # IMPORTANT:
            #
            # FAISS returns an integer POSITION.
            #
            # DataFrame[position] means COLUMN access,
            # which caused your KeyError.
            #
            # Converting to records makes positional
            # access explicit and safe.

            self.metadata = metadata.to_dict(
                orient="records"
            )

        elif isinstance(metadata, list):

            print(
                "Metadata format: list"
            )

            self.metadata = metadata

        else:

            raise TypeError(
                "Unsupported metadata format: "
                f"{type(metadata)}. "
                "Expected pandas.DataFrame or list."
            )

        # --------------------------------------------------
        # Validate index/metadata alignment
        # --------------------------------------------------

        if len(self.metadata) != self.index.ntotal:

            raise ValueError(
                "Mismatch between FAISS index "
                "and metadata records: "
                f"{self.index.ntotal} vectors vs "
                f"{len(self.metadata)} metadata records."
            )

        print(
            f"BIS metadata loaded: "
            f"{len(self.metadata)} records"
        )

        print(
            "FAISS index and metadata are aligned."
        )

    # ======================================================
    # RETRIEVE
    # ======================================================

    def retrieve(
        self,
        query_embedding: list[float],
        top_k: int = 20,
    ) -> list[dict]:
        """
        Retrieve the top-k semantically similar BIS standards.
        """

        if not query_embedding:
            raise ValueError(
                "Query embedding cannot be empty."
            )

        if top_k <= 0:
            raise ValueError(
                "top_k must be greater than zero."
            )

        # --------------------------------------------------
        # Convert query embedding to float32
        # --------------------------------------------------

        query_vector = np.asarray(
            [query_embedding],
            dtype="float32",
        )

        # --------------------------------------------------
        # Validate embedding dimension
        # --------------------------------------------------

        if query_vector.shape[1] != self.index.d:

            raise ValueError(
                "Embedding dimension mismatch: "
                f"query has {query_vector.shape[1]} dimensions, "
                f"but FAISS index expects {self.index.d}."
            )

        # --------------------------------------------------
        # FAISS search
        # --------------------------------------------------

        scores, indices = self.index.search(
            query_vector,
            top_k,
        )

        results = []

        # --------------------------------------------------
        # Convert FAISS results to records
        # --------------------------------------------------

        for score, index_position in zip(
            scores[0],
            indices[0],
        ):

            # FAISS uses -1 when no result exists.
            if index_position < 0:
                continue

            index_position = int(
                index_position
            )

            # ------------------------------------------------
            # IMPORTANT:
            #
            # This is positional access into the metadata
            # list.
            # ------------------------------------------------

            record = dict(
                self.metadata[index_position]
            )

            # ------------------------------------------------
            # Similarity score
            # ------------------------------------------------

            record["similarity_score"] = float(
                score
            )

            # ------------------------------------------------
            # Keep FAISS position for debugging
            # ------------------------------------------------

            record["_index_position"] = (
                index_position
            )

            results.append(record)

        return results