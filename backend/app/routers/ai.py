from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.approval_requirement import ApprovalRequirement
from app.ai.service import ai_service
from app.rag.service import rag_service


router = APIRouter(
    prefix="/api/ai",
    tags=["AI"]
)


@router.get("/roadmap/{business_id}")
def generate_ai_roadmap(
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

    if not requirements:
        raise HTTPException(
            status_code=404,
            detail="No approval requirements found"
        )

    approvals = []

    for requirement in requirements:

        evidence_query = (
        f"{requirement.approval_name} "
        f"{requirement.category} "
        f"{requirement.authority} "
        f"{requirement.reason}"
    )

        regulatory_evidence = rag_service.search(
            evidence_query,
            top_k=2
    )

        approvals.append({
        "name": requirement.approval_name,
        "authority": requirement.authority,
        "category": requirement.category,
        "priority": requirement.priority,
        "reason": requirement.reason,
        "regulatory_evidence": regulatory_evidence
    })

    business_data = {
        "id": business.id,
        "name": business.name
    }

    roadmap = ai_service.generate_roadmap(
        business=business_data,
        approvals=approvals
    )

    return roadmap


@router.post("/ask")
def ask_ai(
    business_id: int,
    question: str,
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

    if not requirements:
        raise HTTPException(
            status_code=404,
            detail="No approval requirements found"
        )

    evidence = rag_service.search(
        question,
        top_k=5
    )

    approvals = []

    for requirement in requirements:
        approvals.append({
            "name": requirement.approval_name,
            "authority": requirement.authority,
            "category": requirement.category,
            "priority": requirement.priority,
            "reason": requirement.reason
        })

    business_data = {
        "id": business.id,
        "name": business.name
    }

    answer = ai_service.answer_question(
        business=business_data,
        question=question,
        approvals=approvals,
        regulatory_evidence=evidence
    )

    return {
        "business": business.name,
        "question": question,
        "answer": answer
    }