import json
from typing import Any, List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    Business,
    ApprovalRequirement,
    Application,
    ApplicationField,
    ApplicationDocument,
    ApplicationStatusHistory,
    Notification,
    Inspection,
    ComplianceDue,
)
from app.services.approval_discovery import approval_discovery_service
from app.services.regulatory_catalog import seed_regulatory_catalog

router = APIRouter(prefix="/api/businesses", tags=["Businesses"])



class BusinessCreate(BaseModel):
    name: str = Field(min_length=2)
    industry: str = Field(min_length=2)
    location: str = Field(min_length=2)
    business_type: str = Field(min_length=2)
    investment: float = Field(ge=0)
    employees: int = Field(ge=0)

    sub_sector: Optional[str] = None
    state: Optional[str] = "Tamil Nadu"
    district: Optional[str] = None
    business_activity: Optional[str] = "Manufacturing"
    products: Optional[Union[List[str], str]] = None

    factory: Optional[bool] = False
    production_capacity: Optional[str] = None
    land_type: Optional[str] = "Industrial"
    land_area: Optional[float] = Field(default=None, ge=0)
    building_area: Optional[float] = Field(default=None, ge=0)

    pollution_category: Optional[str] = None
    hazardous_materials: Optional[bool] = False
    hazardous_details: Optional[str] = None

    water_usage: Optional[str] = None
    water_requirement: Optional[float] = Field(default=None, ge=0)

    waste_generation: Optional[str] = None

    power_requirement: Optional[str] = None
    electricity_requirement: Optional[float] = Field(default=None, ge=0)

    import_export: Optional[bool] = False
    boiler: Optional[bool] = False
    boiler_details: Optional[str] = None

    production_type: Optional[str] = None


def serialize(b: Business) -> dict:
    data = {c.name: getattr(b, c.name) for c in Business.__table__.columns}
    # Parse products if stored as JSON
    if data.get("products") and isinstance(data["products"], str) and data["products"].startswith("["):
        try:
            data["products"] = json.loads(data["products"])
        except Exception:
            pass
    return data


@router.post("/")
def create_business(data: BusinessCreate, db: Session = Depends(get_db)):
    # Ensure master regulatory catalog is seeded
    seed_regulatory_catalog(db)

    # Infer pollution category if missing
    if not data.pollution_category:
        text = f"{data.industry} {data.sub_sector or ''} {data.production_type or ''}".lower()
        if any(w in text for w in ["chemical", "petrochemical", "refinery", "heavy", "tannery", "dyeing"]):
            category = "Red"
        elif any(w in text for w in ["manufacturing", "automotive", "textile", "pharma", "engineering"]):
            category = "Orange"
        elif any(w in text for w in ["food", "renewable", "solar", "assembly", "packaging"]):
            category = "Green"
        elif any(w in text for w in ["software", "it", "data", "electronics assembly"]):
            category = "White"
        else:
            category = "Orange"
    else:
        category = data.pollution_category

    # Process products if list
    products_val = data.products
    if isinstance(products_val, list):
        products_val = json.dumps(products_val)

    # Convert model data
    model_data = data.model_dump(exclude={"pollution_category", "products"})
    business = Business(
        **model_data,
        pollution_category=category,
        products=products_val
    )
    db.add(business)
    db.commit()
    db.refresh(business)

    # Dynamically discover and persist initial statutory approval requirements for this enterprise
    biz_context = serialize(business)
    discovery_res = approval_discovery_service.discover_approvals(biz_context, db_session=db)

    for app in discovery_res.get("approvals", []):
        docs_str = json.dumps(app.get("documents_required", []))
        deps_str = json.dumps(app.get("dependencies", []))
        ev_str = json.dumps(app.get("regulatory_evidence", []))

        req = ApprovalRequirement(
            business_id=business.id,
            approval_name=app["approval_name"],
            authority=app["authority"],
            category=app.get("category", "Other Regulatory Approvals"),
            description=app.get("description"),
            reason=app.get("reason"),
            priority=app.get("priority", "Medium"),
            status="Not Started",
            approval_status=app.get("approval_status", "REQUIRED"),
            jurisdiction=app.get("jurisdiction", "State"),
            stage=app.get("stage", "Pre-Operation"),
            documents_required=docs_str,
            fees=app.get("fees"),
            validity=app.get("validity"),
            timeline=app.get("timeline"),
            application_url=app.get("application_url"),
            source_url=app.get("source_url"),
            source_type=app.get("source_type", "Official Government Source"),
            regulatory_evidence=ev_str,
            dependencies=deps_str,
            condition_trigger=app.get("condition_trigger"),
            last_verified=app.get("last_verified", "2026-03-01"),
            confidence=app.get("confidence", 0.95)
        )
        db.add(req)

    db.commit()

    return {
        "message": "Enterprise registered successfully with dynamic statutory approval discovery",
        "business": serialize(business),
        "business_id": business.id,
        "discovery": {
            "total_identified": discovery_res.get("total_identified", 0),
            "required_count": discovery_res.get("required_count", 0),
            "conditional_count": discovery_res.get("conditional_count", 0),
            "verification_count": discovery_res.get("verification_count", 0)
        }
    }


