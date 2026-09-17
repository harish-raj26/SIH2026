from pathlib import Path


REGULATIONS_PATH = Path("data/regulations")


def load_documents():
    documents = []

    if not REGULATIONS_PATH.exists():
        return documents

    for file_path in REGULATIONS_PATH.glob("*.txt"):
        text = file_path.read_text(
            encoding="utf-8"
        )

        documents.append({
            "source": file_path.name,
            "text": text
        })

    return documents