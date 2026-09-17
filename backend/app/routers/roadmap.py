import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.approval_requirement import ApprovalRequirement
from app.rag.service import rag_service


router = APIRouter(
    prefix="/api/roadmap",
    tags=["Approval Roadmap"]
)


STAGE_ORDER = {
    "Pre-Establishment": 1,
    "Land & Construction": 2,
    "Pre-Operation": 3,
    "Operation": 4,
    "Ongoing Compliance / Renewal": 5
}


@router.get("/{business_id}")
def get_approval_roadmap(
    business_id: int,
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

    requirements = (
        db.query(ApprovalRequirement)
        .filter(
            ApprovalRequirement.business_id == business_id
        )
        .all()
    )

    # Sort sequentially by stage and priority
    priority_order = {"High": 1, "Medium": 2, "Low": 3}
    requirements.sort(
        key=lambda item: (
            STAGE_ORDER.get(item.stage, 3),
            priority_order.get(item.priority, 2),
            0 if item.approval_status == "REQUIRED" else 1
        )
    )

    roadmap = []
    stage_groups = {s: [] for s in STAGE_ORDER}

    for index, req in enumerate(requirements, start=1):
        docs = req.documents_required
        if isinstance(docs, str):
            try:
                docs = json.loads(docs)
            except Exception:
                docs = []

        deps = req.dependencies
        if isinstance(deps, str):
            try:
                deps = json.loads(deps)
            except Exception:
                deps = []

        ev = req.regulatory_evidence
        if isinstance(ev, str):
            try:
                ev = json.loads(ev)
            except Exception:
                ev = []

        item_data = {
            "step": index,
            "approval_id": req.id,
            "id": req.id,
            "approval": req.approval_name,
            "approval_name": req.approval_name,
            "authority": req.authority,
            "category": req.category,
            "stage": req.stage or "Pre-Operation",
            "priority": req.priority,
            "status": req.approval_status or req.status or "REQUIRED",
            "approval_status": req.approval_status or "REQUIRED",
            "workflow_status": req.status or "Not Started",
            "reason": req.reason,
            "confidence": req.confidence,
            "application_url": req.application_url,
            "source_url": req.source_url,
            "source_type": req.source_type,
            "documents_required": docs,
            "dependencies": deps,
            "timeline": req.timeline or "15 - 30 working days",
            "regulatory_evidence": ev
        }
        roadmap.append(item_data)
        st = req.stage or "Pre-Operation"
        if st in stage_groups:
            stage_groups[st].append(item_data)
        else:
            stage_groups["Pre-Operation"].append(item_data)

    return {
        "business_id": business.id,
        "business_name": business.name,
        "total_steps": len(roadmap),
        "roadmap": roadmap,
        "stages": stage_groups,
        "disclaimer": "Sequential statutory clearances organized by lifecycle stage based on regulatory dependencies."
    }