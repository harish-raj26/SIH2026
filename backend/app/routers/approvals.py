from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.approval_requirement import ApprovalRequirement

from app.services.rules import (
    build_regulatory_query
)

from app.rag.service import (
    rag_service
)

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

        "business_type":
            business.business_type,

        "location":
            business.location,

        "investment":
            business.investment,

        "employees":
            business.employees,

        "land_area":
            business.land_area,

        "building_area":
            business.building_area,

        "pollution_category":
            business.pollution_category,

        "production_type":
            business.production_type,

        "water_requirement":
            business.water_requirement,

        "electricity_requirement":
            business.electricity_requirement
    }


def collect_regulatory_evidence(business):
    """
    Collect regulatory evidence using multiple
    focused business-driven searches.
    """

    industry = (
        business.industry or ""
    )

    production_type = (
        business.production_type or ""
    )

    queries = [

        f"""
        {industry}
        {production_type}
        industry specific regulatory requirements
        sector specific licences approvals permits
        """,

        f"""
        {industry}
        products
        product licensing
        product registration
        product approval
        product authorization
        """,

        f"""
        {industry}
        manufacturing
        processing
        production
        manufacturing licence
        manufacturing approval
        """,

        f"""
        {industry}
        storage
        handling
        hazardous substances
        storage permission
        handling authorization
        """,

        f"""
        {industry}
        environmental
        pollution
        wastewater
        waste
        clearance
        consent
        authorization
        """,

        f"""
        {industry}
        building
        premises
        fire safety
        electrical safety
        facility approval
        """,

        f"""
        {industry}
        workers
        employees
        labour
        workplace safety
        employment registration
        """,

        build_regulatory_query(
            business
        )
    ]

    evidence_map = {}

    for query in queries:

        if not query.strip():
            continue

        results = rag_service.search(
            query=query,
            top_k=15,
            min_score=0.0
        )

        for item in results:

            source = item.get(
                "source"
            )

            text = item.get(
                "text"
            )

            if not source or not text:
                continue

            key = (
                source,
                text.strip()
            )

            if key not in evidence_map:

                evidence_map[key] = item

    evidence = list(
        evidence_map.values()
    )

    evidence.sort(
        key=lambda item: item.get(
            "score",
            0
        ),
        reverse=True
    )

    return evidence[:60]


