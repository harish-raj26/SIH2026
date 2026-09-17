"""
Abstract Base Government Integration Adapter.
Provides standard interfaces for statutory schema generation, deterministic field mapping,
rigorous validation, dossier preparation, official submission, and authoritative status tracking.
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.government_integrations.schemas import (
    FieldDefinition,
    DocumentDefinition,
    validate_pan,
    validate_gstin,
    validate_aadhaar,
    validate_pincode,
    validate_mobile,
    validate_email,
    validate_ifsc,
    validate_positive_number,
)


class NormalizedStatus(str, Enum):
    """Standardized BizClear lifecycle status."""
    DRAFT = "DRAFT"
    PREPARED = "PREPARED"
    SUBMITTED = "SUBMITTED"
    GOVERNMENT_CONFIRMED = "GOVERNMENT_CONFIRMED"
    UNDER_REVIEW = "UNDER_REVIEW"
    DOCUMENT_VERIFICATION = "DOCUMENT_VERIFICATION"
    INSPECTION_SCHEDULED = "INSPECTION_SCHEDULED"
    CLARIFICATION_REQUIRED = "CLARIFICATION_REQUIRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ValidationResult(BaseModel):
    """Result of comprehensive application packet validation."""
    valid: bool
    completion_percentage: int
    ready_for_submission: bool
    summary: str
    missing_fields: List[str] = Field(default_factory=list)
    invalid_fields: List[Dict[str, str]] = Field(default_factory=list)
    missing_documents: List[str] = Field(default_factory=list)


class PreparedDossier(BaseModel):
    """Standardized prepared government dossier ready for submission."""
    service_code: str
    service_name: str
    authority_name: str
    portal_url: str
    applicant_name: str
    payload: Dict[str, Any]
    attached_documents: List[Dict[str, Any]]
    dossier_checksum: str
    prepared_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SubmissionResult(BaseModel):
    """Authoritative result returned from submission to government."""
    success: bool
    government_status: str
    normalized_status: NormalizedStatus
    message: str
    government_app_id: Optional[str] = None
    government_reference_no: Optional[str] = None
    submission_mode: str = "PORTAL_ASSISTED"  # OFFICIAL_API, PORTAL_ASSISTED, PLAYWRIGHT_DIRECT, WEBHOOK_CONFIRMED
    submission_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    portal_redirect_url: Optional[str] = None
    raw_response: Dict[str, Any] = Field(default_factory=dict)


class StatusCheckResult(BaseModel):
    """Authoritative result returned from government status check."""
    government_app_id: str
    government_status: str
    normalized_status: NormalizedStatus
    government_reference_no: Optional[str] = None
    last_synced_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    remarks: Optional[str] = None
    source: str = "OFFICIAL_API_SYNC"
    raw_response: Dict[str, Any] = Field(default_factory=dict)


class GovernmentIntegration(ABC):
    """
    Abstract Base Class for all real government service integrations.
    Each statutory approval type implements this contract.
    """

    @property
    @abstractmethod
    def service_code(self) -> str:
        """Unique programmatic identifier for this government service."""
        pass

    @property
    @abstractmethod
    def service_name(self) -> str:
        """Official regulatory clearance name."""
        pass

    @property
    @abstractmethod
    def authority_name(self) -> str:
        """Statutory governing department or ministry."""
        pass

    @property
    @abstractmethod
    def portal_url(self) -> str:
        """Official authorized portal URL for this service."""
        pass

    @property
    @abstractmethod
    def official_status_url(self) -> str:
        """Official URL for public or authenticated status verification."""
        pass

    @property
    def auth_mode(self) -> str:
        """Authentication mechanism (OFFICIAL_API, OAUTH2, OTP_PORTAL, DSC_ESIGN)."""
        return "OTP_PORTAL"

    @abstractmethod
    def get_field_definitions(self) -> List[FieldDefinition]:
        """Return the official statutory fields required by this department."""
        pass

    @abstractmethod
    def get_document_definitions(self) -> List[DocumentDefinition]:
        """Return the mandatory document attachment checklist."""
        pass

    @abstractmethod
    def map_business_to_fields(self, business: Any) -> List[Dict[str, Any]]:
        """
        Deterministically map attributes from a BizClear Business model
        into the statutory field structure with provenance source tags.
        """
        pass

    def validate_field(self, field_def: FieldDefinition, value: Any) -> Optional[str]:
        """Validate a single field according to its statutory type rules."""
        val_str = str(value).strip() if value is not None else ""

        if field_def.required and not val_str:
            return f"'{field_def.field_name}' is a mandatory statutory field."

        if not val_str:
            return None

        # Type-specific statutory validations
        if field_def.field_type == "pan" or field_def.validation_type == "pan":
            return validate_pan(val_str)
        elif field_def.field_type == "gstin" or field_def.validation_type == "gstin":
            return validate_gstin(val_str)
        elif field_def.field_type == "aadhaar" or field_def.validation_type == "aadhaar":
            return validate_aadhaar(val_str)
        elif field_def.field_type == "pincode" or field_def.validation_type == "pincode":
            return validate_pincode(val_str)
        elif field_def.field_type == "mobile" or field_def.validation_type == "mobile":
            return validate_mobile(val_str)
        elif field_def.field_type == "email" or field_def.validation_type == "email":
            return validate_email(val_str)
        elif field_def.field_type == "ifsc" or field_def.validation_type == "ifsc":
            return validate_ifsc(val_str)
        elif field_def.field_type in ["number", "float", "integer"]:
            return validate_positive_number(val_str, field_def.field_name)
        elif field_def.field_type == "select" and field_def.options:
            if val_str not in field_def.options:
                return f"'{val_str}' is invalid. Allowed options: {', '.join(field_def.options)}"

        return None

    def validate_packet(self, fields_dict: Dict[str, Any], documents_list: List[Dict[str, Any]]) -> ValidationResult:
        """
        Validate all populated form fields and uploaded documents against statutory schema.
        """
        field_defs = self.get_field_definitions()
        doc_defs = self.get_document_definitions()

        missing_fields = []
        invalid_fields = []
        missing_docs = []

        # Validate Fields
        total_required_fields = 0
        completed_fields = 0

        for f_def in field_defs:
            if f_def.required:
                total_required_fields += 1

            val = fields_dict.get(f_def.field_name) or fields_dict.get(f_def.field_key)
            err = self.validate_field(f_def, val)

            if err:
                if f_def.required and (val is None or str(val).strip() == ""):
                    missing_fields.append(f_def.field_name)
                else:
                    invalid_fields.append({"field": f_def.field_name, "error": err})
            else:
                if val is not None and str(val).strip() != "":
                    completed_fields += 1

        # Validate Documents
        uploaded_doc_types = {
            d.get("document_name"): d for d in documents_list if d.get("status") in ["Uploaded", "Verified"]
        }

        total_required_docs = 0
        verified_docs = 0

        for d_def in doc_defs:
            if d_def.required:
                total_required_docs += 1
                if d_def.document_name not in uploaded_doc_types:
                    missing_docs.append(d_def.document_name)
                else:
                    doc = uploaded_doc_types[d_def.document_name]
                    if doc.get("status") == "Verified":
                        verified_docs += 1

        total_items = max(1, total_required_fields + total_required_docs)
        completed_items = completed_fields + (len(uploaded_doc_types))
        completion_percentage = min(100, round((completed_items / total_items) * 100))

        ready = (len(missing_fields) == 0 and len(invalid_fields) == 0 and len(missing_docs) == 0)

        summary = "Application is compliant and ready for authoritative submission." if ready else (
            f"Prerequisites pending: {len(missing_fields)} missing fields, {len(invalid_fields)} invalid declarations, {len(missing_docs)} missing documents."
        )

        return ValidationResult(
            valid=ready,
            completion_percentage=completion_percentage,
            missing_fields=missing_fields,
            invalid_fields=invalid_fields,
            missing_documents=missing_docs,
            ready_for_submission=ready,
            summary=summary,
        )

    @abstractmethod
    def prepare_dossier(self, business: Any, fields_dict: Dict[str, Any], documents_list: List[Dict[str, Any]]) -> PreparedDossier:
        """Compile verified statutory payload and generate digital dossier."""
        pass

    @abstractmethod
    def submit_application(
        self,
        dossier: PreparedDossier,
        auth_credentials: Optional[Dict[str, Any]] = None,
        user_confirmation: Optional[Dict[str, Any]] = None,
    ) -> SubmissionResult:
        """
        Execute real submission.
        - If direct API credentials available: calls official endpoint.
        - If portal assisted: creates certified filing payload and captures confirmed ARN.
        """
        pass

    @abstractmethod
    def get_application_status(
        self,
        government_app_id: str,
        government_reference_no: Optional[str] = None,
    ) -> StatusCheckResult:
        """Query authoritative government status endpoint or public verification API."""
        pass

    @abstractmethod
    def normalize_status(self, raw_status: str) -> NormalizedStatus:
        """Normalize department-specific terminology to BizClear standard lifecycle."""
        pass
