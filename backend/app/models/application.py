from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.database import Base


class Application(Base):

    __tablename__ = "applications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    business_id = Column(
        Integer,
        ForeignKey("businesses.id"),
        nullable=False
    )

    approval_id = Column(
        Integer,
        ForeignKey("approval_requirements.id"),
        nullable=False
    )

    status = Column(
        String,
        default="Draft",
        nullable=False
    )

    # Real government integration attributes
    government_service_code = Column(
        String,
        nullable=True,
        index=True
    )

    government_app_id = Column(
        String,
        nullable=True,
        index=True
    )

    government_reference_no = Column(
        String,
        nullable=True,
        index=True
    )

    submission_mode = Column(
        String,
        nullable=True,
        default="PORTAL_ASSISTED"
    )

    normalized_status = Column(
        String,
        nullable=True,
        default="DRAFT"
    )

    government_status = Column(
        String,
        nullable=True
    )

    submission_response_raw = Column(
        Text,
        nullable=True
    )

    portal_submission_url = Column(
        String,
        nullable=True
    )

    last_synced_at = Column(
        DateTime,
        nullable=True
    )

    application_url = Column(
        String,
        nullable=True
    )

    submitted_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )