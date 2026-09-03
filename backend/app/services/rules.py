from app.models.business import Business


def discover_approvals(business: Business):
    approvals = []

    industry = (business.industry or "").lower()
    business_type = (business.business_type or "").lower()

    # Manufacturing / Industrial processing rule
    if any(k in industry for k in ["manufacturing", "chemical", "petrochemical", "textile", "pharma", "automotive", "engineering", "production", "processing"]):
        approvals.append({
            "name": "Factory Licence",
            "authority": "Factories and Labour Department",
            "category": "Factory",
            "description": "Approval related to operation of a manufacturing establishment.",
            "reason": f"The business operates an industrial activity ({business.industry}).",
            "priority": "High"
        })

    # Pollution control consent rule
    if business.pollution_category or any(k in industry for k in ["chemical", "manufacturing", "textile", "energy", "processing"]):
        category = business.pollution_category or "Orange"
        approvals.append({
            "name": "Pollution Control Consent",
            "authority": "State Pollution Control Authority",
            "category": "Environment",
            "description": "Environmental consent based on the nature and category of the activity.",
            "reason": (
                f"The business operates an activity with declared pollution category: "
                f"{category}."
            ),
            "priority": "High"
        })

    # Physical premises rule
    if (business.building_area and business.building_area > 0) or business.location:
        approvals.append({
            "name": "Building Approval",
            "authority": "Local Planning Authority",
            "category": "Building",
            "description": "Approval associated with the business premises.",
            "reason": "The business operates from a physical industrial facility/building.",
            "priority": "Medium"
        })

    # Fire safety rule
    if (business.building_area and business.building_area > 0) or business.employees >= 10:
        approvals.append({
            "name": "Fire Safety Approval",
            "authority": "Fire and Rescue Department",
            "category": "Safety",
            "description": "Fire safety compliance for applicable premises.",
            "reason": "The business operates from a physical premises with workforce safety mandates.",
            "priority": "High"
        })

    # Food industry rule
    if "food" in industry or "beverage" in industry:
        approvals.append({
            "name": "Food Business Approval",
            "authority": "Food Safety Authority",
            "category": "Food Safety",
            "description": "Food-related regulatory approval for applicable businesses.",
            "reason": "The business operates in the food sector.",
            "priority": "High"
        })

    # Company / Business registration rule
    if any(k in business_type for k in ["private", "company", "partnership", "llp", "limited", "proprietorship"]) or business_type:
        approvals.append({
            "name": "Business Registration",
            "authority": "Corporate/Business Registration Authority",
            "category": "Business",
            "description": "Registration associated with the legal form of the business.",
            "reason": "The business is represented as an incorporated legal entity.",
            "priority": "High"
        })

    return approvals