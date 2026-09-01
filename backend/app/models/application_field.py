from sqlalchemy import Column, Integer, String, Boolean, ForeignKey

from app.database import Base


class ApplicationField(Base):

    __tablename__ = "application_fields"

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

    field_name = Column(
        String,
        nullable=False
    )

    field_type = Column(
        String,
        default="text",
        nullable=False
    )

    required = Column(
        Boolean,
        default=True,
        nullable=False
    )

    value = Column(
        String,
        nullable=True
    )

    ai_suggestion = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        default="Pending",
        nullable=False
    )