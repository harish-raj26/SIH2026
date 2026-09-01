from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.approval_requirement import ApprovalRequirement
from app.services.rules import discover_approvals
from app.rag.service import rag_service


router = APIRouter(
    prefix="/api/approvals",
    tags=["Approvals"]
)


@router.post("/discover/{business_id}")
def discover_business_approvals(
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

    discovered = discover_approvals(business)
    for approval_data in discovered:
        approval_query = (
            f"{approval_data['name']} "
            f"{approval_data['category']} "
            f"{approval_data['description']} "
            f"{approval_data['reason']}"
    )

        approval_data["regulatory_evidence"] = rag_service.search(
            approval_query,
            top_k=2
    )

    requirements = []

    for approval_data in discovered:

        existing = (
            db.query(ApprovalRequirement)
            .filter(
                ApprovalRequirement.business_id == business.id,
                ApprovalRequirement.approval_name
                == approval_data["name"]
            )
            .first()
        )

        if existing:
            requirements.append(existing)
            continue

        requirement = ApprovalRequirement(
            business_id=business.id,
            approval_name=approval_data["name"],
            authority=approval_data["authority"],
            category=approval_data["category"],
            description=approval_data["description"],
            reason=approval_data["reason"],
            priority=approval_data["priority"],
            status="Not Started",
            confidence=0.80
        )

        db.add(requirement)
        requirements.append(requirement)

    db.commit()

    return {
        "business_id": business.id,
        "business_name": business.name,
        "approval_count": len(requirements),
        "approvals": [
            {
                "id": requirement.id,
                "name": requirement.approval_name,
                "authority": requirement.authority,
                "category": requirement.category,
                "priority": requirement.priority,
                "status": requirement.status,
                "confidence": requirement.confidence,
                "reason": requirement.reason,
"regulatory_evidence": next(
    (
        approval_data["regulatory_evidence"]
        for approval_data in discovered
        if approval_data["name"] == requirement.approval_name
    ),
    []
)
            }
            for requirement in requirements
        ]
    }