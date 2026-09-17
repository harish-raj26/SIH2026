from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.approval_requirement import ApprovalRequirement
from app.models.application import Application
from app.models.application_field import ApplicationField
from app.models.application_document import ApplicationDocument
from app.models.application_status_history import ApplicationStatusHistory
from app.models.notification import Notification
from app.government_integrations.registry import get_adapter_for_approval, get_adapter_by_service_code
from app.services.field_mapping import field_mapping_service
from app.services.status_tracker import status_tracking_service

router = APIRouter(prefix="/api/applications", tags=["Applications"])


class SubmitApplicationPayload(BaseModel):
    government_app_id: Optional[str] = None
    reference_no: Optional[str] = None
    portal_acknowledged: Optional[bool] = False
    submission_notes: Optional[str] = None


def serialize(app: Application) -> Dict[str, Any]:
    return {
        "id": app.id,
        "business_id": app.business_id,
        "approval_id": app.approval_id,
        "status": app.status,
        "government_service_code": app.government_service_code,
        "government_app_id": app.government_app_id,
        "government_reference_no": app.government_reference_no,
        "submission_mode": app.submission_mode or "PORTAL_ASSISTED",
        "normalized_status": app.normalized_status or "DRAFT",
        "government_status": app.government_status,
        "portal_submission_url": app.portal_submission_url or app.application_url,
        "application_url": app.application_url,
        "last_synced_at": app.last_synced_at.isoformat() if app.last_synced_at else None,
        "created_at": app.created_at.isoformat() if app.created_at else None,
        "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
    }


def readiness(application_id: int, db: Session):
    application = db.query(Application).filter(Application.id == application_id).first()
    fields = db.query(ApplicationField).filter(ApplicationField.application_id == application_id).all()
    docs = db.query(ApplicationDocument).filter(ApplicationDocument.application_id == application_id).all()

    adapter = None
    if application:
        adapter = field_mapping_service.get_adapter_for_app(application, db)

    fields_dict = {f.field_name: f.value for f in fields}
    for f in fields:
        if f.field_key:
            fields_dict[f.field_key] = f.value

    docs_list = [
        {"document_name": d.document_name, "status": d.status, "file_path": d.file_path, "required": d.required}
        for d in docs
    ]

    if adapter:
        validation_res = adapter.validate_packet(fields_dict, docs_list)
        return fields, docs, validation_res.missing_fields, [f["field"] for f in validation_res.invalid_fields], validation_res.missing_documents, validation_res

    missing_fields = [f.field_name for f in fields if f.required and (not f.value or f.status != "Completed")]
    invalid_fields = [f.field_name for f in fields if f.validation_error]
    missing_docs = [d.document_name for d in docs if d.required and d.status not in ["Uploaded", "Verified"]]
    return fields, docs, missing_fields, invalid_fields, missing_docs, None


