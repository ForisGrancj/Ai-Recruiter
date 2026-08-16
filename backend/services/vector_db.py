import uuid
import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from backend.services.ai_service import get_text_embedding

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
qdrant = QdrantClient(url=QDRANT_URL)
COLLECTION_NAME = "cv_chunks"


def ensure_collection_exists():
    """Creates the collection on Qdrant if it does not exist."""
    collections = [c.name for c in qdrant.get_collections().collections]
    if COLLECTION_NAME not in collections:
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE)
        )


def insert_cv_chunk(candidate_id: int, chunk_text: str):
    """Generates an embedding for a CV chunk and inserts it into Qdrant with candidate ID."""
    ensure_collection_exists()
    vector = get_text_embedding(chunk_text)

    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={"candidate_id": candidate_id, "text": chunk_text}
            )
        ]
    )


def search_cv_context(candidate_id: int, query_text: str, top_k: int = 2) -> str:
    """Performs semantic search (RAG) exclusively within candidate's own CV chunks."""
    ensure_collection_exists()

    try:
        query_vector = get_text_embedding(query_text)
        candidate_filter = Filter(
            must=[FieldCondition(key="candidate_id", match=MatchValue(value=candidate_id))]
        )

        results = qdrant.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            query_filter=candidate_filter,
            limit=top_k
        ).points

        if not results:
            return ""

        return "\n---\n".join([hit.payload["text"] for hit in results if hit.payload and "text" in hit.payload])

    except Exception as e:
        print(f">>> WARNING: Error during Qdrant search or collection is empty: {e}")
        return ""