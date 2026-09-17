"""
Statutory Validation Schemas and Format Checkers for Official Government Filings.
Enforces strict statutory formats for PAN, GSTIN, Aadhaar, PIN, Mobile, Email, etc.
"""
import re
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator


# Regular expression patterns for official Indian statutory identifiers
PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")
AADHAAR_REGEX = re.compile(r"^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$")
PINCODE_REGEX = re.compile(r"^[1-9]{1}[0-9]{5}$")
MOBILE_REGEX = re.compile(r"^[6-9]\d{9}$")
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
IFSC_REGEX = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")


def validate_pan(val: str) -> Optional[str]:
    """Validate 10-character Indian Permanent Account Number (PAN)."""
    if not val:
        return "PAN is required."
    clean = val.strip().upper()
    if not PAN_REGEX.match(clean):
        return f"Invalid PAN format '{val}'. Expected 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F)."
    return None


def validate_gstin(val: str) -> Optional[str]:
    """Validate 15-character Goods and Services Tax Identification Number (GSTIN)."""
    if not val:
        return "GSTIN is required."
    clean = val.strip().upper()
    if not GSTIN_REGEX.match(clean):
        return f"Invalid GSTIN format '{val}'. Expected 15-character statutory GSTIN (e.g. 33AAAAA0000A1Z5)."
    return None


def validate_aadhaar(val: str) -> Optional[str]:
    """Validate 12-digit Aadhaar Number format without storing plain identity."""
    if not val:
        return "Aadhaar number is required."
    clean = re.sub(r"[\s-]", "", val)
    if not AADHAAR_REGEX.match(clean):
        return f"Invalid Aadhaar format. Must be 12 numeric digits (e.g. 234567890123)."
    return None


def validate_pincode(val: str) -> Optional[str]:
    """Validate 6-digit Indian Postal PIN Code."""
    if not val:
        return "PIN Code is required."
    clean = val.strip()
    if not PINCODE_REGEX.match(clean):
        return f"Invalid PIN code '{val}'. Must be a 6-digit postal code (e.g. 600001)."
    return None


def validate_mobile(val: str) -> Optional[str]:
    """Validate 10-digit Indian Mobile Number."""
    if not val:
        return "Mobile number is required."
    clean = re.sub(r"[\s+()-]", "", val)
    if clean.startswith("91") and len(clean) == 12:
        clean = clean[2:]
    if not MOBILE_REGEX.match(clean):
        return f"Invalid Mobile number '{val}'. Must be 10 digits starting with 6-9."
    return None


def validate_email(val: str) -> Optional[str]:
    """Validate official email address."""
    if not val:
        return "Email is required."
    clean = val.strip()
    if not EMAIL_REGEX.match(clean):
        return f"Invalid Email address '{val}'."
    return None


def validate_ifsc(val: str) -> Optional[str]:
    """Validate 11-character Indian Financial System Code (IFSC)."""
    if not val:
        return "IFSC code is required."
    clean = val.strip().upper()
    if not IFSC_REGEX.match(clean):
        return f"Invalid IFSC code '{val}'. Must be 11 characters (e.g. SBIN0001234)."
    return None


def validate_positive_number(val: Any, field_name: str) -> Optional[str]:
    """Validate that numerical entry is a non-negative float/int."""
    if val is None or str(val).strip() == "":
        return f"{field_name} is required."
    try:
        num = float(str(val).replace(",", "").strip())
        if num < 0:
            return f"{field_name} must be a positive number."
    except ValueError:
        return f"{field_name} must be a valid numerical value."
    return None


class FieldDefinition(BaseModel):
    """Statutory Form Field Definition."""
    field_key: str
    field_name: str
    field_type: str = "text"  # text, number, select, date, boolean, pan, gstin, aadhaar, pincode, mobile, email, ifsc
    required: bool = True
    description: Optional[str] = None
    options: Optional[List[str]] = None
    default_value: Optional[str] = None
    source_mapping: Optional[str] = None  # e.g., 'business.name'
    validation_type: Optional[str] = None


class DocumentDefinition(BaseModel):
    """Statutory Required Attachment Definition."""
    document_code: str
    document_name: str
    document_type: str = "pdf"  # pdf, image, drawing
    required: bool = True
    description: Optional[str] = None
    max_size_mb: int = 10
    allowed_formats: List[str] = Field(default_factory=lambda: [".pdf", ".png", ".jpg", ".jpeg"])
    statutory_authority: Optional[str] = None
