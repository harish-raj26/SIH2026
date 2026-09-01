from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application_field import ApplicationField
from app.models.application import Application
from app.models.application_document import ApplicationDocument
from app.models.approval_requirement import ApprovalRequirement
from app.models.business import Business
from app.ai.service import ai_service
from app.rag.service import rag_service 
import os
import shutil


router = APIRouter(
    prefix="/api/application-documents",
    tags=["Application Documents"]
)


@router.post("/{application_id}/generate")
def generate_required_documents(
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
        f"required documents"
    )

    regulatory_evidence = rag_service.search(
        evidence_query,
        top_k=5
    )
    print("========== REGULATORY EVIDENCE ==========")
    print(regulatory_evidence)
    print("==========================================")

    prompt = """
You are BizClear, an AI regulatory compliance assistant.

Your task is to identify documents and information needed
for a business approval application.

IMPORTANT:

The REGULATORY EVIDENCE is the primary source.

Do not invent requirements that are not supported by
the regulatory evidence.

You must distinguish between:

1. MANDATORY DOCUMENTS
   These are documents that the regulatory evidence indicates
   are required for the approval.

2. SUPPORTING INFORMATION
   These are useful documents or information that may help
   the application but are not clearly mandatory.

Return ONLY a JSON array.

Do NOT use markdown.
Do NOT use ```json.
Do NOT add explanations.

Use exactly this structure:

[
    {
        "document_name": "Example Document",
        "document_type": "certificate",
        "required": true
    }
]

Rules:

1. required = true ONLY when the regulatory evidence supports
   that the document is mandatory or required.

2. required = false when the item is supporting information
   or the evidence does not establish that it is mandatory.

3. Do not invent documents.

4. Use the regulatory evidence as the primary source.

5. Keep document names clear and understandable.

6. document_type should describe the type of document.

7. required must be either true or false.

8. Return ONLY valid JSON.
"""

    prompt = prompt + f"""

BUSINESS:
{business.name}

APPROVAL:
{approval.approval_name}

AUTHORITY:
{approval.authority}

CATEGORY:
{approval.category}

REASON:
{approval.reason}

REGULATORY EVIDENCE:
{regulatory_evidence}
"""

    response = ai_service.client.models.generate_content(
        model=ai_service.model,
        contents=prompt
    )

    raw_response = response.text.strip()

    print("GEMINI DOCUMENT RESPONSE:")
    print(raw_response)

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
        documents_data = json.loads(raw_response)

    except json.JSONDecodeError:

        raise HTTPException(
            status_code=500,
            detail="AI returned invalid document structure"
        )

    if not isinstance(documents_data, list):

        raise HTTPException(
            status_code=500,
            detail="AI document response must be a JSON array"
    )

    created_documents = []

    for document_data in documents_data:

        document_name = document_data.get(
            "document_name"
        )

        if not document_name:
            continue

        existing = (
            db.query(ApplicationDocument)
            .filter(
                ApplicationDocument.application_id == application_id,
                ApplicationDocument.document_name == document_name
            )
            .first()
        )

        if existing:

            existing.required = document_data.get(
                "required",
                False
            )

            existing.document_type = document_data.get(
                "document_type",
                existing.document_type
            )

            created_documents.append(existing)
            continue

        document = ApplicationDocument(
            application_id=application_id,
            document_name=document_name,
            document_type=document_data.get(
                "document_type",
                "document"
            ),
            required=document_data.get(
                "required",
                True
            ),
            status="Missing"
        )

        db.add(document)
        created_documents.append(document)

    db.commit()

    for document in created_documents:
        db.refresh(document)

    return {
        "regulatory_evidence": regulatory_evidence,
        
        "message": "Required documents generated successfully",
        "application_id": application_id,
        "approval": approval.approval_name,
        "document_count": len(created_documents),
        "documents": [
            {
                "id": document.id,
                "document_name": document.document_name,
                "document_type": document.document_type,
                "required": document.required,
                "status": document.status,
                "verification_notes": document.verification_notes
            }
            for document in created_documents
        ]
    }


