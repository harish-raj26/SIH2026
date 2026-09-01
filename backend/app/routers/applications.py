from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.approval_requirement import ApprovalRequirement
from app.models.application import Application
from app.models.application_field import ApplicationField
from app.models.application import Application
from app.models.application_document import ApplicationDocument

router = APIRouter(
    prefix="/api/applications",
    tags=["Applications"]
)


@router.post("/")
def create_application(
    business_id: int,
    approval_id: int,
    db: Session = Depends(get_db)
):

    business = (
        db.query(Business)
        .filter(Business.id == business_id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found"
        )

    approval = (
        db.query(ApprovalRequirement)
        .filter(
            ApprovalRequirement.id == approval_id,
            ApprovalRequirement.business_id == business_id
        )
        .first()
    )

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval requirement not found"
        )

    existing = (
        db.query(Application)
        .filter(
            Application.business_id == business_id,
            Application.approval_id == approval_id
        )
        .first()
    )

    if existing:
        return {
            "message": "Application already exists",
            "application_id": existing.id,
            "status": existing.status
        }

    application = Application(
        business_id=business_id,
        approval_id=approval_id,
        status="Draft",
        application_url=approval.application_url
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "message": "Application created successfully",
        "application": {
            "id": application.id,
            "business_id": application.business_id,
            "approval_id": application.approval_id,
            "status": application.status,
            "application_url": application.application_url,
            "created_at": application.created_at
        }
    }
@router.post("/{application_id}/check")
def check_application(
    application_id: int,
    db: Session = Depends(get_db)
):

    application = (
        db.query(Application)
        .filter(
            Application.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    fields = (
        db.query(ApplicationField)
        .filter(
            ApplicationField.application_id == application_id,
            ApplicationField.required == True
        )
        .all()
    )

    total_required_fields = len(fields)

    completed_fields = [
        field
        for field in fields
        if field.value is not None
        and str(field.value).strip() != ""
    ]

    completed_count = len(completed_fields)

    missing_fields = [
        field.field_name
        for field in fields
        if field.value is None
        or str(field.value).strip() == ""
    ]

    if total_required_fields == 0:
        completion_percentage = 100
    else:
        completion_percentage = round(
            (completed_count / total_required_fields) * 100
        )

    if completed_count == total_required_fields:
        status = "Complete"
        ready_for_compliance = True
    else:
        status = "Incomplete"
        ready_for_compliance = False

    return {
        "application_id": application_id,
        "status": status,
        "completion_percentage": completion_percentage,
        "completed_fields": completed_count,
        "total_required_fields": total_required_fields,
        "missing_fields": missing_fields,
        "ready_for_compliance": ready_for_compliance
    }
@router.post("/{application_id}/validate")
def validate_application(
    application_id: int,
    db: Session = Depends(get_db)
):

    application = (
        db.query(Application)
        .filter(
            Application.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    fields = (
        db.query(ApplicationField)
        .filter(
            ApplicationField.application_id == application_id,
            ApplicationField.required == True
        )
        .all()
    )

    missing_fields = []

    for field in fields:

        if (
            field.value is None
            or str(field.value).strip() == ""
        ):
            missing_fields.append(
                field.field_name
            )

    if missing_fields:
        validation_status = "Incomplete"
        compliant = False
    else:
        validation_status = "Compliant"
        compliant = True

    return {
        "application_id": application_id,
        "validation_status": validation_status,
        "compliant": compliant,
        "total_required_fields": len(fields),
        "missing_fields": missing_fields
    }
@router.get("/{application_id}/status")
def get_application_status(
    application_id: int,
    db: Session = Depends(get_db)
):

    application = (
        db.query(Application)
        .filter(
            Application.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    fields = (
        db.query(ApplicationField)
        .filter(
            ApplicationField.application_id == application_id
        )
        .all()
    )

    documents = (
        db.query(ApplicationDocument)
        .filter(
            ApplicationDocument.application_id == application_id
        )
        .all()
    )

    required_fields = [
        field
        for field in fields
        if field.required
    ]

    completed_fields = [
        field
        for field in required_fields
        if field.value is not None
        and str(field.value).strip() != ""
        and field.status == "Completed"
    ]

    missing_fields = [
        field
        for field in required_fields
        if field not in completed_fields
    ]

    required_documents = documents

    verified_documents = [
        document
        for document in required_documents
        if document.status == "Verified"
    ]

    missing_documents = [
    document.document_name
    for document in documents
    if document.required
    and document.status != "Verified"
]

    fields_complete = (
        len(missing_fields) == 0
    )

    documents_complete = (
        len(missing_documents) == 0
    )

    application_ready = (
        fields_complete
        and documents_complete
    )

    if application_ready:
        application.status = "Ready"
    else:
        application.status = "Incomplete"

    db.commit()
    db.refresh(application)

    return {
        "application_id": application_id,
        "status": application.status,
        "application_ready": application_ready,

        "fields": {
            "total_required": len(required_fields),
            "completed": len(completed_fields),
            "missing": len(missing_fields),
            "missing_fields": [
                field.field_name
                for field in missing_fields
            ]
        },

        "documents": {
            "total_required": len(required_documents),
            "verified": len(verified_documents),
            "missing": len(missing_documents),
            "missing_documents": [
                document.document_name
                for document in missing_documents
            ]
        }
    }
@router.post("/{application_id}/submit")
def submit_application(
    application_id: int,
    db: Session = Depends(get_db)
):

    application = (
        db.query(Application)
        .filter(
            Application.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    fields = (
        db.query(ApplicationField)
        .filter(
            ApplicationField.application_id == application_id
        )
        .all()
    )

    documents = (
        db.query(ApplicationDocument)
        .filter(
            ApplicationDocument.application_id == application_id
        )
        .all()
    )

    missing_fields = [
        field.field_name
        for field in fields
        if field.required
        and (
            field.value is None
            or str(field.value).strip() == ""
            or field.status != "Completed"
        )
    ]

    missing_documents = [
        document.document_name
        for document in documents
        if document.required
        and document.status != "Verified"
    ]

    if missing_fields or missing_documents:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Application is not ready for submission",
                "missing_fields": missing_fields,
                "missing_documents": missing_documents
            }
        )

    application.status = "Submitted"

    db.commit()
    db.refresh(application)

    return {
        "message": "Application submitted successfully",
        "application": {
            "id": application.id,
            "business_id": application.business_id,
            "approval_id": application.approval_id,
            "status": application.status,
            "application_url": application.application_url
        }
    }