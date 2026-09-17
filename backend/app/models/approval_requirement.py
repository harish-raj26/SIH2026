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

    # Application workflow status: Not Started, Draft, Submitted, Verified, etc.
    status = Column(
        String,
        nullable=False,
        default="Not Started"
    )

    # Dynamic statutory discovery classification: REQUIRED, CONDITIONAL, NEEDS_VERIFICATION
    approval_status = Column(
        String,
        nullable=False,
        default="REQUIRED"
    )

    jurisdiction = Column(
        String,
        nullable=True,
        default="State"
    )

    stage = Column(
        String,
        nullable=True,
        default="Pre-Operation"
    )

    documents_required = Column(
        Text,
        nullable=True
    )

    fees = Column(
        String,
        nullable=True
    )

    validity = Column(
        String,
        nullable=True
    )

    timeline = Column(
        String,
        nullable=True
    )

    application_url = Column(
        String,
        nullable=True
    )

    source_url = Column(
        String,
        nullable=True
    )

    source_type = Column(
        String,
        nullable=True,
        default="Official Government Source"
    )

    regulatory_evidence = Column(
        Text,
        nullable=True
    )

    dependencies = Column(
        Text,
        nullable=True
    )

    condition_trigger = Column(
        Text,
        nullable=True
    )

    last_verified = Column(
        String,
        nullable=True
    )

    confidence = Column(
        Float,
        nullable=False,
        default=0.0
    )

    @property
    def name(self):
        return self.approval_name

    @name.setter
    def name(self, value):
        self.approval_name = value