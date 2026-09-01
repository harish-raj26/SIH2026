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

    priority_order = {
        "High": 1,
        "Medium": 2,
        "Low": 3
    }

    requirements.sort(
        key=lambda item: priority_order.get(
            item.priority,
            4
        )
    )

    roadmap = []

    for index, requirement in enumerate(
    requirements,
    start=1
):
        evidence_query = (
            f"{requirement.approval_name} "
            f"{requirement.category} "
            f"{requirement.authority}"
    )

        regulatory_evidence = rag_service.search(
            evidence_query,
            top_k=2
    )

        roadmap.append({
            "step": index,
            "approval_id": requirement.id,
            "approval": requirement.approval_name,
            "authority": requirement.authority,
            "category": requirement.category,
            "priority": requirement.priority,
            "status": requirement.status,
            "confidence": requirement.confidence,
            "application_url": requirement.application_url,
            "regulatory_evidence": regulatory_evidence
    })

    return {
        "business_id": business.id,
        "business_name": business.name,
        "total_steps": len(roadmap),
        "roadmap": roadmap
    }