"""
Dynamic Rule Engine for Statutory Approval Applicability.
Evaluates machine-readable statutory conditions against enterprise characteristics
to compute applicability, status (REQUIRED, CONDITIONAL, NEEDS_VERIFICATION),
and enterprise-tailored trigger explanations.
"""

import json
from typing import Any, Dict, List, Tuple


class RuleEngine:
    """Evaluates business profiles against statutory condition predicates."""

    @staticmethod
    def evaluate_approval(business_data: Dict[str, Any], approval: Dict[str, Any]) -> Tuple[bool, str, str, str]:
        """
        Evaluate a single approval against enterprise data.
        Returns:
            (is_applicable: bool, status: str, reason: str, condition_trigger: str)
        """
        conditions = approval.get("conditions")
        if isinstance(conditions, str):
            try:
                conditions = json.loads(conditions)
            except Exception:
                conditions = {}
        elif not isinstance(conditions, dict):
            conditions = {}

        # If no conditions or always is True
        if not conditions or conditions.get("always"):
            reason = f"Statutory requirement mandatory for all registered commercial enterprises in {business_data.get('state', 'Tamil Nadu')}."
            return True, "REQUIRED", reason, "Mandatory General Requirement"

        matched_conditions = []
        is_conditional = False
        needs_verification = False

        # 1. State / Jurisdiction Check
        approval_state = approval.get("state", "All")
        biz_state = business_data.get("state", "Tamil Nadu") or "Tamil Nadu"
        if approval_state not in ["All", "Central"] and approval_state.lower() != biz_state.lower():
            return False, "NOT_APPLICABLE", "Jurisdiction does not match enterprise state.", "State Mismatch"

        # 2. Sector / Sub-sector Check
        if "sectors" in conditions:
            allowed_sectors = [s.lower() for s in conditions["sectors"]]
            biz_sector = (business_data.get("sector") or business_data.get("industry") or "").lower()
            if not any(s in biz_sector or biz_sector in s for s in allowed_sectors):
                return False, "NOT_APPLICABLE", f"Specific to {', '.join(conditions['sectors'])} sector.", "Sector Mismatch"
            matched_conditions.append(f"Sector: {business_data.get('industry') or business_data.get('sector')}")

        if "sub_sectors" in conditions:
            allowed_sub = [s.lower() for s in conditions["sub_sectors"]]
            biz_sub = (business_data.get("sub_sector") or "").lower()
            if biz_sub and not any(s in biz_sub for s in allowed_sub):
                return False, "NOT_APPLICABLE", f"Specific to {', '.join(conditions['sub_sectors'])} sub-sector.", "Sub-sector Mismatch"
            elif not biz_sub:
                needs_verification = True
                matched_conditions.append("Sub-sector verification required")

        # 3. Legal Structure / Business Type
        if "legal_forms" in conditions:
            allowed_forms = [f.lower() for f in conditions["legal_forms"]]
            biz_form = (business_data.get("legal_form") or business_data.get("business_type") or "").lower()
            if not any(f in biz_form for f in allowed_forms):
                return False, "NOT_APPLICABLE", f"Applicable only for {', '.join(conditions['legal_forms'])} entities.", "Legal Structure Conflict"
            matched_conditions.append(f"Legal Form: {business_data.get('business_type') or business_data.get('legal_form')}")

        # 4. Factory / Plant Operation
        if "factory" in conditions:
            req_factory = conditions["factory"]
            biz_factory = business_data.get("factory")
            # If boolean or truthy string
            if isinstance(biz_factory, str):
                biz_factory = biz_factory.lower() in ["true", "yes", "1"]
            elif biz_factory is None:
                biz_factory = False

            if req_factory and not biz_factory:
                return False, "NOT_APPLICABLE", "Applicable only to enterprises operating a manufacturing factory/plant.", "Factory=False"
            matched_conditions.append(f"Factory: {'Yes' if biz_factory else 'No'}")

        # 5. Workforce / Employee Thresholds
        biz_employees = int(business_data.get("employees") or 0)
        if "employees_gte" in conditions:
            threshold = conditions["employees_gte"]
            if biz_employees < threshold:
                return False, "NOT_APPLICABLE", f"Threshold requires minimum {threshold} employees (enterprise has {biz_employees}).", f"Employees ({biz_employees}) < {threshold}"
            matched_conditions.append(f"Workforce: {biz_employees} Personnel (>= {threshold})")

        # 6. Pollution Category Check
        if "pollution_categories" in conditions:
            allowed_cats = [c.lower() for c in conditions["pollution_categories"]]
            biz_cat = (business_data.get("environment_category") or business_data.get("pollution_category") or "").lower()
            if not biz_cat or biz_cat in ["exempt", "exempted", "not applicable"]:
                return False, "NOT_APPLICABLE", "Exempt from environmental consent schedule.", "Pollution Category Exempt"
            if not any(c in biz_cat for c in allowed_cats):
                return False, "NOT_APPLICABLE", f"Applies to {', '.join(conditions['pollution_categories'])} category industries.", f"Category Mismatch ({biz_cat})"
            matched_conditions.append(f"Pollution Category: {business_data.get('pollution_category') or business_data.get('environment_category')}")

        # 7. Hazardous Materials Check
        if "hazardous_materials" in conditions:
            req_haz = conditions["hazardous_materials"]
            biz_haz = business_data.get("hazardous_materials")
            if isinstance(biz_haz, str):
                biz_haz = biz_haz.lower() in ["true", "yes", "1"]
            if req_haz and not biz_haz:
                return False, "NOT_APPLICABLE", "Applies when hazardous chemicals, solvents, or toxic materials are handled.", "Hazardous=False"
            matched_conditions.append(f"Hazardous Materials: {'Yes' if biz_haz else 'No'}")

        # 8. Boiler / Pressure Vessel Check
        if "boiler" in conditions:
            req_boiler = conditions["boiler"]
            biz_boiler = business_data.get("boiler")
            if isinstance(biz_boiler, str):
                biz_boiler = biz_boiler.lower() in ["true", "yes", "1"]
            if req_boiler and not biz_boiler:
                return False, "NOT_APPLICABLE", "Applies when steam boilers or high-pressure vessels are installed.", "Boiler=False"
            matched_conditions.append(f"Boiler Installed: {'Yes' if biz_boiler else 'No'}")

        # 9. Import / Export Check
        if "import_export" in conditions:
            req_ie = conditions["import_export"]
            biz_ie = business_data.get("import_export")
            if isinstance(biz_ie, str):
                biz_ie = biz_ie.lower() in ["true", "yes", "1"]
            if req_ie and not biz_ie:
                return False, "NOT_APPLICABLE", "Applies only to businesses engaging in international import/export trade.", "ImportExport=False"
            matched_conditions.append(f"Import/Export Operations: {'Yes' if biz_ie else 'No'}")

        # 10. Power Requirement Threshold
        if "power_gte" in conditions:
            threshold = conditions["power_gte"]
            power_val = business_data.get("power_requirement") or business_data.get("electricity_requirement")
            numeric_power = 0
            if power_val:
                try:
                    # Parse numeric part from strings like "150 kVA", "100 kW", 150
                    numeric_power = float(str(power_val).split()[0].replace(",", ""))
                except Exception:
                    numeric_power = 0
            if numeric_power > 0 and numeric_power < threshold:
                return False, "NOT_APPLICABLE", f"Requires high-tension/high-load installation >= {threshold} kW/kVA.", f"Power ({numeric_power}) < {threshold}"
            elif numeric_power == 0:
                is_conditional = True
                matched_conditions.append(f"Subject to electrical capacity verification (>= {threshold} kW)")

        # 11. Investment Limits
        biz_inv = float(business_data.get("investment_amount") or business_data.get("investment") or 0)
        if "investment_max" in conditions:
            max_inv = conditions["investment_max"]
            if biz_inv > max_inv:
                return False, "NOT_APPLICABLE", f"Investment exceeds maximum threshold (₹{max_inv:,}).", "Investment Exceeded"
            matched_conditions.append(f"Investment within threshold: ₹{biz_inv:,.0f}")

        # 12. Land Type Specificity
        if "land_types" in conditions:
            allowed_land = [l.lower() for l in conditions["land_types"]]
            biz_land = (business_data.get("land_type") or "").lower()
            if biz_land and not any(l in biz_land for l in allowed_land):
                return False, "NOT_APPLICABLE", f"Specific to {', '.join(conditions['land_types'])} land parcels.", "Land Type Mismatch"
            elif not biz_land:
                is_conditional = True
                matched_conditions.append("Applicable if located within Industrial Estate / SIPCOT")

        # Determine Final Status
        if needs_verification:
            final_status = "NEEDS_VERIFICATION"
        elif is_conditional or not approval.get("mandatory", True):
            final_status = "CONDITIONAL"
        else:
            final_status = "REQUIRED"

        # Construct Rich Contextual Reason
        approval_name = approval.get("approval_name", "Statutory Clearance")
        authority = approval.get("authority", "Statutory Department")
        location = business_data.get("district") or business_data.get("location") or business_data.get("state", "Tamil Nadu")

        condition_summary = "; ".join(matched_conditions) if matched_conditions else "Enterprise business characteristics match regulatory criteria"
        reason = (
            f"Statutory requirement administered by {authority}. "
            f"Triggered for '{business_data.get('enterprise_name') or business_data.get('name', 'Enterprise')}' "
            f"based on: {condition_summary} in {location}."
        )

        return True, final_status, reason, condition_summary

    @classmethod
    def evaluate_catalog(cls, business_data: Dict[str, Any], catalog: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Evaluate full catalog of approvals against enterprise profile."""
        applicable_approvals = []
        for item in catalog:
            is_app, status, reason, trigger = cls.evaluate_approval(business_data, item)
            if is_app:
                record = dict(item)
                record["approval_status"] = status
                record["status"] = status
                record["reason"] = reason
                record["condition_trigger"] = trigger
                record["confidence"] = 0.95 if status == "REQUIRED" else (0.80 if status == "CONDITIONAL" else 0.65)
                applicable_approvals.append(record)

        return applicable_approvals
