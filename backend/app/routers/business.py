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
    db: Session = Depends(get_db)
):
    business = Business(
        name=name,
        industry=industry,
        location=location,
        business_type=business_type,
        investment=investment,
        employees=employees
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