from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from app.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    industry = Column(String, nullable=False)  # Sector
    sub_sector = Column(String, nullable=True)
    location = Column(String, nullable=False)
    state = Column(String, nullable=True, default="Tamil Nadu")
    district = Column(String, nullable=True)

    business_type = Column(String, nullable=False)  # Legal form
    business_activity = Column(String, nullable=True)
    products = Column(Text, nullable=True)  # JSON text or comma-separated

    investment = Column(Float, nullable=False)
    employees = Column(Integer, nullable=False)

    factory = Column(Boolean, nullable=True, default=False)
    production_capacity = Column(String, nullable=True)
    land_type = Column(String, nullable=True)
    land_area = Column(Float, nullable=True)
    building_area = Column(Float, nullable=True)

    pollution_category = Column(String, nullable=True)  # White, Green, Orange, Red, Exempt
    hazardous_materials = Column(Boolean, nullable=True, default=False)
    hazardous_details = Column(String, nullable=True)

    water_usage = Column(String, nullable=True)
    water_requirement = Column(Float, nullable=True)

    waste_generation = Column(String, nullable=True)

    power_requirement = Column(String, nullable=True)
    electricity_requirement = Column(Float, nullable=True)

    import_export = Column(Boolean, nullable=True, default=False)
    boiler = Column(Boolean, nullable=True, default=False)
    boiler_details = Column(String, nullable=True)

    production_type = Column(String, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))