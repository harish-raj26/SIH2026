from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    location = Column(String, nullable=False)

    business_type = Column(String, nullable=False)

    investment = Column(Float, nullable=False)
    employees = Column(Integer, nullable=False)

    land_area = Column(Float, nullable=True)
    building_area = Column(Float, nullable=True)

    pollution_category = Column(String, nullable=True)

    production_type = Column(String, nullable=True)

    water_requirement = Column(Float, nullable=True)
    electricity_requirement = Column(Float, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )