from datetime import datetime, timezone
import hashlib
from pathlib import Path
import shutil
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import Application
from app.models.application_document import ApplicationDocument
from app.models.approval_requirement import ApprovalRequirement
from app.models.business import Business
from app.ai.service import ai_service
from app.rag.service import rag_service
from app.government_integrations.registry import get_adapter_for_approval, get_adapter_by_service_code
from app.services.field_mapping import field_mapping_service

router = APIRouter(prefix="/api/application-documents", tags=["Application Documents"])
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024


def serialize(doc: ApplicationDocument):
    return {
        "id": doc.id,
        "application_id": doc.application_id,
        "document_name": doc.document_name,
        "document_type": doc.document_type,
        "required": doc.required,
        "file_path": doc.file_path,
        "file_hash": doc.file_hash,
        "file_size": doc.file_size,
        "expiry_date": doc.expiry_date,
        "verified_at": doc.verified_at.isoformat() if doc.verified_at else None,
        "status": doc.status,
        "verification_notes": doc.verification_notes,
    }


@router.post("/{application_id}/generate")
def generate_required_documents(application_id: int, db: Session = Depends(get_db)):
    """
    Generate mandatory document attachment checklist from the authoritative government adapter.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    business = db.query(Business).filter(Business.id == app.business_id).first()
    approval = db.query(ApprovalRequirement).filter(ApprovalRequirement.id == app.approval_id).first()
    if not business or not approval:
        raise HTTPException(404, "Application context not found")

    adapter = field_mapping_service.get_adapter_for_app(app, db)
    created = []

    if adapter:
        # Load official statutory document definitions
        doc_defs = adapter.get_document_definitions()
        for d_def in doc_defs:
            doc = db.query(ApplicationDocument).filter(
                ApplicationDocument.application_id == application_id,
                ApplicationDocument.document_name == d_def.document_name,
            ).first()

            if not doc:
                doc = ApplicationDocument(
                    application_id=application_id,
                    document_name=d_def.document_name,
                    document_type=d_def.document_type,
                    required=d_def.required,
                    status="Missing",
                    verification_notes=d_def.description,
                )
                db.add(doc)
            else:
                doc.required = d_def.required
                doc.document_type = d_def.document_type
            created.append(doc)
        db.commit()
        for d in created:
            db.refresh(d)
    else:
        # Fallback to AI RAG checklist if no adapter available
        evidence = rag_service.search(
            f"{approval.approval_name} {approval.authority} {approval.category} required documents",
            top_k=5,
        )
        data = ai_service.generate_documents(business, approval, evidence)
        for item in data:
            name = str(item.get("document_name", "")).strip()
            if not name:
                continue
            doc = db.query(ApplicationDocument).filter(
                ApplicationDocument.application_id == application_id,
                ApplicationDocument.document_name == name,
            ).first()
            if not doc:
                doc = ApplicationDocument(
                    application_id=application_id,
                    document_name=name,
                    document_type=item.get("document_type", "document"),
                    required=bool(item.get("required", False)),
                    status="Missing",
                )
                db.add(doc)
            else:
                doc.required = bool(item.get("required", doc.required))
                doc.document_type = item.get("document_type", doc.document_type)
            created.append(doc)
        db.commit()
        for doc in created:
            db.refresh(doc)

    return {
        "message": "Statutory application document checklist generated successfully",
        "application_id": application_id,
        "government_service": adapter.service_name if adapter else None,
        "document_count": len(created),
        "documents": [serialize(d) for d in created],
    }


@router.get("/{application_id}")
def get_application_documents(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    docs = (
        db.query(ApplicationDocument)
        .filter(ApplicationDocument.application_id == application_id)
        .order_by(ApplicationDocument.id.asc())
        .all()
    )
    return {
        "application_id": application_id,
        "document_count": len(docs),
        "documents": [serialize(d) for d in docs],
    }


@router.post("/{document_id}/upload")
def upload_application_document(
    document_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Secure file upload handling with SHA-256 integrity hashing and size verification.
    """
    doc = db.query(ApplicationDocument).filter(ApplicationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Application document not found")

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}")

    safe_name = Path(file.filename or "document").name
    target_dir = UPLOAD_DIR / str(doc.application_id)
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"{doc.id}_{safe_name}"

    size = 0
    hasher = hashlib.sha256()

    try:
        with target.open("wb") as buffer:
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    target.unlink(missing_ok=True)
                    raise HTTPException(413, "File exceeds the 10 MB size limit.")
                hasher.update(chunk)
                buffer.write(chunk)
    finally:
        file.file.close()

    doc.file_path = str(target)
    doc.file_hash = hasher.hexdigest()
    doc.file_size = size
    doc.status = "Uploaded"
    doc.verification_notes = f"Uploaded on {datetime.now(timezone.utc).strftime('%d-%b-%Y %H:%M UTC')}. Hash: {doc.file_hash[:12]}..."

    db.commit()
    db.refresh(doc)
    return {"message": "Document uploaded successfully", "document": serialize(doc)}


@router.post("/{document_id}/verify")
def verify_application_document(document_id: int, db: Session = Depends(get_db)):
    """
    Verify uploaded document consistency and statutory checklist criteria.
    """
    doc = db.query(ApplicationDocument).filter(ApplicationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Application document not found")
    if not doc.file_path or not Path(doc.file_path).exists():
        raise HTTPException(400, "Document has not been uploaded yet")

    doc.status = "Verifying"
    db.commit()

    try:
        content = Path(doc.file_path).read_bytes()[:200000]
        result = ai_service.verify_document(
            doc.document_name,
            doc.document_type,
            Path(doc.file_path).name,
            content,
        )
        verified = bool(result.get("verified"))
        doc.status = "Verified" if verified else "Rejected"
        doc.verified_at = datetime.now(timezone.utc)
        doc.verification_notes = result.get(
            "verification_notes",
            "Document matches statutory filing requirements.",
        )
        db.commit()
        db.refresh(doc)
        return {
            "message": "Document statutory checklist verification completed",
            "document": serialize(doc),
            "verified": verified,
        }
    except Exception as exc:
        doc.status = "Uploaded"
        doc.verification_notes = f"Verification note: {exc}"
        db.commit()
        raise HTTPException(500, f"Document verification process error: {exc}")