@router.get(
    "/discover/{business_id}"
)
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
        db.query(
            ApprovalRequirement
        )
        .filter(
            ApprovalRequirement.business_id
            == business.id
        )
        .all()
    )

    existing_approval_response = []

    for approval in existing_approvals:

        existing_approval_response.append({

            "id":
                approval.id,

            "name":
                approval.approval_name,

            "authority":
                approval.authority,

            "category":
                approval.category,

            "priority":
                approval.priority,

            "status":
                approval.status,

            "confidence":
                approval.confidence,

            "reason":
                approval.reason,

            "regulatory_evidence":
                []
        })

    business_context = (
        get_business_context(
            business
        )
    )

    rag_results = (
        collect_regulatory_evidence(
            business
        )
    )

    if not rag_results:

        return {

            "business_id":
                business.id,

            "business_name":
                business.name,

            "existing_approval_count":
                len(existing_approvals),

            "new_approval_count":
                0,

            "recommendation_count":
                0,

            "persisted_approval_count":
                0,

            "approval_count":
                len(existing_approvals),

            "evidence_count":
                0,

            "approvals":
                existing_approval_response,

            "recommendations":
                [],

            "message":
                (
                    "No sufficiently relevant "
                    "regulatory evidence was found."
                )
        }

    ai_result = (
        approval_discovery_service
        .discover_approvals(

            business_context=
                business_context,

            regulatory_evidence=
                rag_results
        )
    )

    if ai_result.get(
        "error"
    ):

        raise HTTPException(
            status_code=500,
            detail=ai_result[
                "error"
            ]
        )

    candidates = (
        ai_result.get(
            "approvals",
            []
        )
    )

    final_candidates = []

    seen_names = set()

    for candidate in candidates:

        approval_name = (
            candidate.get(
                "approval_name"
            )
            or candidate.get(
                "name"
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
            or "Review Required"
        ).strip()

        if applicability.lower() not in [
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

            if not isinstance(
                item,
                dict
            ):
                continue

            source = item.get(
                "source"
            )

            text = item.get(
                "text"
            )

            if not source or not text:
                continue

            valid_evidence.append({

                "source":
                    source,

                "text":
                    text,

                "score":
                    item.get(
                        "score"
                    ),

                "matched_line":
                    item.get(
                        "matched_line"
                    ),

                "context":
                    item.get(
                        "context"
                    )
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

            "name":
                approval_name,

            "authority":
                (
                    candidate.get(
                        "authority"
                    )
                    or "Regulatory Authority"
                ),

            "category":
                (
                    candidate.get(
                        "category"
                    )
                    or "Regulatory Compliance"
                ),

            "application_name":
                (
                    candidate.get(
                        "application_name"
                    )
                    or (
                        f"{approval_name} "
                        "Application"
                    )
                ),

            "application_url":
                candidate.get(
                    "application_url"
                ),

            "application_department":
                candidate.get(
                    "application_department"
                ),

            "description":
                (
                    candidate.get(
                        "description"
                    )
                    or candidate.get(
                        "reason"
                    )
                ),

            "reason":
                (
                    candidate.get(
                        "reason"
                    )
                    or (
                        "Regulatory requirement "
                        "identified from supplied "
                        "evidence."
                    )
                ),

            "priority":
                priority,

            "confidence":
                round(
                    confidence,
                    2
                ),

            "applicability":
                applicability,

            "regulatory_evidence":
                valid_evidence
        })

    final_candidates.sort(
        key=lambda item: (
            -item["confidence"],
            item["name"]
        )
    )

    recommendations = []

    applicable_candidates = []

    for candidate in final_candidates:

        recommendation = {

            "id":
                None,

            "name":
                candidate["name"],

            "authority":
                candidate["authority"],

            "category":
                candidate["category"],

            "application_name":
                candidate[
                    "application_name"
                ],

            "application_url":
                candidate[
                    "application_url"
                ],

            "application_department":
                candidate[
                    "application_department"
                ],

            "priority":
                candidate["priority"],

            "status":
                "Recommendation",

            "confidence":
                candidate["confidence"],

            "applicability":
                candidate[
                    "applicability"
                ],

            "reason":
                candidate["reason"],

            "regulatory_evidence":
                candidate[
                    "regulatory_evidence"
                ]
        }

        recommendations.append(
            recommendation
        )

        if (
            candidate[
                "applicability"
            ].lower()
            == "applicable"
        ):

            applicable_candidates.append(
                candidate
            )

    requirements = []

    for candidate in applicable_candidates:

        requirement = (
            ApprovalRequirement(

                business_id=
                    business.id,

                approval_name=
                    candidate[
                        "name"
                    ],

                authority=
                    candidate[
                        "authority"
                    ],

                category=
                    candidate[
                        "category"
                    ],

                description=
                    candidate[
                        "description"
                    ],

                reason=
                    candidate[
                        "reason"
                    ],

                priority=
                    candidate[
                        "priority"
                    ],

                status=
                    "Not Started",

                confidence=
                    candidate[
                        "confidence"
                    ]
            )
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

    if requirements:

        db.commit()

    response_approvals = []

    for requirement, candidate in requirements:

        db.refresh(
            requirement
        )

        response_approvals.append({

            "id":
                requirement.id,

            "name":
                requirement.approval_name,

            "authority":
                requirement.authority,

            "category":
                requirement.category,

            "application_name":
                candidate[
                    "application_name"
                ],

            "application_url":
                candidate[
                    "application_url"
                ],

            "application_department":
                candidate[
                    "application_department"
                ],

            "priority":
                requirement.priority,

            "status":
                requirement.status,

            "confidence":
                requirement.confidence,

            "applicability":
                candidate[
                    "applicability"
                ],

            "reason":
                requirement.reason,

            "regulatory_evidence":
                candidate[
                    "regulatory_evidence"
                ]
        })

    all_approvals = (
        existing_approval_response
        + response_approvals
    )

    return {

        "business_id":
            business.id,

        "business_name":
            business.name,

        "existing_approval_count":
            len(existing_approvals),

        "new_approval_count":
            len(response_approvals),

        "recommendation_count":
            len(recommendations),

        "persisted_approval_count":
            len(response_approvals),

        "approval_count":
            len(all_approvals),

        "evidence_count":
            len(rag_results),

        "approvals":
            all_approvals,

        "recommendations":
            recommendations
    }