from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class RegulatoryRetriever:

    def __init__(self):

        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2)
        )

        self.documents = []

        self.vectors = None

    def build_index(self, chunks):

        self.documents = chunks

        texts = [
            chunk["text"]
            for chunk in chunks
        ]

        if not texts:

            self.vectors = None

            return

        self.vectors = (
            self.vectorizer
            .fit_transform(texts)
        )

    def search(
        self,
        query: str,
        top_k: int = 10,
        source_filter=None,
        min_score: float = 0.0
    ):

        if self.vectors is None:

            return []

        if not query or not query.strip():

            return []

        query_vector = (
            self.vectorizer
            .transform([query])
        )

        similarities = (
            cosine_similarity(
                query_vector,
                self.vectors
            )[0]
        )

        ranked_indexes = (
            similarities.argsort()[::-1]
        )

        results = []

        for index in ranked_indexes:

            document = (
                self.documents[index]
            )

            if (
                source_filter
                and document["source"]
                not in source_filter
            ):
                continue

            score = float(
                similarities[index]
            )

            if score < min_score:

                continue

            results.append({

                "source": document[
                    "source"
                ],

                "text": document[
                    "text"
                ],

                "score": round(
                    score,
                    4
                )
            })

            if len(results) >= top_k:

                break

        return results