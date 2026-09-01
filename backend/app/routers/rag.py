from fastapi import APIRouter

from app.rag.service import rag_service


router = APIRouter(
    prefix="/api/rag",
    tags=["RAG"]
)


@router.get("/search")
def search_regulations(
    query: str,
    top_k: int = 3
):

    results = rag_service.search(
        query,
        top_k
    )

    return {
        "query": query,
        "results": results
    }