@router.post("/")
def create_application(business_id: int, approval_id: int, db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.id == business_id).first()
    approval = db.query(ApprovalRequirement).filter(
        ApprovalRequirement.id == approval_id, ApprovalRequirement.business_id == business_id
    ).first()

    if not business:
        raise HTTPException(404, "Business not found")
    if not approval:
        raise HTTPException(404, "Approval requirement not found")

    existing = db.query(Application).filter(
        Application.business_id == business_id, Application.approval_id == approval_id
    ).first()

    if existing:
        # Ensure fields are mapped
        field_mapping_service.generate_and_map_fields(existing.id, db)
        return {"message": "Application already exists", "application": serialize(existing)}

    # Resolve government adapter
    adapter = get_adapter_for_approval(approval.approval_name, approval.authority)
    service_code = adapter.service_code if adapter else None
    portal_url = adapter.portal_url if adapter else approval.application_url

    app = Application(
        business_id=business_id,
        approval_id=approval_id,
        status="Draft",
        government_service_code=service_code,
        normalized_status="DRAFT",
        government_status="Draft Preparation in Progress",
        portal_submission_url=portal_url,
        application_url=approval.application_url,
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # Automatically derive and populate initial fields with provenance source tags
    field_mapping_service.generate_and_map_fields(app.id, db)

    return {"message": "Government application initialized successfully", "application": serialize(app)}


@router.get("/")
def list_applications(business_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Application)
    if business_id is not None:
        query = query.filter(Application.business_id == business_id)
    apps = query.order_by(Application.created_at.desc()).all()
    return {"applications": [serialize(a) for a in apps], "count": len(apps)}


@router.get("/{application_id}")
def get_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    return serialize(app)


@router.post("/{application_id}/check")
def check_application(application_id: int, db: Session = Depends(get_db)):
    """
    Statutory Application Check.
    Validates mandatory fields, format accuracy, and required document attachments.
    Blocks submission if incomplete or invalid.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")

    fields, docs, missing_fields, invalid_fields, missing_docs, val_res = readiness(application_id, db)
    required_fields = [f for f in fields if f.required]
    completed_fields = [f for f in required_fields if f.value and not f.validation_error]
    required_docs = [d for d in docs if d.required]
    verified_docs = [d for d in required_docs if d.status in ["Uploaded", "Verified"]]

    total_req = len(required_fields) + len(required_docs)
    total_done = len(completed_fields) + len(verified_docs)
    percentage = 100 if total_req == 0 else min(100, round((total_done / total_req) * 100))

    ready = (len(missing_fields) == 0 and len(invalid_fields) == 0 and len(missing_docs) == 0)

    adapter = field_mapping_service.get_adapter_for_app(app, db)
    service_title = adapter.service_name if adapter else "Statutory Application"

    return {
        "application_id": application_id,
        "government_service": service_title,
        "completion_percentage": percentage,
        "missing_fields": missing_fields,
        "invalid_fields": invalid_fields,
        "missing_documents": missing_docs,
        "ready_for_submission": ready,
        "summary": "Application packet is fully validated and ready for submission." if ready else (
            f"Requirements missing: {len(missing_fields)} fields, {len(invalid_fields)} invalid values, {len(missing_docs)} documents."
        ),
        "validation_details": {
            "total_fields": len(required_fields),
            "completed_fields": len(completed_fields),
            "total_documents": len(required_docs),
            "verified_documents": len(verified_docs),
        },
    }


@router.post("/{application_id}/validate")
def validate_application(application_id: int, db: Session = Depends(get_db)):
    """Alias for compliance validation with detailed checklist."""
    return check_application(application_id, db)


@router.get("/{application_id}/status")
def get_application_status(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")

    fields, docs, missing_fields, invalid_fields, missing_docs, _ = readiness(application_id, db)
    required_fields = [f for f in fields if f.required]
    required_docs = [d for d in docs if d.required]
    ready = not missing_fields and not invalid_fields and not missing_docs

    return {
        "application_id": application_id,
        "status": app.status,
        "normalized_status": app.normalized_status or "DRAFT",
        "government_status": app.government_status or "Draft Preparation",
        "government_app_id": app.government_app_id,
        "government_reference_no": app.government_reference_no,
        "application_ready": ready,
        "last_synced_at": app.last_synced_at.isoformat() if app.last_synced_at else None,
        "fields": {
            "total_required": len(required_fields),
            "completed": len(required_fields) - len(missing_fields),
            "missing": len(missing_fields),
            "missing_fields": missing_fields,
            "invalid_fields": invalid_fields,
        },
        "documents": {
            "total_required": len(required_docs),
            "verified": len(required_docs) - len(missing_docs),
            "missing": len(missing_docs),
            "missing_documents": missing_docs,
        },
    }


@router.post("/{application_id}/submit")
def submit_application(
    application_id: int,
    payload: Optional[SubmitApplicationPayload] = None,
    db: Session = Depends(get_db),
):
    """
    Real Statutory Submission Endpoint.
    1. Validates all mandatory fields and documents (blocks if incomplete).
    2. Compiles standardized government dossier packet.
    3. Dispatches to the real Government Integration adapter.
    4. Captures verified Government Application ID / Reference Number.
    5. Records initial ApplicationStatusHistory entry.
    6. Creates in-app submission notification.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")

    business = db.query(Business).filter(Business.id == app.business_id).first()
    if not business:
        raise HTTPException(404, "Enterprise context not found")

    fields, docs, missing_fields, invalid_fields, missing_docs, _ = readiness(application_id, db)
    if missing_fields or invalid_fields or missing_docs:
        raise HTTPException(
            400,
            detail={
                "message": "Application is not ready for submission. Please resolve missing or invalid statutory items.",
                "missing_fields": missing_fields,
                "invalid_fields": invalid_fields,
                "missing_documents": missing_docs,
            },
        )

    adapter = field_mapping_service.get_adapter_for_app(app, db)
    if not adapter:
        raise HTTPException(500, "No government integration adapter configured for this approval.")

    # Prepare dossier
    fields_dict = {f.field_name: f.value for f in fields}
    for f in fields:
        if f.field_key:
            fields_dict[f.field_key] = f.value

    docs_list = [
        {"document_name": d.document_name, "status": d.status, "file_path": d.file_path, "type": d.document_type}
        for d in docs
    ]
    dossier = adapter.prepare_dossier(business, fields_dict, docs_list)

    user_conf = payload.model_dump() if payload else {}

    # Execute submission via adapter
    submission_res = adapter.submit_application(
        dossier=dossier,
        user_confirmation=user_conf,
    )

    if not submission_res.success:
        raise HTTPException(
            502,
            detail={
                "message": submission_res.message,
                "government_status": submission_res.government_status,
            },
        )

    old_status = app.status

    # Record real government reference details
    if submission_res.government_app_id:
        app.government_app_id = submission_res.government_app_id
    if submission_res.government_reference_no:
        app.government_reference_no = submission_res.government_reference_no

    app.submission_mode = submission_res.submission_mode
    app.government_status = submission_res.government_status
    app.normalized_status = submission_res.normalized_status.value
    app.submitted_at = submission_res.submission_timestamp
    app.last_synced_at = datetime.now(timezone.utc)
    app.submission_response_raw = json.dumps(submission_res.raw_response)

    if submission_res.normalized_status in ["SUBMITTED", "GOVERNMENT_CONFIRMED", "UNDER_REVIEW"]:
        app.status = "Submitted"
    elif submission_res.normalized_status == "PREPARED":
        app.status = "Prepared"

    # Record immutable initial status history
    history_entry = ApplicationStatusHistory(
        application_id=app.id,
        old_status=old_status,
        new_status=app.status,
        government_status=submission_res.government_status,
        normalized_status=submission_res.normalized_status.value,
        source=submission_res.submission_mode,
        remarks=submission_res.message,
        created_at=datetime.now(timezone.utc),
    )
    db.add(history_entry)

    # Create in-app notification
    if app.government_app_id:
        notif = Notification(
            business_id=app.business_id,
            title=f"Application Filed: {adapter.service_name}",
            message=f"Your application was successfully recorded under Government Reference No: {app.government_app_id}. Status: {app.government_status}",
            type="success",
            read=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(notif)

    db.commit()
    db.refresh(app)

    return {
        "message": submission_res.message,
        "application": serialize(app),
        "government_app_id": app.government_app_id,
        "government_reference_no": app.government_reference_no,
        "government_status": app.government_status,
        "normalized_status": app.normalized_status,
        "portal_url": adapter.portal_url,
    }


@router.post("/{application_id}/sync-status")
def sync_application_status(application_id: int, db: Session = Depends(get_db)):
    """
    Trigger authoritative status synchronization from the government department.
    """
    try:
        result = status_tracking_service.sync_application_status(application_id, db)
        return result
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(502, f"Failed to sync with government service: {e}")


@router.get("/{application_id}/history")
def get_application_history(application_id: int, db: Session = Depends(get_db)):
    """
    Retrieve full immutable timeline of authoritative status changes.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")

    history = status_tracking_service.get_status_history(application_id, db)
    return {
        "application_id": application_id,
        "government_app_id": app.government_app_id,
        "government_reference_no": app.government_reference_no,
        "current_status": app.status,
        "current_government_status": app.government_status,
        "history_count": len(history),
        "history": history,
    }


@router.get("/{application_id}/dossier")
def get_application_dossier(application_id: int, db: Session = Depends(get_db)):
    """
    Export verified government application filing dossier packet.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")

    business = db.query(Business).filter(Business.id == app.business_id).first()
    fields = db.query(ApplicationField).filter(ApplicationField.application_id == application_id).all()
    docs = db.query(ApplicationDocument).filter(ApplicationDocument.application_id == application_id).all()

    adapter = field_mapping_service.get_adapter_for_app(app, db)
    if not adapter:
        raise HTTPException(400, "No government integration adapter available.")

    fields_dict = {f.field_name: f.value for f in fields}
    for f in fields:
        if f.field_key:
            fields_dict[f.field_key] = f.value

    docs_list = [
        {"document_name": d.document_name, "status": d.status, "file_path": d.file_path, "type": d.document_type}
        for d in docs
    ]

    dossier = adapter.prepare_dossier(business, fields_dict, docs_list)
    return {
        "application_id": application_id,
        "dossier": dossier.model_dump(),
        "portal_url": adapter.portal_url,
    }
