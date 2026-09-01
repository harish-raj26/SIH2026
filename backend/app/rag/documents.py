from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]

REGULATIONS_PATH = BASE_DIR / "data" / "regulations"


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