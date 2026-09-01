from app.models.business import Business


def discover_approvals(business: Business):
    approvals = []

    industry = business.industry.lower()
    business_type = business.business_type.lower()

    # Manufacturing rule
    if "manufacturing" in industry:
        approvals.append({
            "name": "Factory Licence",
            "authority": "Factories and Labour Department",
            "category": "Factory",
            "description": "Approval related to operation of a manufacturing establishment.",
            "reason": "The business operates a manufacturing facility.",
            "priority": "High"
        })

    # Pollution rule
    if business.pollution_category:
        approvals.append({
            "name": "Pollution Control Consent",
            "authority": "State Pollution Control Authority",
            "category": "Environment",
            "description": "Environmental consent based on the nature and category of the activity.",
            "reason": (
                f"The business has a declared pollution category: "
                f"{business.pollution_category}."
            ),
            "priority": "High"
        })

    # Physical premises rule
    if business.building_area and business.building_area > 0:
        approvals.append({
            "name": "Building Approval",
            "authority": "Local Planning Authority",
            "category": "Building",
            "description": "Approval associated with the business premises.",
            "reason": "The business operates from a physical building.",
            "priority": "Medium"
        })

    # Fire safety rule
    if business.building_area and business.building_area > 0:
        approvals.append({
            "name": "Fire Safety Approval",
            "authority": "Fire and Rescue Department",
            "category": "Safety",
            "description": "Fire safety compliance for applicable premises.",
            "reason": "The business operates from a physical premises.",
            "priority": "High"
        })

    # Food industry rule
    if "food" in industry:
        approvals.append({
            "name": "Food Business Approval",
            "authority": "Food Safety Authority",
            "category": "Food Safety",
            "description": "Food-related regulatory approval for applicable businesses.",
            "reason": "The business operates in the food sector.",
            "priority": "High"
        })

    # Company/business registration rule
    if "private" in business_type or "company" in business_type:
        approvals.append({
            "name": "Business Registration",
            "authority": "Corporate/Business Registration Authority",
            "category": "Business",
            "description": "Registration associated with the legal form of the business.",
            "reason": "The business is represented as a company-type entity.",
            "priority": "High"
        })

    return approvals