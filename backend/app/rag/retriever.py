"""Placeholder RAG retriever over document chunks."""


class Retriever:
    def get_relevant_chunks(self, query: str, top_k: int = 5):
        raise NotImplementedError("RAG retrieval arrives with the ML phase.")
