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

    context = get_business_context(
        business
    )

    industry = (
        context["industry"]
        or ""
    )

    business_type = (
        context["business_type"]
        or ""
    )

    production_type = (
        context["production_type"]
        or ""
    )

    location = (
        context["location"]
        or ""
    )

    query_parts = [

        "required approvals",
        "licenses",
        "permits",
        "registrations",
        "clearances",
        "authorizations",
        "permissions",
        "certificates",
        "consents",
        "compliance requirements",

        f"business name {context['name'] or ''}",

        f"industry {industry}",

        f"business type {business_type}",

        f"location {location}",

        f"production type {production_type}",

        f"pollution category "
        f"{context['pollution_category'] or ''}",

        f"employees "
        f"{context['employees'] or ''}",

        f"building area "
        f"{context['building_area'] or ''}",

        f"water requirement "
        f"{context['water_requirement'] or ''}",

        f"electricity requirement "
        f"{context['electricity_requirement'] or ''}",
    ]

    domain_queries = [

        f"""
        {industry}
        sector specific regulatory requirements
        industry specific approvals licences permits
        product registration authorization
        manufacturing processing permissions
        """,

        f"""
        {industry}
        manufacturing production processing
        factory establishment
        industrial licence registration
        operational approvals
        """,

        f"""
        {industry}
        product licence
        product registration
        product approval
        product authorization
        """,

        f"""
        {industry}
        storage handling
        warehouse transportation
        storage permission
        handling authorization
        transport permit
        """,

        f"""
        {industry}
        environmental pollution
        wastewater water waste
        environmental clearance
        pollution consent
        waste authorization
        """,

        f"""
        {industry}
        building premises
        fire safety
        electrical safety
        occupancy
        facility approvals
        """,

        f"""
        {industry}
        workers employees labour
        workplace safety
        employment registration
        labour compliance
        """,

        f"""
        {industry}
        packaging labeling
        product labeling
        packaging registration
        consumer product requirements
        """
    ]

    query = " ".join(
        query_parts
    )

    query += " ".join(
        domain_queries
    )

    return query


def discover_rule_based_approvals(
    business: Business
):

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

            "name":
                "Factory Licence",

            "authority":
                "Factories and Labour Department",

            "category":
                "Factory",

            "description":
                (
                    "Approval related to operation "
                    "of a manufacturing establishment."
                ),

            "reason":
                (
                    f"The business operates an "
                    f"industrial activity "
                    f"({business.industry})."
                ),

            "priority":
                "High"
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

            "name":
                "Pollution Control Consent",

            "authority":
                "State Pollution Control Authority",

            "category":
                "Environment",

            "description":
                (
                    "Environmental consent based on "
                    "the nature and category "
                    "of the activity."
                ),

            "reason":
                (
                    "The business operates an "
                    "activity with declared "
                    f"pollution category: {category}."
                ),

            "priority":
                "High"
        })

    if (
        (
            business.building_area
            and business.building_area > 0
        )
        or business.location
    ):

        approvals.append({

            "name":
                "Building Approval",

            "authority":
                "Local Planning Authority",

            "category":
                "Building",

            "description":
                (
                    "Approval associated with "
                    "the business premises."
                ),

            "reason":
                (
                    "The business operates from "
                    "a physical industrial "
                    "facility/building."
                ),

            "priority":
                "Medium"
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

            "name":
                "Fire Safety Approval",

            "authority":
                "Fire and Rescue Department",

            "category":
                "Safety",

            "description":
                (
                    "Fire safety compliance "
                    "for applicable premises."
                ),

            "reason":
                (
                    "The business operates from "
                    "a physical premises with "
                    "workforce safety mandates."
                ),

            "priority":
                "High"
        })

    if (
        "food" in industry
        or "beverage" in industry
    ):

        approvals.append({

            "name":
                "Food Business Approval",

            "authority":
                "Food Safety Authority",

            "category":
                "Food Safety",

            "description":
                (
                    "Food-related regulatory "
                    "approval for applicable "
                    "businesses."
                ),

            "reason":
                (
                    "The business operates "
                    "in the food sector."
                ),

            "priority":
                "High"
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

            "name":
                "Business Registration",

            "authority":
                (
                    "Corporate/Business "
                    "Registration Authority"
                ),

            "category":
                "Business",

            "description":
                (
                    "Registration associated "
                    "with the legal form "
                    "of the business."
                ),

            "reason":
                (
                    "The business is represented "
                    "as an established legal entity."
                ),

            "priority":
                "High"
        })

    return approvals