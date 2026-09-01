from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text

from app.database import Base


class ApprovalRequirement(Base):
    __tablename__ = "approval_requirements"

    id = Column(Integer, primary_key=True, index=True)

    business_id = Column(
        Integer,
        ForeignKey("businesses.id"),
        nullable=False
    )

    approval_name = Column(
        String,
        nullable=False
    )

    authority = Column(
        String,
        nullable=False
    )

    category = Column(
        String,
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    reason = Column(
        Text,
        nullable=True
    )

    priority = Column(
        String,
        nullable=False,
        default="Medium"
    )

    status = Column(
        String,
        nullable=False,
        default="Not Started"
    )

    confidence = Column(
        Float,
        nullable=False,
        default=0.0
    )

    application_url = Column(
        String,
        nullable=True
    )