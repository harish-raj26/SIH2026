import re


def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 100
):

    if not text:
        return []

    if overlap >= chunk_size:
        raise ValueError(
            "overlap must be smaller than chunk_size"
        )

    paragraphs = re.split(
        r"\n\s*\n",
        text.strip()
    )

    chunks = []

    current_chunk = ""

    for paragraph in paragraphs:

        paragraph = paragraph.strip()

        if not paragraph:
            continue

        sentences = re.split(
            r"(?<=[.!?])\s+",
            paragraph
        )

        for sentence in sentences:

            sentence = sentence.strip()

            if not sentence:
                continue

            if len(current_chunk) + len(sentence) + 1 <= chunk_size:

                if current_chunk:
                    current_chunk += " "

                current_chunk += sentence

            else:

                if current_chunk:
                    chunks.append(
                        current_chunk.strip()
                    )

                if len(sentence) <= chunk_size:

                    current_chunk = sentence

                else:

                    words = sentence.split()

                    current_chunk = ""

                    for word in words:

                        if (
                            len(current_chunk)
                            + len(word)
                            + 1
                            <= chunk_size
                        ):

                            if current_chunk:
                                current_chunk += " "

                            current_chunk += word

                        else:

                            if current_chunk:
                                chunks.append(
                                    current_chunk.strip()
                                )

                            current_chunk = word

    if current_chunk:
        chunks.append(
            current_chunk.strip()
        )

    if overlap <= 0:
        return chunks

    overlapped_chunks = []

    for index, chunk in enumerate(chunks):

        if index == 0:
            overlapped_chunks.append(chunk)
            continue

        previous = chunks[index - 1]

        overlap_words = previous.split()

        current_words = chunk.split()

        overlap_text = ""

        for word in reversed(overlap_words):

            candidate = (
                word
                + " "
                + overlap_text
            ).strip()

            if len(candidate) > overlap:
                break

            overlap_text = candidate

        if overlap_text:

            combined = (
                overlap_text
                + " "
                + " ".join(current_words)
            ).strip()

            overlapped_chunks.append(
                combined
            )

        else:

            overlapped_chunks.append(
                chunk
            )

    return overlapped_chunks