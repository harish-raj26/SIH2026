from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class RegulatoryRetriever:

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words="english"
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
            return

        self.vectors = self.vectorizer.fit_transform(
            texts
        )

    def search(
        self,
        query: str,
        top_k: int = 3
    ):

        if self.vectors is None:
            return []

        query_vector = (
            self.vectorizer.transform([query])
        )

        similarities = cosine_similarity(
            query_vector,
            self.vectors
        )[0]

        ranked_indexes = similarities.argsort()[
            ::-1
        ]

        results = []

        for index in ranked_indexes[:top_k]:

            results.append({
                "source": self.documents[index]["source"],
                "text": self.documents[index]["text"],
                "score": float(similarities[index])
            })

        return results