import os
from pathlib import Path

from sentence_transformers import SentenceTransformer

# Persistent, project-local cache dir (survives restarts/redeploys, unlike a
# container's default ~/.cache/huggingface which may not be preserved).
_CACHE_DIR = Path(__file__).resolve().parents[2] / ".model_cache"
_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _is_model_cached(model_name: str, cache_dir: Path) -> bool:
    """True if a snapshot for this model already exists in cache_dir, so we
    can skip the hub's "check for updates" HTTP round trips on startup."""
    model_dir = cache_dir / f"models--{model_name.replace('/', '--')}"
    snapshots = model_dir / "snapshots"
    return snapshots.is_dir() and any(snapshots.iterdir())


class EmbeddingService:
    """
    Generates semantic embeddings using BAAI/bge-small-en-v1.5.

    The model is loaded once when this service is created. Weights are
    cached under app/.model_cache so subsequent restarts load from disk
    instead of re-downloading or re-checking the Hugging Face Hub.
    """

    def __init__(
        self,
        model_name: str = "BAAI/bge-small-en-v1.5",
    ):
        self.model_name = model_name

        # Once the model is on disk, skip all hub network calls entirely.
        # (Only set this process-wide flag if we're not about to need the
        # network for a first-time download.)
        if _is_model_cached(model_name, _CACHE_DIR):
            os.environ.setdefault("HF_HUB_OFFLINE", "1")
            os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

        self.model = SentenceTransformer(
            model_name,
            cache_folder=str(_CACHE_DIR),
        )

    def embed(self, text: str) -> list[float]:
        """
        Generate a normalized embedding for a single query.
        """

        if not text or not text.strip():
            raise ValueError("Text cannot be empty.")

        embedding = self.model.encode(
            text.strip(),
            normalize_embeddings=True,
            convert_to_numpy=True,
        )

        return embedding.tolist()

    def embed_batch(
        self,
        texts: list[str],
    ) -> list[list[float]]:
        """
        Generate normalized embeddings for multiple texts.
        """

        if not texts:
            return []

        cleaned_texts = [
            text.strip()
            for text in texts
            if text and text.strip()
        ]

        if not cleaned_texts:
            return []

        embeddings = self.model.encode(
            cleaned_texts,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )

        return embeddings.tolist()