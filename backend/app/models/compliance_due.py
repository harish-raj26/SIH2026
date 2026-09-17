from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from app.database import Base

class ComplianceDue(Base):
    __tablename__ = "compliance_dues"
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    approval_id = Column(Integer, ForeignKey("approval_requirements.id"), nullable=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="Pending")
    paid_at = Column(DateTime, nullable=True)
