from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Application, Business, Inspection, Notification, ComplianceDue, ApprovalRequirement

router = APIRouter(prefix="/api", tags=["Compliance Workflow"])

def require_officer(x_role: str = Header("applicant")):
    role = x_role.lower()
    if role not in {"officer", "admin", "compliance_officer"}:
        raise HTTPException(403, "Officer or administrator role required")
    return role

class InspectionCreate(BaseModel):
    application_id: int
    scheduled_at: datetime
    inspector: str | None = None
    notes: str | None = None

class Decision(BaseModel):
    decision: str
    notes: str | None = None

class DueCreate(BaseModel):
    business_id: int
    title: str
    approval_id: int | None = None
    amount: float | None = None
    due_date: datetime | None = None

@router.get("/officer/applications")
def officer_applications(db: Session = Depends(get_db), role=Depends(require_officer)):
    apps = db.query(Application).order_by(Application.created_at.desc()).all()
    return {"applications": [{"id": a.id, "business_id": a.business_id, "approval_id": a.approval_id,
                              "status": a.status, "created_at": a.created_at, "submitted_at": a.submitted_at}
                             for a in apps]}

@router.post("/officer/applications/{application_id}/review")
def review_application(application_id: int, db: Session = Depends(get_db), role=Depends(require_officer)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    app.status = "Under Review"
    db.commit()
    return {"message": "Application moved to officer review", "application_id": app.id, "status": app.status}

@router.post("/officer/applications/{application_id}/decision")
def application_decision(application_id: int, data: Decision, db: Session = Depends(get_db), role=Depends(require_officer)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    decision = data.decision.lower().strip()
    if decision not in {"approved", "rejected"}:
        raise HTTPException(400, "Decision must be approved or rejected")
    app.status = "Approved" if decision == "approved" else "Rejected"
    business = db.query(Business).filter(Business.id == app.business_id).first()
    db.add(Notification(business_id=app.business_id, title=f"Application {app.status}",
                         message=data.notes or f"Application #{app.id} has been {app.status.lower()} by the compliance officer.",
                         type="success" if decision == "approved" else "warning"))
    db.commit()
    return {"message": "Officer decision recorded", "application": {"id": app.id, "status": app.status,
            "business": business.name if business else None}}

@router.post("/inspections")
def schedule_inspection(data: InspectionCreate, db: Session = Depends(get_db), role=Depends(require_officer)):
    app = db.query(Application).filter(Application.id == data.application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    inspection = Inspection(application_id=app.id, scheduled_at=data.scheduled_at,
                            inspector=data.inspector, notes=data.notes)
    db.add(inspection)
    db.add(Notification(business_id=app.business_id, title="Inspection scheduled",
                         message=f"Inspection for application #{app.id} is scheduled for {data.scheduled_at.isoformat()}.",
                         type="inspection"))
    db.commit(); db.refresh(inspection)
    return {"inspection": {"id": inspection.id, "application_id": inspection.application_id,
            "scheduled_at": inspection.scheduled_at, "inspector": inspection.inspector,
            "status": inspection.status, "notes": inspection.notes}}

@router.get("/inspections")
def list_inspections(business_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Inspection)
    if business_id:
        app_ids = [a.id for a in db.query(Application).filter(Application.business_id == business_id).all()]
        q = q.filter(Inspection.application_id.in_(app_ids)) if app_ids else q.filter(Inspection.id == -1)
    rows = q.order_by(Inspection.scheduled_at.asc()).all()
    return {"inspections": [{"id": x.id, "application_id": x.application_id, "scheduled_at": x.scheduled_at,
                             "inspector": x.inspector, "status": x.status, "notes": x.notes} for x in rows]}

@router.get("/notifications/{business_id}")
def notifications(business_id: int, db: Session = Depends(get_db)):
    rows = db.query(Notification).filter(Notification.business_id == business_id).order_by(Notification.created_at.desc()).all()
    return {"notifications": [{"id": n.id, "title": n.title, "message": n.message, "type": n.type,
                               "read": n.read, "created_at": n.created_at} for n in rows]}

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n: raise HTTPException(404, "Notification not found")
    n.read = True; db.commit()
    return {"message": "Notification marked as read"}

@router.get("/dues/{business_id}")
def list_dues(business_id: int, db: Session = Depends(get_db)):
    rows = db.query(ComplianceDue).filter(ComplianceDue.business_id == business_id).order_by(ComplianceDue.due_date.asc()).all()
    return {"dues": [{"id": d.id, "business_id": d.business_id, "approval_id": d.approval_id, "title": d.title,
                      "amount": d.amount, "due_date": d.due_date, "status": d.status, "paid_at": d.paid_at} for d in rows]}

@router.post("/dues")
def create_due(data: DueCreate, db: Session = Depends(get_db), role=Depends(require_officer)):
    if not db.query(Business).filter(Business.id == data.business_id).first():
        raise HTTPException(404, "Business not found")
    due = ComplianceDue(**data.model_dump(), status="Pending")
    db.add(due); db.commit(); db.refresh(due)
    return {"message": "Compliance due recorded", "due_id": due.id}

@router.post("/dues/{due_id}/pay")
def mark_due_paid(due_id: int, db: Session = Depends(get_db)):
    due = db.query(ComplianceDue).filter(ComplianceDue.id == due_id).first()
    if not due: raise HTTPException(404, "Compliance due not found")
    due.status = "Paid"; due.paid_at = datetime.now(timezone.utc); db.commit()
    return {"message": "Compliance due marked as paid", "due_id": due.id, "status": due.status}

@router.get("/lifecycle/{business_id}")
def lifecycle(business_id: int, db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business: raise HTTPException(404, "Business not found")
    approvals = db.query(ApprovalRequirement).filter(ApprovalRequirement.business_id == business_id).all()
    apps = db.query(Application).filter(Application.business_id == business_id).all()
    return {"business": {"id": business.id, "name": business.name}, "approvals": len(approvals),
            "applications": [{"id": a.id, "status": a.status, "approval_id": a.approval_id} for a in apps],
            "renewal_note": "Prototype reminder engine: renewal dates must be entered from the authoritative approval record."}
