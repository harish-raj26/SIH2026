from sqlalchemy import Boolean, Column, Integer, String, Text
from app.database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    approval_name = Column(String, nullable=True, index=True)
    description = Column(Text, nullable=True)
    authority = Column(String, nullable=False)
    jurisdiction = Column(String, nullable=False, default="State")  # State, Central, Local
    state = Column(String, nullable=True, default="Tamil Nadu")
    district = Column(String, nullable=True, default="All")
    sector = Column(String, nullable=True, default="All")
    sub_sector = Column(String, nullable=True, default="All")
    category = Column(String, nullable=False)  # Factory & Labour, Environment, etc.
    level = Column(String, nullable=True, default="State")  # Central, State, Local
    stage = Column(String, nullable=False, default="Pre-Operation")  # Pre-Establishment, Land & Construction, Pre-Operation, Operation, Ongoing Compliance / Renewal
    mandatory = Column(Boolean, nullable=False, default=True)

    # Machine-readable JSON predicates evaluated by the Rule Engine
    conditions = Column(Text, nullable=True)  # JSON serialized condition predicates

    documents_required = Column(Text, nullable=True)  # JSON serialized list of strings
    fees = Column(String, nullable=True)
    validity = Column(String, nullable=True)
    timeline = Column(String, nullable=True)
    application_url = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    source_type = Column(String, nullable=False, default="Official Government Source")  # NSWS, TN Single Window, TNPCB, DISH, etc.
    dependencies = Column(Text, nullable=True)  # JSON serialized list of prerequisite approval names

    # Backwards compatibility legacy fields
    reason = Column(Text, nullable=True)
    priority = Column(String, nullable=False, default="Medium")
    status = Column(String, nullable=False, default="Required")

    last_verified = Column(String, nullable=True)
    active = Column(Boolean, nullable=False, default=True)