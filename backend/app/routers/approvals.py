from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.approval_requirement import ApprovalRequirement
from app.services.rules import build_regulatory_query
from app.rag.service import rag_service
from app.services.approval_discovery import (
    approval_discovery_service
)


router = APIRouter(
    prefix="/api/approvals",
    tags=["Approvals"]
)


def normalize_name(name):

    return (
        name
        .lower()
        .strip()
        .replace("-", " ")
        .replace("_", " ")
    )


def already_exists(
    approval_name,
    existing_approvals
):

    normalized = normalize_name(
        approval_name
    )

    return any(
        normalize_name(
            existing.approval_name
        ) == normalized
        for existing in existing_approvals
    )


def get_business_context(business):

    return {
        "name": business.name,
        "industry": business.industry,
        "business_type": business.business_type,
        "location": business.location,
        "investment": business.investment,
        "employees": business.employees,
        "land_area": business.land_area,
        "building_area": business.building_area,
        "pollution_category": business.pollution_category,
        "production_type": business.production_type,
        "water_requirement": business.water_requirement,
        "electricity_requirement": (
            business.electricity_requirement
        )
    }


@router.get("/discover/{business_id}")
def discover_business_approvals(
    business_id: int,
    db: Session = Depends(get_db)
):

    business = (
        db.query(Business)
        .filter(
            Business.id == business_id
        )
        .first()
    )

    if not business:

        raise HTTPException(
            status_code=404,
            detail="Business not found"
        )

    existing_approvals = (
        db.query(ApprovalRequirement)
        .filter(
            ApprovalRequirement.business_id
            == business.id
        )
        .all()
    )

    business_context = get_business_context(
        business
    )

    regulatory_query = build_regulatory_query(
        business
    )

    rag_results = rag_service.search(
        query=regulatory_query,
        top_k=20,
        min_score=0.05
    )

    if not rag_results:

        return {
            "business_id": business.id,
            "business_name": business.name,
            "existing_approval_count": len(
                existing_approvals
            ),
            "new_approval_count": 0,
            "approvals": [],
            "message": (
                "No sufficiently relevant "
                "regulatory evidence was found."
            )
        }

    ai_result = (
        approval_discovery_service
        .discover_approvals(
            business_context=business_context,
            regulatory_evidence=rag_results
        )
    )

    if ai_result.get("error"):

        raise HTTPException(
            status_code=500,
            detail=ai_result["error"]
        )

    candidates = ai_result.get(
        "approvals",
        []
    )

    final_candidates = []

    seen_names = set()

    for candidate in candidates:

        approval_name = (
            candidate.get(
                "approval_name"
            )
            or ""
        ).strip()

        if not approval_name:

            continue

        normalized = normalize_name(
            approval_name
        )

        if normalized in seen_names:

            continue

        seen_names.add(
            normalized
        )

        applicability = (
            candidate.get(
                "applicability"
            )
            or ""
        ).strip().lower()

        if applicability not in [
            "applicable",
            "review required"
        ]:

            continue

        if already_exists(
            approval_name,
            existing_approvals
        ):

            continue

        evidence = candidate.get(
            "evidence",
            []
        )

        valid_evidence = []

        for item in evidence:

            source = item.get(
                "source"
            )

            text = item.get(
                "text"
            )

            if not source or not text:

                continue

            valid_evidence.append({
                "source": source,
                "text": text
            })

        if not valid_evidence:

            continue

        confidence = candidate.get(
            "confidence",
            0.0
        )

        try:

            confidence = float(
                confidence
            )

        except (
            TypeError,
            ValueError
        ):

            confidence = 0.0

        confidence = max(
            0.0,
            min(
                0.95,
                confidence
            )
        )

        priority = (
            candidate.get(
                "priority"
            )
            or "Medium"
        )

        if priority not in [
            "High",
            "Medium",
            "Low"
        ]:

            priority = "Medium"

        final_candidates.append({
            "name": approval_name,
            "authority": (
                candidate.get(
                    "authority"
                )
                or "Regulatory Authority"
            ),
            "category": (
                candidate.get(
                    "category"
                )
                or "Regulatory Compliance"
            ),
            "description": (
                candidate.get(
                    "reason"
                )
            ),
            "reason": (
                candidate.get(
                    "reason"
                )
                or "Regulatory requirement "
                   "identified from supplied evidence."
            ),
            "priority": priority,
            "confidence": round(
                confidence,
                2
            ),
            "applicability": (
                candidate.get(
                    "applicability"
                )
                or "Review Required"
            ),
            "regulatory_evidence": (
                valid_evidence
            )
        })

    final_candidates.sort(
        key=lambda item: (
            -item["confidence"],
            item["name"]
        )
    )

    requirements = []

    for candidate in final_candidates:

        requirement = ApprovalRequirement(
            business_id=business.id,
            approval_name=candidate["name"],
            authority=candidate["authority"],
            category=candidate["category"],
            description=candidate["description"],
            reason=candidate["reason"],
            priority=candidate["priority"],
            status="Not Started",
            confidence=candidate["confidence"]
        )

        db.add(
            requirement
        )

        requirements.append(
            (
                requirement,
                candidate
            )
        )

    db.commit()

    response_approvals = []

    for requirement, candidate in requirements:

        db.refresh(
            requirement
        )

        response_approvals.append({
            "id": requirement.id,
            "name": requirement.approval_name,
            "authority": requirement.authority,
            "category": requirement.category,
            "priority": requirement.priority,
            "status": requirement.status,
            "confidence": requirement.confidence,
            "applicability": (
                candidate["applicability"]
            ),
            "reason": requirement.reason,
            "regulatory_evidence": (
                candidate[
                    "regulatory_evidence"
                ]
            )
        })

    return {
        "business_id": business.id,
        "business_name": business.name,
        "existing_approval_count": len(
            existing_approvals
        ),
        "new_approval_count": len(
            response_approvals
        ),
        "approvals": response_approvals
    }