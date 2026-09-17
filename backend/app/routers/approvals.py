"""
Approvals Router for Dynamic Discovery, Filtering, Roadmap, and Source Metadata.
"""

import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.approval_requirement import ApprovalRequirement
from app.models.approval import Approval
from app.services.approval_discovery import approval_discovery_service
from app.services.regulatory_catalog import seed_regulatory_catalog, STATUTORY_APPROVALS_CATALOG

router = APIRouter(
    prefix="/api/approvals",
    tags=["Approvals"]
)


class EnterpriseAnalyzeRequest(BaseModel):
    business_id: Optional[int] = None
    enterprise_name: Optional[str] = "Enterprise"
    name: Optional[str] = None
    sector: Optional[str] = "Manufacturing"
    industry: Optional[str] = None
    sub_sector: Optional[str] = None
    legal_form: Optional[str] = "Private Limited Company"
    business_type: Optional[str] = None
    state: Optional[str] = "Tamil Nadu"
    district: Optional[str] = "Coimbatore"
    location: Optional[str] = None
    business_activity: Optional[str] = "Manufacturing"
    products: Optional[Any] = None
    investment_amount: Optional[float] = 0.0
    investment: Optional[float] = None
    employees: Optional[int] = 0
    factory: Optional[bool] = False
    production_capacity: Optional[str] = None
    land_type: Optional[str] = "Industrial"
    land_area: Optional[float] = None
    building_area: Optional[float] = None
    hazardous_materials: Optional[bool] = False
    hazardous_details: Optional[str] = None
    environment_category: Optional[str] = "Orange"
    pollution_category: Optional[str] = None
    water_usage: Optional[str] = None
    waste_generation: Optional[str] = None
    power_requirement: Optional[str] = None
    import_export: Optional[bool] = False
    boiler: Optional[bool] = False
    boiler_details: Optional[str] = None


def serialize_requirement(req: ApprovalRequirement) -> Dict[str, Any]:
    docs = req.documents_required
    if isinstance(docs, str):
        try:
            docs = json.loads(docs)
        except Exception:
            docs = [docs] if docs else []

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

    return {
        "id": req.id,
        "approval_id": req.id,
        "business_id": req.business_id,
        "approval_name": req.approval_name,
        "name": req.approval_name,
        "authority": req.authority,
        "category": req.category,
        "description": req.description,
        "reason": req.reason,
        "priority": req.priority,
        "status": req.approval_status or req.status or "REQUIRED",
        "approval_status": req.approval_status or "REQUIRED",
        "workflow_status": req.status or "Not Started",
        "jurisdiction": req.jurisdiction or "State",
        "stage": req.stage or "Pre-Operation",
        "documents_required": docs,
        "fees": req.fees or "Schedule fee",
        "validity": req.validity or "1 - 5 Years",
        "timeline": req.timeline or "15 - 30 working days",
        "application_url": req.application_url or "https://tnswp.com/",
        "source_url": req.source_url or "https://www.nsws.gov.in/portal/approvals",
        "source_type": req.source_type or "National Single Window System (NSWS)",
        "regulatory_evidence": ev,
        "dependencies": deps,
        "condition_trigger": req.condition_trigger or "Regulatory criteria match",
        "last_verified": req.last_verified or "2026-03-01",
        "confidence": req.confidence or 0.95
    }


