from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import Application
from app.models.application_field import ApplicationField
from app.models.approval_requirement import ApprovalRequirement
from app.models.business import Business
from app.ai.service import ai_service
from app.rag.service import rag_service


router = APIRouter(
    prefix="/api/application-fields",
    tags=["Application Fields"]
)


@router.post("/{application_id}/generate")
def generate_application_fields(
    application_id: int,
    db: Session = Depends(get_db)
):

    application = (
        db.query(Application)
        .filter(
            Application.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    business = (
        db.query(Business)
        .filter(
            Business.id == application.business_id
        )
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found"
        )

    approval = (
        db.query(ApprovalRequirement)
        .filter(
            ApprovalRequirement.id == application.approval_id
        )
        .first()
    )

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval requirement not found"
        )

    evidence_query = (
        f"{approval.approval_name} "
        f"{approval.authority} "
        f"{approval.category} "
        f"{approval.reason} "
        f"required information application fields"
    )

    regulatory_evidence = rag_service.search(
        evidence_query,
        top_k=5
    )

    prompt = f"""
You are BizClear, an AI regulatory compliance assistant.

Identify the INFORMATION that the applicant must provide
when applying for this approval.

Use ONLY the regulatory evidence provided.

Return ONLY a JSON array.

Do NOT use markdown.
Do NOT use ```json.
Do NOT add explanations.

Use this structure:

[
    {{
        "field_name": "Business Entity Information",
        "field_type": "text",
        "required": true
    }}
]

Rules:

1. Include information that the regulatory evidence indicates
   the applicant needs to provide.

2. Do not invent unrelated fields.

3. required must be true or false.

4. field_type should be one of:
   text
   number
   date
   boolean

5. Return ONLY valid JSON.

BUSINESS:
{business.name}

APPROVAL:
{approval.approval_name}

AUTHORITY:
{approval.authority}

REGULATORY EVIDENCE:
{regulatory_evidence}
"""

    try:
        response = ai_service.client.models.generate_content(
            model=ai_service.model,
            contents=prompt
    )

    except Exception as e:
        error_message = str(e)

        if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded. Please try again later."
        )

        raise HTTPException(
            status_code=500,
            detail="AI suggestion generation failed"
    )
    raw_response = response.text.strip()

    print("========== GEMINI FIELD RESPONSE ==========")
    print(raw_response)
    print("============================================")

    import json

    if raw_response.startswith("```"):
        raw_response = raw_response.replace(
            "```json",
            ""
        ).replace(
            "```",
            ""
        ).strip()

    try:
        fields_data = json.loads(raw_response)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="AI returned invalid field structure"
        )

    if not isinstance(fields_data, list):
        raise HTTPException(
            status_code=500,
            detail="AI field response must be a JSON array"
        )

    created_fields = []

    for field_data in fields_data:

        field_name = field_data.get(
            "field_name"
        )

        if not field_name:
            continue

        existing = (
            db.query(ApplicationField)
            .filter(
                ApplicationField.application_id == application_id,
                ApplicationField.field_name == field_name
            )
            .first()
        )

        if existing:

            existing.field_type = field_data.get(
                "field_type",
                existing.field_type
            )

            existing.required = field_data.get(
                "required",
                existing.required
            )

            created_fields.append(existing)
            continue

        field = ApplicationField(
            application_id=application_id,
            field_name=field_name,
            field_type=field_data.get(
                "field_type",
                "text"
            ),
            required=field_data.get(
                "required",
                True
            ),
            status="Pending"
        )

        db.add(field)
        created_fields.append(field)

    db.commit()

    for field in created_fields:
        db.refresh(field)

    return {
        "message": "Application fields generated successfully",
        "application_id": application_id,
        "approval": approval.approval_name,
        "field_count": len(created_fields),
        "fields": [
            {
                "id": field.id,
                "field_name": field.field_name,
                "field_type": field.field_type,
                "required": field.required,
                "value": field.value,
                "ai_suggestion": field.ai_suggestion,
                "status": field.status
            }
            for field in created_fields
        ]
    }


