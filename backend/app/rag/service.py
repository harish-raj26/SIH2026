from app.rag.documents import load_documents
from app.rag.chunker import chunk_text
from app.rag.retriever import RegulatoryRetriever


class RAGService:

    def __init__(self):
        self.retriever = RegulatoryRetriever()
        self._build_index()

    def _build_index(self):

        documents = load_documents()

        chunks = []

        for document in documents:

            document_chunks = chunk_text(
                document["text"]
            )

            for chunk in document_chunks:

                chunks.append({
                    "source": document["source"],
                    "text": chunk
                })

        self.retriever.build_index(chunks)

    def search(
        self,
        query: str,
        top_k: int = 10,
        source_filter=None,
        min_score: float = 0.05
    ):

        return self.retriever.search(
            query=query,
            top_k=top_k,
            source_filter=source_filter,
            min_score=min_score
        )


rag_service = RAGService()