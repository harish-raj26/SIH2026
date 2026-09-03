from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Business


router = APIRouter(
    prefix="/api/businesses",
    tags=["Businesses"]
)


@router.post("/")
def create_business(
    name: str,
    industry: str,
    location: str,
    business_type: str,
    investment: float,
    employees: int,
    pollution_category: Optional[str] = None,
    land_area: Optional[float] = None,
    building_area: Optional[float] = None,
    production_type: Optional[str] = None,
    water_requirement: Optional[float] = None,
    electricity_requirement: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if not pollution_category:
        ind_lower = industry.lower()
        if any(w in ind_lower for w in ["chemical", "petrochemical", "refinery", "heavy"]):
            pollution_category = "Red"
        elif any(w in ind_lower for w in ["manufacturing", "automotive", "textile", "pharma"]):
            pollution_category = "Orange"
        elif any(w in ind_lower for w in ["food", "renewable", "solar"]):
            pollution_category = "Green"
        else:
            pollution_category = "White"

    business = Business(
        name=name,
        industry=industry,
        location=location,
        business_type=business_type,
        investment=investment,
        employees=employees,
        pollution_category=pollution_category,
        land_area=land_area or 2500.0,
        building_area=building_area or 1200.0,
        production_type=production_type,
        water_requirement=water_requirement,
        electricity_requirement=electricity_requirement
    )

    db.add(business)
    db.commit()
    db.refresh(business)

    return {
        "message": "Business created successfully",
        "business_id": business.id
    }


@router.get("/")
def get_businesses(
    db: Session = Depends(get_db)
):
    businesses = db.query(Business).all()
    return businesses