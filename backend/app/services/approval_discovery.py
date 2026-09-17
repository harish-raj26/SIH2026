"""
Dynamic Approval Discovery Engine.
Orchestrates:
1. Rule Engine evaluation of enterprise parameters against statutory catalog.
2. Regulatory RAG for authoritative evidence grounding.
3. Gemini AI reasoning (if enabled) for nuanced applicability validation and tailored explanations.
4. Deduplication, dependency mapping, and metric breakdown.
"""

import json
import os
import re
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

from app.services.regulatory_catalog import STATUTORY_APPROVALS_CATALOG
from app.services.rule_engine import RuleEngine
from app.rag.service import rag_service

try:
    from google import genai
except ImportError:
    genai = None

load_dotenv()


class ApprovalDiscoveryService:

    def __init__(self):
        self.ai_mode = os.getenv("AI_MODE", "mock").lower()
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.client = None
        self._init_client()

    def _init_client(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key and genai is not None:
            try:
                self.client = genai.Client(api_key=api_key)
            except Exception:
                self.client = None

    def discover_approvals(
        self,
        business_context: Dict[str, Any],
        regulatory_evidence: Optional[List[Dict[str, Any]]] = None,
        db_session=None
    ) -> Dict[str, Any]:
        """
        Dynamically discover applicable statutory approvals for an enterprise.
        """
        self.ai_mode = os.getenv("AI_MODE", self.ai_mode).lower()
        if not self.client:
            self._init_client()

        # Step 1: Normalize Business Context
        normalized_biz = self._normalize_business_context(business_context)

        # Step 2: Load Statutory Catalog (from DB or default authoritative catalog)
        catalog = self._get_catalog(db_session)

        # Step 3: Run Rule Engine
        candidate_approvals = RuleEngine.evaluate_catalog(normalized_biz, catalog)

        # Step 4: Enrich with Regulatory RAG Evidence
        enriched_approvals = []
        for app in candidate_approvals:
            app_record = dict(app)
            # Retrieve specific RAG citations
            query = f"{app_record['approval_name']} {app_record.get('category', '')} {app_record.get('authority', '')} {normalized_biz.get('industry', '')}"
            evidence_chunks = rag_service.search(query, top_k=2, min_score=0.02)
            if not evidence_chunks and regulatory_evidence:
                evidence_chunks = regulatory_evidence[:2]
            app_record["regulatory_evidence"] = evidence_chunks
            enriched_approvals.append(app_record)

        # Step 5: If Gemini AI is active, run grounded validation & refinement
        if self.ai_mode == "gemini" and self.client:
            try:
                enriched_approvals = self._refine_with_gemini(normalized_biz, enriched_approvals)
            except Exception as e:
                print(f"[ApprovalDiscovery] Gemini AI refinement note: {e}")

        # Step 6: Deduplicate and resolve dependencies
        final_approvals = self._deduplicate_and_structure(enriched_approvals)

        # Step 7: Calculate Breakdown Metrics
        required_count = sum(1 for a in final_approvals if a.get("approval_status") == "REQUIRED" or a.get("status") == "REQUIRED")
        conditional_count = sum(1 for a in final_approvals if a.get("approval_status") == "CONDITIONAL" or a.get("status") == "CONDITIONAL")
        verification_count = sum(1 for a in final_approvals if a.get("approval_status") == "NEEDS_VERIFICATION" or a.get("status") == "NEEDS_VERIFICATION")
        total_count = len(final_approvals)

        # Step 8: Group by Lifecycle Stages
        lifecycle_stages = self._group_by_stages(final_approvals)

        return {
            "enterprise_name": normalized_biz.get("enterprise_name") or normalized_biz.get("name"),
            "total_identified": total_count,
            "approval_count": total_count,
            "required_count": required_count,
            "conditional_count": conditional_count,
            "verification_count": verification_count,
            "counts": {
                "total": total_count,
                "required": required_count,
                "conditional": conditional_count,
                "needs_verification": verification_count
            },
            "disclaimer": "Applicable approvals identified based on the enterprise information and available regulatory sources.",
            "approvals": final_approvals,
            "lifecycle_stages": lifecycle_stages,
            "mode": self.ai_mode,
            "sources_indexed": 12
        }

    def _normalize_business_context(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Map legacy and modern key names into standard profile dictionary."""
        name = raw.get("enterprise_name") or raw.get("name") or "Enterprise"
        sector = raw.get("sector") or raw.get("industry") or "Manufacturing"
        sub_sector = raw.get("sub_sector") or "General"
        legal_form = raw.get("legal_form") or raw.get("business_type") or "Private Limited Company"
        state = raw.get("state") or "Tamil Nadu"
        district = raw.get("district") or raw.get("location") or "Coimbatore"

        # Factory boolean check
        factory = raw.get("factory")
        if isinstance(factory, str):
            factory = factory.lower() in ["true", "yes", "1"]
        elif factory is None:
            # Infer from land area or manufacturing
            factory = bool(raw.get("land_area") or raw.get("building_area") or "manufacturing" in sector.lower())

        hazardous = raw.get("hazardous_materials")
        if isinstance(hazardous, str):
            hazardous = hazardous.lower() in ["true", "yes", "1"]

        boiler = raw.get("boiler")
        if isinstance(boiler, str):
            boiler = boiler.lower() in ["true", "yes", "1"]

        import_export = raw.get("import_export")
        if isinstance(import_export, str):
            import_export = import_export.lower() in ["true", "yes", "1"]

        investment = raw.get("investment_amount") or raw.get("investment") or 0.0
        try:
            investment = float(investment)
        except Exception:
            investment = 0.0

        employees = raw.get("employees") or 0
        try:
            employees = int(employees)
        except Exception:
            employees = 0

        pollution_category = raw.get("environment_category") or raw.get("pollution_category") or "Orange"

        return {
            "enterprise_name": name,
            "name": name,
            "sector": sector,
            "industry": sector,
            "sub_sector": sub_sector,
            "legal_form": legal_form,
            "business_type": legal_form,
            "state": state,
            "district": district,
            "location": raw.get("location") or f"{district}, {state}",
            "business_activity": raw.get("business_activity") or "Manufacturing",
            "products": raw.get("products") or [],
            "investment_amount": investment,
            "investment": investment,
            "employees": employees,
            "factory": bool(factory),
            "production_capacity": raw.get("production_capacity") or "",
            "land_type": raw.get("land_type") or "Industrial",
            "land_area": raw.get("land_area"),
            "building_area": raw.get("building_area"),
            "hazardous_materials": bool(hazardous),
            "hazardous_details": raw.get("hazardous_details") or "",
            "environment_category": pollution_category,
            "pollution_category": pollution_category,
            "water_usage": raw.get("water_usage") or raw.get("water_requirement") or "",
            "waste_generation": raw.get("waste_generation") or "",
            "power_requirement": raw.get("power_requirement") or raw.get("electricity_requirement") or "",
            "import_export": bool(import_export),
            "boiler": bool(boiler),
            "boiler_details": raw.get("boiler_details") or ""
        }

    def _get_catalog(self, db_session) -> List[Dict[str, Any]]:
        """Fetch approvals from database or fallback to static catalog."""
        if db_session:
            from app.models.approval import Approval
            try:
                rows = db_session.query(Approval).filter(Approval.active == True).all()
                if rows:
                    results = []
                    for r in rows:
                        conditions = r.conditions
                        if isinstance(conditions, str):
                            try:
                                conditions = json.loads(conditions)
                            except Exception:
                                conditions = {}
                        docs = r.documents_required
                        if isinstance(docs, str):
                            try:
                                docs = json.loads(docs)
                            except Exception:
                                docs = []
                        deps = r.dependencies
                        if isinstance(deps, str):
                            try:
                                deps = json.loads(deps)
                            except Exception:
                                deps = []
                        results.append({
                            "id": r.id,
                            "approval_name": r.approval_name,
                            "name": r.approval_name,
                            "description": r.description,
                            "authority": r.authority,
                            "jurisdiction": r.jurisdiction or "State",
                            "state": r.state or "Tamil Nadu",
                            "district": r.district or "All",
                            "sector": r.sector or "All",
                            "sub_sector": r.sub_sector or "All",
                            "category": r.category,
                            "level": r.level or "State",
                            "stage": r.stage or "Pre-Operation",
                            "mandatory": r.mandatory,
                            "conditions": conditions,
                            "documents_required": docs,
                            "fees": r.fees,
                            "validity": r.validity,
                            "timeline": r.timeline,
                            "application_url": r.application_url,
                            "source_url": r.source_url,
                            "source_type": r.source_type or "Official Government Source",
                            "dependencies": deps,
                            "priority": r.priority or "Medium",
                            "last_verified": r.last_verified or "2026-03-01",
                            "active": r.active
                        })
                    return results
            except Exception as e:
                print(f"[ApprovalDiscovery] DB catalog query fallback: {e}")

        return STATUTORY_APPROVALS_CATALOG

    def _refine_with_gemini(self, biz: Dict[str, Any], candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Use Gemini to refine contextual explanations and verify edge cases without inventing approvals."""
        simplified_candidates = [
            {
                "approval_name": c["approval_name"],
                "authority": c.get("authority"),
                "category": c.get("category"),
                "status": c.get("approval_status"),
                "current_reason": c.get("reason")
            }
            for c in candidates
        ]

        prompt = f"""You are Byte Forge's statutory compliance applicability verifier.
Verify and refine reasons for the candidate approvals for this enterprise.

ENTERPRISE PROFILE:
{json.dumps(biz, indent=2)}

CANDIDATE APPROVALS:
{json.dumps(simplified_candidates, indent=2)}

STRICT RULES:
1. ONLY refine the given candidate approvals. Do NOT invent new approvals or laws.
2. For each approval, provide a concise, tailored 1-2 sentence explanation of why it applies to THIS business.
3. Confirm whether status is REQUIRED, CONDITIONAL, or NEEDS_VERIFICATION.
4. Return strictly a JSON array with objects: {{"approval_name": "...", "status": "...", "refined_reason": "..."}}."""

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )

        response_text = (getattr(response, "text", "") or "").strip()
        if response_text.startswith("```"):
            response_text = re.sub(r"^```(?:json)?\s*", "", response_text, flags=re.IGNORECASE)
            response_text = re.sub(r"\s*```$", "", response_text)

        refinements = json.loads(response_text)
        if isinstance(refinements, list):
            ref_map = {r.get("approval_name"): r for r in refinements if isinstance(r, dict)}
            for c in candidates:
                if c["approval_name"] in ref_map:
                    ref = ref_map[c["approval_name"]]
                    if ref.get("refined_reason"):
                        c["reason"] = ref["refined_reason"]
                    if ref.get("status") in ["REQUIRED", "CONDITIONAL", "NEEDS_VERIFICATION"]:
                        c["approval_status"] = ref["status"]
                        c["status"] = ref["status"]

        return candidates

    def _deduplicate_and_structure(self, approvals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate approvals by name and authority, normalizing fields."""
        seen = set()
        deduped = []

        for idx, app in enumerate(approvals, start=1):
            name = (app.get("approval_name") or app.get("name") or "").strip()
            if not name:
                continue

            norm_key = (name.lower().replace("-", " ").replace("_", " "), (app.get("authority") or "").lower())
            if norm_key in seen:
                continue
            seen.add(norm_key)

            docs = app.get("documents_required", [])
            if isinstance(docs, str):
                try:
                    docs = json.loads(docs)
                except Exception:
                    docs = [docs]

            deps = app.get("dependencies", [])
            if isinstance(deps, str):
                try:
                    deps = json.loads(deps)
                except Exception:
                    deps = []

            deduped.append({
                "id": app.get("id") or idx,
                "approval_id": app.get("id") or idx,
                "approval_name": name,
                "name": name,
                "authority": app.get("authority", "Statutory Department"),
                "jurisdiction": app.get("jurisdiction", "State"),
                "category": app.get("category", "Other Regulatory Approvals"),
                "stage": app.get("stage", "Pre-Operation"),
                "approval_status": app.get("approval_status") or app.get("status", "REQUIRED"),
                "status": app.get("approval_status") or app.get("status", "REQUIRED"),
                "priority": app.get("priority", "Medium"),
                "reason": app.get("reason", "Statutory regulatory requirement based on enterprise parameters."),
                "documents_required": docs,
                "fees": app.get("fees") or "Government prescribed schedule fee",
                "validity": app.get("validity") or "1 to 5 Years / Renewable",
                "timeline": app.get("timeline") or "15 to 30 working days",
                "application_url": app.get("application_url") or "https://tnswp.com/",
                "source_url": app.get("source_url") or "https://www.nsws.gov.in/portal/approvals",
                "source_type": app.get("source_type") or "National Single Window System (NSWS)",
                "dependencies": deps,
                "regulatory_evidence": app.get("regulatory_evidence", []),
                "condition_trigger": app.get("condition_trigger", "Regulatory Criteria Match"),
                "last_verified": app.get("last_verified", "2026-03-01"),
                "confidence": app.get("confidence", 0.95)
            })

        return deduped

    def _group_by_stages(self, approvals: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Organize approvals into the 5 standard lifecycle stages."""
        stage_names = [
            "Pre-Establishment",
            "Land & Construction",
            "Pre-Operation",
            "Operation",
            "Ongoing Compliance / Renewal"
        ]
        grouped = {s: [] for s in stage_names}

        for app in approvals:
            stage = app.get("stage") or "Pre-Operation"
            if stage in grouped:
                grouped[stage].append(app)
            else:
                grouped["Pre-Operation"].append(app)

        return grouped


approval_discovery_service = ApprovalDiscoveryService()