@router.get("/")
def get_businesses(db: Session = Depends(get_db)):
    rows = db.query(Business).order_by(Business.created_at.desc()).all()
    return {"businesses": [serialize(b) for b in rows], "count": len(rows)}


@router.get("/{business_id}")
def get_business(business_id: int, db: Session = Depends(get_db)):
    b = db.query(Business).filter(Business.id == business_id).first()
    if not b:
        raise HTTPException(404, "Business not found")
    return serialize(b)


@router.put("/{business_id}")
def update_business(business_id: int, data: BusinessCreate, db: Session = Depends(get_db)):
    b = db.query(Business).filter(Business.id == business_id).first()
    if not b:
        raise HTTPException(404, "Business not found")

    products_val = data.products
    if isinstance(products_val, list):
        products_val = json.dumps(products_val)

    update_dict = data.model_dump(exclude={"products"})
    for k, v in update_dict.items():
        if hasattr(b, k) and v is not None:
            setattr(b, k, v)
    if products_val is not None:
        b.products = products_val

    db.commit()
    db.refresh(b)
    return {"message": "Business parameters updated successfully", "business": serialize(b)}


@router.delete("/")
@router.delete("/clear-all")
def clear_all_businesses(db: Session = Depends(get_db)):
    """
    Permanently delete all business entities and cascade delete all applications,
    fields, documents, status history, approval requirements, and notifications.
    """
    db.query(ApplicationStatusHistory).delete()
    db.query(ApplicationDocument).delete()
    db.query(ApplicationField).delete()
    db.query(Application).delete()
    db.query(ApprovalRequirement).delete()
    db.query(Notification).delete()
    try:
        db.query(Inspection).delete()
    except Exception:
        pass
    try:
        db.query(ComplianceDue).delete()
    except Exception:
        pass
    deleted_count = db.query(Business).delete()
    db.commit()

    return {
        "message": f"All {deleted_count} business entities and related records cleared successfully.",
        "cleared_count": deleted_count,
    }


@router.delete("/{business_id}")
def delete_business(business_id: int, db: Session = Depends(get_db)):
    """
    Permanently delete a business entity and cascade delete all its associated applications,
    application fields, documents, status history, approval requirements, and notifications.
    """
    b = db.query(Business).filter(Business.id == business_id).first()
    if not b:
        raise HTTPException(404, "Business not found")

    business_name = b.name

    # 1. Find and delete all applications and their nested fields, documents, and status history
    apps = db.query(Application).filter(Application.business_id == business_id).all()
    for app in apps:
        db.query(ApplicationStatusHistory).filter(ApplicationStatusHistory.application_id == app.id).delete()
        db.query(ApplicationDocument).filter(ApplicationDocument.application_id == app.id).delete()
        db.query(ApplicationField).filter(ApplicationField.application_id == app.id).delete()
        db.delete(app)

    # 2. Delete approval requirements discovered for this business
    db.query(ApprovalRequirement).filter(ApprovalRequirement.business_id == business_id).delete()

    # 3. Delete notifications for this business
    db.query(Notification).filter(Notification.business_id == business_id).delete()

    # 4. Delete inspections and compliances if linked
    try:
        db.query(Inspection).filter(Inspection.business_id == business_id).delete()
    except Exception:
        pass

    try:
        db.query(ComplianceDue).filter(ComplianceDue.business_id == business_id).delete()
    except Exception:
        pass

    # 5. Delete the business record itself
    db.delete(b)
    db.commit()

    return {
        "message": f"Enterprise '{business_name}' and all associated records deleted successfully.",
        "deleted_id": business_id,
    }

