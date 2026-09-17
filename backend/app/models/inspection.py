from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from app.database import Base

class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    scheduled_at = Column(DateTime, nullable=True)
    inspector = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Scheduled")
    notes = Column(Text, nullable=True)
