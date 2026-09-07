from app.models.business import Business


def get_business_context(business: Business):

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
        "electricity_requirement": business.electricity_requirement,
    }


def build_regulatory_query(business: Business):

    context = get_business_context(business)

    query_parts = [
        "required approvals",
        "licenses",
        "permits",
        "registrations",
        "clearances",
        "compliance requirements",
        f"business name {context['name']}",
        f"industry {context['industry'] or ''}",
        f"business type {context['business_type'] or ''}",
        f"location {context['location'] or ''}",
        f"production type {context['production_type'] or ''}",
        f"pollution category {context['pollution_category'] or ''}",
        f"employees {context['employees'] or ''}",
        f"building area {context['building_area'] or ''}",
        f"water requirement {context['water_requirement'] or ''}",
        f"electricity requirement {context['electricity_requirement'] or ''}",
    ]

    return " ".join(query_parts)


def discover_rule_based_approvals(business: Business):

    approvals = []

    industry = (
        business.industry or ""
    ).lower()

    business_type = (
        business.business_type or ""
    ).lower()

    if any(
        keyword in industry
        for keyword in [
            "manufacturing",
            "chemical",
            "petrochemical",
            "textile",
            "pharma",
            "automotive",
            "engineering",
            "production",
            "processing"
        ]
    ):

        approvals.append({
            "name": "Factory Licence",
            "authority": "Factories and Labour Department",
            "category": "Factory",
            "description": (
                "Approval related to operation "
                "of a manufacturing establishment."
            ),
            "reason": (
                f"The business operates an "
                f"industrial activity ({business.industry})."
            ),
            "priority": "High"
        })

    if (
        business.pollution_category
        or any(
            keyword in industry
            for keyword in [
                "chemical",
                "manufacturing",
                "textile",
                "energy",
                "processing"
            ]
        )
    ):

        category = (
            business.pollution_category
            or "Not specified"
        )

        approvals.append({
            "name": "Pollution Control Consent",
            "authority": "State Pollution Control Authority",
            "category": "Environment",
            "description": (
                "Environmental consent based on "
                "the nature and category of the activity."
            ),
            "reason": (
                "The business operates an activity "
                f"with declared pollution category: {category}."
            ),
            "priority": "High"
        })

    if (
        (
            business.building_area
            and business.building_area > 0
        )
        or business.location
    ):

        approvals.append({
            "name": "Building Approval",
            "authority": "Local Planning Authority",
            "category": "Building",
            "description": (
                "Approval associated with "
                "the business premises."
            ),
            "reason": (
                "The business operates from a "
                "physical industrial facility/building."
            ),
            "priority": "Medium"
        })

    if (
        (
            business.building_area
            and business.building_area > 0
        )
        or (
            business.employees
            and business.employees >= 10
        )
    ):

        approvals.append({
            "name": "Fire Safety Approval",
            "authority": "Fire and Rescue Department",
            "category": "Safety",
            "description": (
                "Fire safety compliance "
                "for applicable premises."
            ),
            "reason": (
                "The business operates from a physical "
                "premises with workforce safety mandates."
            ),
            "priority": "High"
        })

    if (
        "food" in industry
        or "beverage" in industry
    ):

        approvals.append({
            "name": "Food Business Approval",
            "authority": "Food Safety Authority",
            "category": "Food Safety",
            "description": (
                "Food-related regulatory approval "
                "for applicable businesses."
            ),
            "reason": (
                "The business operates in the food sector."
            ),
            "priority": "High"
        })

    if (
        any(
            keyword in business_type
            for keyword in [
                "private",
                "company",
                "partnership",
                "llp",
                "limited",
                "proprietorship"
            ]
        )
        or business_type
    ):

        approvals.append({
            "name": "Business Registration",
            "authority": (
                "Corporate/Business Registration Authority"
            ),
            "category": "Business",
            "description": (
                "Registration associated with "
                "the legal form of the business."
            ),
            "reason": (
                "The business is represented as "
                "an established legal entity."
            ),
            "priority": "High"
        })

    return approvals