from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
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