@router.get("/{application_id}")
def get_application_documents(
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

    documents = (
        db.query(ApplicationDocument)
        .filter(
            ApplicationDocument.application_id == application_id
        )
        .all()
    )

    return {
        "application_id": application_id,
        "document_count": len(documents),
        "documents": [
            {
                "id": document.id,
                "document_name": document.document_name,
                "document_type": document.document_type,
                "required": document.required,
                "file_path": document.file_path,
                "status": document.status,
                "verification_notes": document.verification_notes
            }
            for document in documents
        ]
    }
@router.get("/{application_id}")
def get_application_documents(
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

    documents = (
        db.query(ApplicationDocument)
        .filter(
            ApplicationDocument.application_id == application_id
        )
        .all()
    )

    return {
        "application_id": application_id,
        "document_count": len(documents),
        "documents": [
            {
                "id": document.id,
                "document_name": document.document_name,
                "document_type": document.document_type,
                "required": document.required,
                "file_path": document.file_path,
                "status": document.status,
                "verification_notes": document.verification_notes
            }
            for document in documents
        ]
    }


@router.post("/{document_id}/upload")
def upload_application_document(
    document_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    document = (
        db.query(ApplicationDocument)
        .filter(
            ApplicationDocument.id == document_id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Application document not found"
        )

    upload_directory = "uploads"

    os.makedirs(
        upload_directory,
        exist_ok=True
    )

    file_path = os.path.join(
        upload_directory,
        f"{document_id}_{file.filename}"
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    document.file_path = file_path
    document.status = "Uploaded"

    db.commit()
    db.refresh(document)

    return {
        "message": "Document uploaded successfully",
        "document": {
            "id": document.id,
            "document_name": document.document_name,
            "document_type": document.document_type,
            "required": document.required,
            "file_path": document.file_path,
            "status": document.status,
            "verification_notes": document.verification_notes
        }
    }
@router.post("/{document_id}/verify")
def verify_application_document(
    document_id: int,
    db: Session = Depends(get_db)
):

    document = (
        db.query(ApplicationDocument)
        .filter(
            ApplicationDocument.id == document_id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Application document not found"
        )

    if not document.file_path:
        raise HTTPException(
            status_code=400,
            detail="Document has not been uploaded"
        )

    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found"
        )

    document.status = "Verifying"

    db.commit()

    prompt = f"""
You are BizClear, an AI regulatory compliance assistant.

Verify whether the uploaded document appears suitable
for the following required document.

Required document:
{document.document_name}

Document type:
{document.document_type}

Analyze the uploaded document and return ONLY valid JSON.

Use exactly this structure:

{{
    "verified": true,
    "verification_notes": "Document appears to satisfy the requirement."
}}

Rules:

1. verified must be true or false.
2. Do not invent information.
3. If the document cannot be verified, return false.
4. verification_notes must briefly explain the result.
5. Return ONLY JSON.
"""

    try:

        with open(
            document.file_path,
            "rb"
        ) as uploaded_file:

            uploaded_data = uploaded_file.read()

        response = ai_service.client.models.generate_content(
            model=ai_service.model,
            contents=[
                prompt,
                uploaded_data
            ]
        )

        raw_response = response.text.strip()

        import json

        if raw_response.startswith("```"):
            raw_response = (
                raw_response
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )

        verification = json.loads(raw_response)

        verified = verification.get(
            "verified",
            False
        )

        notes = verification.get(
            "verification_notes",
            "Document could not be verified."
        )

        if verified:
            document.status = "Verified"
        else:
            document.status = "Rejected"

        document.verification_notes = notes

        db.commit()
        db.refresh(document)

        return {
            "message": "Document verification completed",
            "document": {
                "id": document.id,
                "document_name": document.document_name,
                "status": document.status,
                "verification_notes": document.verification_notes
            }
        }

    except Exception as e:

        document.status = "Uploaded"

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Document verification failed: {str(e)}"
        )