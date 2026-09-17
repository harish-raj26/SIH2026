from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import Application
from app.models.application_field import ApplicationField
from app.models.approval_requirement import ApprovalRequirement
from app.models.business import Business
from app.ai.service import ai_service
from app.rag.service import rag_service
from app.services.field_mapping import field_mapping_service

router = APIRouter(prefix="/api/application-fields", tags=["Application Fields"])


def serialize(field: ApplicationField):
    return {
        "id": field.id,
        "application_id": field.application_id,
        "field_name": field.field_name,
        "field_key": field.field_key,
        "field_type": field.field_type,
        "required": field.required,
        "value": field.value,
        "field_value": field.value,  # For backward-compatible frontend usage
        "source": field.source or "user_input",
        "source_field_path": field.source_field_path,
        "validation_error": field.validation_error,
        "ai_suggestion": field.ai_suggestion,
        "status": field.status,
    }


def get_context(application_id: int, db: Session):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(404, "Application not found")
    business = db.query(Business).filter(Business.id == application.business_id).first()
    approval = db.query(ApprovalRequirement).filter(ApprovalRequirement.id == application.approval_id).first()
    if not business or not approval:
        raise HTTPException(404, "Application context not found")
    return application, business, approval


@router.post("/{application_id}/generate")
def generate_application_fields(application_id: int, db: Session = Depends(get_db)):
    """
    Statutory Field Derivation and Deterministic Enterprise Mapping.
    1. Loads the authoritative schema from the registered Government Integration adapter.
    2. Deterministically maps enterprise attributes (name, pan, investment, employees, location).
    3. Tags each field value with its proven source (business_profile, user_input, etc.).
    4. Validates field format accuracy.
    """
    application, business, approval = get_context(application_id, db)

    # Use deterministic FieldMappingService with real government adapter
    created = field_mapping_service.generate_and_map_fields(application_id, db)

    if not created:
        # Fallback to AI RAG schema derivation if no adapter available
        evidence = rag_service.search(
            f"{approval.approval_name} {approval.authority} {approval.category} required information application fields",
            top_k=5,
        )
        fields_data = ai_service.generate_fields(business, approval, evidence)
        for item in fields_data:
            name = str(item.get("field_name", "")).strip()
            if not name:
                continue
            field = ApplicationField(
                application_id=application_id,
                field_name=name,
                field_type=item.get("field_type", "text"),
                required=bool(item.get("required", True)),
                source="user_input",
                status="Pending",
            )
            db.add(field)
            created.append(field)
        db.commit()
        for f in created:
            db.refresh(f)

    return {
        "message": "Statutory application fields generated and auto-populated successfully",
        "application_id": application_id,
        "approval": approval.approval_name,
        "government_service": application.government_service_code,
        "field_count": len(created),
        "fields": [serialize(f) for f in created],
    }


@router.get("/{application_id}")
def get_application_fields(application_id: int, db: Session = Depends(get_db)):
    get_context(application_id, db)
    fields = (
        db.query(ApplicationField)
        .filter(ApplicationField.application_id == application_id)
        .order_by(ApplicationField.id.asc())
        .all()
    )
    return {
        "application_id": application_id,
        "field_count": len(fields),
        "fields": [serialize(f) for f in fields],
    }


class ApplicationFieldUpdate(BaseModel):
    value: str
    source: Optional[str] = "user_input"


@router.put("/{field_id}")
def update_application_field(field_id: int, data: ApplicationFieldUpdate, db: Session = Depends(get_db)):
    """
    Update a field value with real-time statutory format validation.
    """
    field = db.query(ApplicationField).filter(ApplicationField.id == field_id).first()
    if not field:
        raise HTTPException(404, "Application field not found")

    updated_field = field_mapping_service.update_field_value(
        field_id=field_id,
        new_value=data.value,
        db=db,
        source=data.source or "user_input",
    )

    if updated_field.validation_error:
        # We return the validation error in the response so the frontend displays inline guidance
        return {
            "message": "Field saved with validation note",
            "field": serialize(updated_field),
            "validation_error": updated_field.validation_error,
        }

    return {"message": "Application field updated successfully", "field": serialize(updated_field)}


@router.post("/{field_id}/suggest")
def suggest_application_field(field_id: int, db: Session = Depends(get_db)):
    """AI Assisted Suggestion for optional or complex narrative fields."""
    field = db.query(ApplicationField).filter(ApplicationField.id == field_id).first()
    if not field:
        raise HTTPException(404, "Application field not found")
    application = db.query(Application).filter(Application.id == field.application_id).first()
    business = db.query(Business).filter(Business.id == application.business_id).first() if application else None
    if not business:
        raise HTTPException(404, "Application business not found")

    field.ai_suggestion = ai_service.suggest_field(field.field_name, business)
    db.commit()
    db.refresh(field)
    return {"message": "AI suggestion generated successfully", "field": serialize(field)}


@router.post("/{field_id}/accept-suggestion")
def accept_ai_suggestion(field_id: int, db: Session = Depends(get_db)):
    field = db.query(ApplicationField).filter(ApplicationField.id == field_id).first()
    if not field:
        raise HTTPException(404, "Application field not found")
    if not field.ai_suggestion:
        raise HTTPException(400, "No AI suggestion available")

    updated_field = field_mapping_service.update_field_value(
        field_id=field_id,
        new_value=field.ai_suggestion,
        db=db,
        source="user_input",
    )
    return {"message": "AI suggestion accepted successfully", "field": serialize(updated_field)}