# ----------------------------------------------------------------------
# 1. POST /api/approvals/analyze
# ----------------------------------------------------------------------
@router.post("/analyze")
def analyze_approvals(payload: EnterpriseAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Dynamically identify candidate statutory approvals based on enterprise characteristics.
    """
    seed_regulatory_catalog(db)

    # If business_id is passed, load existing business record
    if payload.business_id:
        biz = db.query(Business).filter(Business.id == payload.business_id).first()
        if biz:
            from app.routers.business import serialize
            biz_dict = serialize(biz)
            res = approval_discovery_service.discover_approvals(biz_dict, db_session=db)
            return res

    # Otherwise evaluate directly from request payload
    raw_dict = payload.model_dump()
    res = approval_discovery_service.discover_approvals(raw_dict, db_session=db)
    return res


# ----------------------------------------------------------------------
# 2. GET /api/approval-sources (Official Regulatory Sources Catalog)
# ----------------------------------------------------------------------
@router.get("/sources")
def get_approval_sources_plural():
    return get_approval_sources()


@router.get("/approval-sources")
def get_approval_sources():
    """Returns metadata on all indexed authoritative regulatory sources."""
    sources = [
        {
            "name": "National Single Window System (NSWS)",
            "authority": "Department for Promotion of Industry and Internal Trade (DPIIT), GoI",
            "jurisdiction": "Central",
            "url": "https://www.nsws.gov.in/",
            "type": "Central Single Window Portal",
            "approvals_covered": ["MCA Company / LLP Registration", "Udyam MSME", "GST", "EPFO", "ESIC", "DGFT IEC", "PESO", "FSSAI"],
            "last_verified": "2026-03-01",
            "status": "Active & Synchronized"
        },
        {
            "name": "Tamil Nadu Single Window Portal (Guidance TN)",
            "authority": "Guidance Bureau, Industries Department, Govt of Tamil Nadu",
            "jurisdiction": "State (Tamil Nadu)",
            "url": "https://tnswp.com/",
            "type": "State Single Window Portal",
            "approvals_covered": ["DTCP / CMDA Industrial Planning Permission", "SIPCOT / SIDCO Plot Allotment", "TANGEDCO Power", "CEIG Electrical Safety", "Fire NOC", "DISH Factory Licence"],
            "last_verified": "2026-03-01",
            "status": "Active & Synchronized"
        },
        {
            "name": "Tamil Nadu Pollution Control Board (TNPCB)",
            "authority": "Environment, Climate Change & Forests Department, Govt of Tamil Nadu",
            "jurisdiction": "State (Tamil Nadu)",
            "url": "https://tnpcb.gov.in/ocmms/",
            "type": "Pollution Control Board Portal",
            "approvals_covered": ["Consent to Establish (CTE)", "Consent to Operate (CTO)", "Hazardous Waste Authorization (Form 2)", "Plastic Waste EPR"],
            "last_verified": "2026-03-01",
            "status": "Active & Synchronized"
        },
        {
            "name": "Directorate of Industrial Safety and Health (DISH)",
            "authority": "Labour and Employment Department, Govt of Tamil Nadu",
            "jurisdiction": "State (Tamil Nadu)",
            "url": "https://dish.tn.gov.in/",
            "type": "Factory & Labour Directorate",
            "approvals_covered": ["Factory Building Plan Approval (Section 6)", "Factory Licence & Registration (Section 7)", "Safety Officer Compliance"],
            "last_verified": "2026-03-01",
            "status": "Active & Synchronized"
        },
        {
            "name": "Directorate of Fire and Rescue Services (TNFRS)",
            "authority": "Home Department, Govt of Tamil Nadu",
            "jurisdiction": "State (Tamil Nadu)",
            "url": "https://www.tnfrs.tn.gov.in/",
            "type": "Fire & Life Safety Department",
            "approvals_covered": ["Initial Planning Fire NOC / MSB Clearance", "Final Operational Fire Licence"],
            "last_verified": "2026-03-01",
            "status": "Active & Synchronized"
        },
        {
            "name": "Directorate of Boilers, Tamil Nadu",
            "authority": "Labour Welfare & Skill Development Department, Tamil Nadu",
            "jurisdiction": "State (Tamil Nadu)",
            "url": "https://www.tn.gov.in/boilers/",
            "type": "Boilers & Pressure Vessels Directorate",
            "approvals_covered": ["Boiler Registration (Section 7)", "Annual Certificate of Inspection", "Steam Pipeline Fabrication Drawing Approval"],
            "last_verified": "2026-03-01",
            "status": "Active & Synchronized"
        },
        {
            "name": "Chief Electrical Inspector to Government (CEIG)",
            "authority": "Energy Department, Govt of Tamil Nadu",
            "jurisdiction": "State (Tamil Nadu)",
            "url": "https://tneig.tn.gov.in/",
            "type": "Electrical Safety Inspectorate",
            "approvals_covered": ["HT Substation Safety Certificate", "Captive DG Set Approval", "High Voltage Installation Drawing Sanction"],
            "last_verified": "2026-03-01",
            "status": "Active & Synchronized"
        },
        {
            "name": "Directorate General of Foreign Trade (DGFT)",
            "authority": "Ministry of Commerce and Industry, GoI",
            "jurisdiction": "Central",
            "url": "https://www.dgft.gov.in/",
            "type": "Foreign Trade Regulator",
            "approvals_covered": ["Importer Exporter Code (IEC) Issuance", "Advance Authorization", "EPCG Scheme Clearance"],
            "last_verified": "2026-03-01",
            "status": "Active & Synchronized"
        },
        {
            "name": "Petroleum and Explosives Safety Organization (PESO)",
            "authority": "Ministry of Commerce and Industry, GoI",
            "jurisdiction": "Central",
            "url": "https://peso.gov.in/",
            "type": "Explosives & Hazardous Safety Regulator",
            "approvals_covered": ["Petroleum / Solvents Storage License", "Compressed Gas Cylinders Rules Clearance", "Bulk Storage Tank Layout Approval"],
            "last_verified": "2026-03-01",
            "status": "Active & Synchronized"
        },
        {
            "name": "Food Safety and Standards Authority of India (FSSAI)",
            "authority": "Ministry of Health and Family Welfare, GoI",
            "jurisdiction": "Central / State",
            "url": "https://foscos.fssai.gov.in/",
            "type": "Food Safety Regulator",
            "approvals_covered": ["State Manufacturing Food License", "Central Food Business Operator License", "FSMS Hygiene Certification"],
            "last_verified": "2026-03-01",
            "status": "Active & Synchronized"
        }
    ]
    return {
        "sources": sources,
        "count": len(sources),
        "last_catalog_refresh": "2026-03-01",
        "description": "Curated official statutory portals for enterprise compliance in Tamil Nadu & Pan-India."
    }


# ----------------------------------------------------------------------
# 3. POST /api/approvals/refresh (Recalculate when parameters change)
# ----------------------------------------------------------------------
@router.post("/refresh")
def refresh_business_approvals(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Recalculate and update the enterprise's approval requirements in the DB.
    """
    business_id = payload.get("business_id") or payload.get("enterprise_id")
    if not business_id:
        raise HTTPException(400, "business_id is required")

    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(404, "Business not found")

    # Update parameters if provided in payload
    from app.routers.business import serialize
    for k in ["factory", "hazardous_materials", "boiler", "import_export", "employees", "investment", "pollution_category", "land_type", "state", "district"]:
        if k in payload and hasattr(business, k):
            setattr(business, k, payload[k])
    db.commit()
    db.refresh(business)

    biz_dict = serialize(business)
    discovery_res = approval_discovery_service.discover_approvals(biz_dict, db_session=db)

    # Wipe and replace requirements for fresh evaluation
    db.query(ApprovalRequirement).filter(ApprovalRequirement.business_id == business_id).delete()

    for app in discovery_res.get("approvals", []):
        docs_str = json.dumps(app.get("documents_required", []))
        deps_str = json.dumps(app.get("dependencies", []))
        ev_str = json.dumps(app.get("regulatory_evidence", []))

        req = ApprovalRequirement(
            business_id=business.id,
            approval_name=app["approval_name"],
            authority=app["authority"],
            category=app.get("category", "Other Regulatory Approvals"),
            description=app.get("description"),
            reason=app.get("reason"),
            priority=app.get("priority", "Medium"),
            status="Not Started",
            approval_status=app.get("approval_status", "REQUIRED"),
            jurisdiction=app.get("jurisdiction", "State"),
            stage=app.get("stage", "Pre-Operation"),
            documents_required=docs_str,
            fees=app.get("fees"),
            validity=app.get("validity"),
            timeline=app.get("timeline"),
            application_url=app.get("application_url"),
            source_url=app.get("source_url"),
            source_type=app.get("source_type", "Official Government Source"),
            regulatory_evidence=ev_str,
            dependencies=deps_str,
            condition_trigger=app.get("condition_trigger"),
            last_verified=app.get("last_verified", "2026-03-01"),
            confidence=app.get("confidence", 0.95)
        )
        db.add(req)

    db.commit()

    return {
        "message": f"Approvals dynamically recalculated for '{business.name}'",
        "business_id": business.id,
        "discovery": discovery_res
    }


# ----------------------------------------------------------------------
# 4. GET /api/approvals/{enterprise_id}/required
# ----------------------------------------------------------------------
@router.get("/{enterprise_id}/required")
def get_required_approvals(enterprise_id: int, db: Session = Depends(get_db)):
    rows = db.query(ApprovalRequirement).filter(
        ApprovalRequirement.business_id == enterprise_id,
        ApprovalRequirement.approval_status == "REQUIRED"
    ).all()
    serialized = [serialize_requirement(r) for r in rows]
    return {
        "business_id": enterprise_id,
        "status": "REQUIRED",
        "count": len(serialized),
        "approvals": serialized
    }


# ----------------------------------------------------------------------
# 5. GET /api/approvals/{enterprise_id}/conditional
# ----------------------------------------------------------------------
@router.get("/{enterprise_id}/conditional")
def get_conditional_approvals(enterprise_id: int, db: Session = Depends(get_db)):
    rows = db.query(ApprovalRequirement).filter(
        ApprovalRequirement.business_id == enterprise_id,
        ApprovalRequirement.approval_status == "CONDITIONAL"
    ).all()
    serialized = [serialize_requirement(r) for r in rows]
    return {
        "business_id": enterprise_id,
        "status": "CONDITIONAL",
        "count": len(serialized),
        "approvals": serialized
    }


# ----------------------------------------------------------------------
# 6. GET /api/approvals/{enterprise_id}/verification
# ----------------------------------------------------------------------
@router.get("/{enterprise_id}/verification")
def get_verification_approvals(enterprise_id: int, db: Session = Depends(get_db)):
    rows = db.query(ApprovalRequirement).filter(
        ApprovalRequirement.business_id == enterprise_id,
        ApprovalRequirement.approval_status == "NEEDS_VERIFICATION"
    ).all()
    serialized = [serialize_requirement(r) for r in rows]
    return {
        "business_id": enterprise_id,
        "status": "NEEDS_VERIFICATION",
        "count": len(serialized),
        "approvals": serialized
    }


# ----------------------------------------------------------------------
# 7. GET /api/approvals/{enterprise_id}/roadmap
# ----------------------------------------------------------------------
@router.get("/{enterprise_id}/roadmap")
def get_enterprise_approval_roadmap(enterprise_id: int, db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.id == enterprise_id).first()
    if not business:
        raise HTTPException(404, "Business not found")

    requirements = db.query(ApprovalRequirement).filter(
        ApprovalRequirement.business_id == enterprise_id
    ).all()

    # Stage hierarchy
    stage_weights = {
        "Pre-Establishment": 1,
        "Land & Construction": 2,
        "Pre-Operation": 3,
        "Operation": 4,
        "Ongoing Compliance / Renewal": 5
    }

    serialized = [serialize_requirement(r) for r in requirements]
    serialized.sort(key=lambda x: (stage_weights.get(x.get("stage"), 3), 0 if x.get("status") == "REQUIRED" else 1))

    # Add step indexing and build stages
    stage_groups = {}
    for idx, item in enumerate(serialized, start=1):
        item["step"] = idx
        st = item.get("stage", "Pre-Operation")
        if st not in stage_groups:
            stage_groups[st] = []
        stage_groups[st].append(item)

    return {
        "business_id": business.id,
        "business_name": business.name,
        "total_steps": len(serialized),
        "roadmap": serialized,
        "stages": stage_groups,
        "disclaimer": "Sequential clearances organized by lifecycle stage based on statutory interdependencies."
    }


# ----------------------------------------------------------------------
# 8. GET /api/approvals/discover/{business_id} (Backwards Compatibility)
# ----------------------------------------------------------------------
@router.get("/discover/{business_id}")
def discover_business_approvals(business_id: int, db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(404, "Business not found")

    from app.routers.business import serialize
    biz_dict = serialize(business)

    # Run discovery
    discovery_res = approval_discovery_service.discover_approvals(biz_dict, db_session=db)

    # Sync to DB
    existing_reqs = db.query(ApprovalRequirement).filter(ApprovalRequirement.business_id == business_id).all()
    existing_names = {r.approval_name for r in existing_reqs}

    new_count = 0
    for app in discovery_res.get("approvals", []):
        if app["approval_name"] not in existing_names:
            docs_str = json.dumps(app.get("documents_required", []))
            deps_str = json.dumps(app.get("dependencies", []))
            ev_str = json.dumps(app.get("regulatory_evidence", []))

            req = ApprovalRequirement(
                business_id=business.id,
                approval_name=app["approval_name"],
                authority=app["authority"],
                category=app.get("category", "Other Regulatory Approvals"),
                description=app.get("description"),
                reason=app.get("reason"),
                priority=app.get("priority", "Medium"),
                status="Not Started",
                approval_status=app.get("approval_status", "REQUIRED"),
                jurisdiction=app.get("jurisdiction", "State"),
                stage=app.get("stage", "Pre-Operation"),
                documents_required=docs_str,
                fees=app.get("fees"),
                validity=app.get("validity"),
                timeline=app.get("timeline"),
                application_url=app.get("application_url"),
                source_url=app.get("source_url"),
                source_type=app.get("source_type", "Official Government Source"),
                regulatory_evidence=ev_str,
                dependencies=deps_str,
                condition_trigger=app.get("condition_trigger"),
                last_verified=app.get("last_verified", "2026-03-01"),
                confidence=app.get("confidence", 0.95)
            )
            db.add(req)
            new_count += 1

    if new_count > 0:
        db.commit()

    # Re-query all saved requirements
    all_reqs = db.query(ApprovalRequirement).filter(ApprovalRequirement.business_id == business_id).all()
    serialized_all = [serialize_requirement(r) for r in all_reqs]

    required_c = sum(1 for a in serialized_all if a["approval_status"] == "REQUIRED")
    conditional_c = sum(1 for a in serialized_all if a["approval_status"] == "CONDITIONAL")
    verification_c = sum(1 for a in serialized_all if a["approval_status"] == "NEEDS_VERIFICATION")

    return {
        "business_id": business.id,
        "business_name": business.name,
        "approval_count": len(serialized_all),
        "total_identified": len(serialized_all),
        "new_approval_count": new_count,
        "existing_approval_count": len(existing_reqs),
        "required_count": required_c,
        "conditional_count": conditional_c,
        "verification_count": verification_c,
        "counts": {
            "total": len(serialized_all),
            "required": required_c,
            "conditional": conditional_c,
            "needs_verification": verification_c
        },
        "disclaimer": "Applicable approvals identified based on the enterprise information and available regulatory sources.",
        "approvals": serialized_all,
        "message": f"Discovery complete: {len(serialized_all)} statutory approvals identified."
    }


# ----------------------------------------------------------------------
# 9. GET /api/approvals/{enterprise_id}
# ----------------------------------------------------------------------
@router.get("/{enterprise_id}")
def get_enterprise_approvals(
    enterprise_id: int,
    status: Optional[str] = None,
    category: Optional[str] = None,
    stage: Optional[str] = None,
    db: Session = Depends(get_db)
):
    business = db.query(Business).filter(Business.id == enterprise_id).first()
    if not business:
        raise HTTPException(404, "Business not found")

    query = db.query(ApprovalRequirement).filter(ApprovalRequirement.business_id == enterprise_id)

    if status:
        query = query.filter(ApprovalRequirement.approval_status == status.upper())
    if category:
        query = query.filter(ApprovalRequirement.category == category)
    if stage:
        query = query.filter(ApprovalRequirement.stage == stage)

    rows = query.all()
    serialized = [serialize_requirement(r) for r in rows]

    # If no requirements saved yet, run discovery and save
    if not serialized and not status and not category and not stage:
        return discover_business_approvals(enterprise_id, db)

    all_rows = db.query(ApprovalRequirement).filter(ApprovalRequirement.business_id == enterprise_id).all()
    req_c = sum(1 for a in all_rows if a.approval_status == "REQUIRED")
    cond_c = sum(1 for a in all_rows if a.approval_status == "CONDITIONAL")
    ver_c = sum(1 for a in all_rows if a.approval_status == "NEEDS_VERIFICATION")

    return {
        "business_id": enterprise_id,
        "business_name": business.name,
        "total_identified": len(all_rows),
        "filtered_count": len(serialized),
        "required_count": req_c,
        "conditional_count": cond_c,
        "verification_count": ver_c,
        "disclaimer": "Applicable approvals identified based on the enterprise information and available regulatory sources.",
        "approvals": serialized
    }