@router.get("/{application_id}")
def get_application_fields(
    application_id: int,
    db: Session = Depends(get_db)
):

    application = (
        db.query(Application)
        .filter(
            Application.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    fields = (
        db.query(ApplicationField)
        .filter(
            ApplicationField.application_id == application_id
        )
        .all()
    )

    return {
        "application_id": application_id,
        "field_count": len(fields),
        "fields": [
            {
                "id": field.id,
                "field_name": field.field_name,
                "field_type": field.field_type,
                "required": field.required,
                "value": field.value,
                "ai_suggestion": field.ai_suggestion,
                "status": field.status
            }
            for field in fields
        ]
    }



class ApplicationFieldUpdate(BaseModel):
    value: str


def validate_field_value(field, value):
    value = value.strip()

    if not value:
        return "This field cannot be empty."

    if field.field_type == "number":
        try:
            float(value)
        except ValueError:
            return f"Please enter a valid number for '{field.field_name}'."

    elif field.field_type == "boolean":
        if value.lower() not in ["true", "false", "yes", "no"]:
            return f"Please enter Yes or No for '{field.field_name}'."

    elif field.field_type == "date":
        from datetime import datetime

        try:
            datetime.fromisoformat(value)
        except ValueError:
            return f"Please enter a valid date for '{field.field_name}'."

    if field.field_name == "Number of Workers":
        try:
            workers = float(value)

            if workers < 0:
                return "Number of Workers cannot be negative."

            if not workers.is_integer():
                return "Number of Workers must be a whole number."

        except ValueError:
            return "Number of Workers must contain a valid number."

    return None


@router.put("/{field_id}")
def update_application_field(
    field_id: int,
    data: ApplicationFieldUpdate,
    db: Session = Depends(get_db)
):
    field = (
        db.query(ApplicationField)
        .filter(
            ApplicationField.id == field_id
        )
        .first()
    )

    if not field:
        raise HTTPException(
            status_code=404,
            detail="Application field not found"
        )

    validation_error = validate_field_value(
        field,
        data.value
    )

    if validation_error:
        raise HTTPException(
            status_code=400,
            detail=validation_error
        )

    field.value = data.value.strip()

    field.status = "Completed"

    db.commit()

    db.refresh(field)

    return {
        "message": "Application field updated successfully",
        "field": {
            "id": field.id,
            "field_name": field.field_name,
            "field_type": field.field_type,
            "required": field.required,
            "value": field.value,
            "ai_suggestion": field.ai_suggestion,
            "status": field.status
        }
    }
@router.post("/{field_id}/suggest")
def suggest_application_field(
    field_id: int,
    db: Session = Depends(get_db)
):

    field = (
        db.query(ApplicationField)
        .filter(
            ApplicationField.id == field_id
        )
        .first()
    )

    if not field:
        raise HTTPException(
            status_code=404,
            detail="Application field not found"
        )

    application = (
        db.query(Application)
        .filter(
            Application.id == field.application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    business = (
        db.query(Business)
        .filter(
            Business.id == application.business_id
        )
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found"
        )

    
    prompt = f"""
You are BizClear, an AI regulatory compliance assistant.

Generate the best possible value for this application field
using the available business information.

APPLICATION FIELD:
{field.field_name}

FIELD TYPE:
{field.field_type}

BUSINESS INFORMATION:

Business Name:
{business.name}

Industry:
{business.industry}

Location:
{business.location}

Business Type:
{business.business_type}

Investment:
{business.investment}

Employees:
{business.employees}

Land Area:
{business.land_area}

Building Area:
{business.building_area}

Pollution Category:
{business.pollution_category}

Production Type:
{business.production_type}

Water Requirement:
{business.water_requirement}

Electricity Requirement:
{business.electricity_requirement}

FIELD-SPECIFIC RULES:

If the field is "Business Entity Information":
use Business Name and Business Type.

if the field is "Factory Premises Information":
use Location, Land Area and Building Area.
Only include values that are actually available.
Do not include "Information not available" for individual
missing values.
If only Location is available, return only the Location.

If the field is "Manufacturing Activities":
use Industry and Production Type.

If the field is "Number of Workers":
use Employees.

If the field is "Machinery Information":
return "Information not available" because machinery
details are not stored in the business record.

If the field is "Other Prescribed Information":
return "Information not available" unless the business
information above provides a suitable value.

GENERAL RULES:

1. Use existing business information.
2. Never invent facts.
3. Do not ask the user to provide information if the
   information already exists above.
4. If the information genuinely does not exist, return:
   "Information not available".
5. Keep the answer concise.
6. Return ONLY the suggested value.
7. Do not use markdown.
8. Do not provide explanations.
"""

    try:
        response = ai_service.client.models.generate_content(
        model=ai_service.model,
        contents=prompt
    )

    except Exception as e:

        error_message = str(e)

        print("========== AI ERROR ==========")
        print(error_message)
        print("==============================")

        if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded. Please try again later."
        )

        if "503" in error_message or "UNAVAILABLE" in error_message:
            raise HTTPException(
            status_code=503,
            detail="Gemini AI service is temporarily unavailable. Please try again later."
        )

        raise HTTPException(
        status_code=500,
        detail="AI suggestion generation failed."
    )
    suggestion = response.text.strip()

    print("========== GEMINI FIELD SUGGESTION ==========")
    print(suggestion)
    print("==============================================")

    field.ai_suggestion = suggestion

    db.commit()

    db.refresh(field)

    return {
        "message": "AI suggestion generated successfully",
        "field": {
            "id": field.id,
            "field_name": field.field_name,
            "field_type": field.field_type,
            "required": field.required,
            "value": field.value,
            "ai_suggestion": field.ai_suggestion,
            "status": field.status
        }
    }
@router.post("/{field_id}/accept-suggestion")
def accept_ai_suggestion(
    field_id: int,
    db: Session = Depends(get_db)
):

    field = (
        db.query(ApplicationField)
        .filter(
            ApplicationField.id == field_id
        )
        .first()
    )

    if not field:
        raise HTTPException(
            status_code=404,
            detail="Application field not found"
        )

    if not field.ai_suggestion:
        raise HTTPException(
            status_code=400,
            detail="No AI suggestion available"
        )

    validation_error = validate_field_value(
        field,
        field.ai_suggestion
)

    if validation_error:
        raise HTTPException(
                status_code=400,
         detail=validation_error
    )

    field.value = field.ai_suggestion.strip()

    field.status = "Completed"

    db.commit()

    return {
        "message": "AI suggestion accepted successfully",
        "field": {
            "id": field.id,
            "field_name": field.field_name,
            "field_type": field.field_type,
            "required": field.required,
            "value": field.value,
            "ai_suggestion": field.ai_suggestion,
            "status": field.status
        }
    }
