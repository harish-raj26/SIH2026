from sqlalchemy import Column, Integer, String, Boolean, ForeignKey

from app.database import Base


class ApplicationDocument(Base):

    __tablename__ = "application_documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    application_id = Column(
        Integer,
        ForeignKey("applications.id"),
        nullable=False
    )

    document_name = Column(
        String,
        nullable=False
    )

    document_type = Column(
        String,
        nullable=False
    )

    required = Column(
        Boolean,
        default=True,
        nullable=False
    )

    file_path = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        default="Missing",
        nullable=False
    )

    verification_notes = Column(
        String,
        nullable=True
    )
    requirement_type = Column(
        String,
        default="document",
        nullable=False
)