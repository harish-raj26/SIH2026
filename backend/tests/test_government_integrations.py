import os
import sys

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db

from app.main import app
from app.models import Business, ApprovalRequirement, Application, ApplicationField, ApplicationDocument, ApplicationStatusHistory
from app.government_integrations.registry import get_adapter_for_approval, get_adapter_by_service_code
from app.government_integrations.schemas import (
    validate_pan,
    validate_gstin,
    validate_aadhaar,
    validate_pincode,
    validate_mobile,
    validate_email,
)
from app.services.field_mapping import field_mapping_service
from app.services.status_tracker import status_tracking_service

# Test SQLite in-memory database with StaticPool
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def test_statutory_format_validators():
    """Test format validators for PAN, GSTIN, Aadhaar, PIN, Mobile, Email."""
    # PAN
    assert validate_pan("ABCDE1234F") is None
    assert validate_pan("invalid_pan") is not None
    assert validate_pan("12345ABCDE") is not None

    # GSTIN
    assert validate_gstin("33AAAAA0000A1Z5") is None
    assert validate_gstin("33AAAAA0000A1Z") is not None
    assert validate_gstin("invalid_gstin") is not None

    # Aadhaar format (12 digits)
    assert validate_aadhaar("234567890123") is None
    assert validate_aadhaar("12345") is not None

    # PIN Code
    assert validate_pincode("600001") is None
    assert validate_pincode("012345") is not None  # Leading zero invalid in Indian postal PIN
    assert validate_pincode("6000") is not None

    # Mobile
    assert validate_mobile("9876543210") is None
    assert validate_mobile("1234567890") is not None  # Must start with 6-9

    # Email
    assert validate_email("enterprise@business.com") is None
    assert validate_email("not-an-email") is not None


def test_adapter_registry():
    """Test resolution of government integration adapters."""
    udyam_adapter = get_adapter_for_approval("Udyam MSME Registration Certificate")
    assert udyam_adapter is not None
    assert udyam_adapter.service_code == "udyam_msme"
    assert "udyamregistration.gov.in" in udyam_adapter.portal_url

    gst_adapter = get_adapter_for_approval("Goods and Services Tax (GST) Registration")
    assert gst_adapter is not None
    assert gst_adapter.service_code == "gst_registration"

    tnpcb_adapter = get_adapter_for_approval("TNPCB Consent to Operate (CTO)")
    assert tnpcb_adapter is not None
    assert tnpcb_adapter.service_code == "tnpcb_cto"


def test_field_mapping_and_provenance(db_session=None):
    """Test deterministic mapping of Business attributes into Application fields with source tags."""
    db = TestingSessionLocal()
    try:
        biz = Business(
            name="Apex Precision Engineering Pvt Ltd",
            industry="Manufacturing",
            business_type="Private Limited Company",
            location="Ambattur Industrial Estate, Chennai",
            state="Tamil Nadu",
            district="Chennai",
            investment=45000000.0,
            employees=85,
            pollution_category="Orange",
        )
        db.add(biz)
        db.commit()
        db.refresh(biz)

        approval = ApprovalRequirement(
            business_id=biz.id,
            approval_name="Udyam MSME Registration Certificate",
            authority="Ministry of Micro, Small and Medium Enterprises",
            category="Company / Business Registration",
            status="Not Started",
        )
        db.add(approval)
        db.commit()
        db.refresh(approval)

        # Create Application via API
        resp = client.post(f"/api/applications/?business_id={biz.id}&approval_id={approval.id}")
        assert resp.status_code == 200
        app_data = resp.json()["application"]
        app_id = app_data["id"]

        # Verify fields were deterministically mapped
        fields_resp = client.get(f"/api/application-fields/{app_id}")
        assert fields_resp.status_code == 200
        fields = fields_resp.json()["fields"]
        assert len(fields) > 0

        # Check enterprise name mapping
        name_field = next((f for f in fields if f["field_name"] == "Name of Enterprise / Business Unit"), None)
        assert name_field is not None
        assert name_field["value"] == "Apex Precision Engineering Pvt Ltd"
        assert name_field["source"] == "business_profile"

        # Check employees mapping
        emp_field = next((f for f in fields if f["field_name"] == "Total Persons Employed"), None)
        assert emp_field is not None
        assert emp_field["value"] == "85"
        assert emp_field["source"] == "business_profile"

    finally:
        db.close()


def test_application_readiness_check_and_submission_blocking():
    """Test that application check accurately flags missing/invalid fields and blocks submission."""
    db = TestingSessionLocal()
    try:
        biz = Business(
            name="Apex Precision Engineering Pvt Ltd",
            industry="Manufacturing",
            business_type="Private Limited Company",
            location="Ambattur, Chennai",
            investment=20000000.0,
            employees=40,
        )
        db.add(biz)
        db.commit()
        db.refresh(biz)

        approval = ApprovalRequirement(
            business_id=biz.id,
            approval_name="Udyam MSME Registration Certificate",
            authority="Ministry of Micro, Small and Medium Enterprises",
            category="Company / Business Registration",
        )
        db.add(approval)
        db.commit()
        db.refresh(approval)

        create_resp = client.post(f"/api/applications/?business_id={biz.id}&approval_id={approval.id}")
        app_id = create_resp.json()["application"]["id"]

        # Check readiness when newly created (some fields like PAN, Bank Acc are not in Business profile)
        check_resp = client.post(f"/api/applications/{app_id}/check")
        assert check_resp.status_code == 200
        check_data = check_resp.json()
        assert check_data["ready_for_submission"] is False
        assert len(check_data["missing_fields"]) > 0

        # Attempting submission MUST fail with 400
        sub_resp = client.post(f"/api/applications/{app_id}/submit")
        assert sub_resp.status_code == 400
        assert "not ready for submission" in sub_resp.json()["detail"]["message"].lower()

    finally:
        db.close()


def test_complete_submission_and_status_tracking():
    """Test filling required fields, attaching documents, submitting, and tracking real status."""
    db = TestingSessionLocal()
    try:
        biz = Business(
            name="Apex Precision Engineering Pvt Ltd",
            industry="Manufacturing",
            business_type="Private Limited Company",
            location="Ambattur, Chennai",
            state="Tamil Nadu",
            district="Chennai",
            investment=20000000.0,
            employees=40,
        )
        db.add(biz)
        db.commit()
        db.refresh(biz)

        approval = ApprovalRequirement(
            business_id=biz.id,
            approval_name="Udyam MSME Registration Certificate",
            authority="Ministry of Micro, Small and Medium Enterprises",
            category="Company / Business Registration",
        )
        db.add(approval)
        db.commit()
        db.refresh(approval)

        create_resp = client.post(f"/api/applications/?business_id={biz.id}&approval_id={approval.id}")
        app_id = create_resp.json()["application"]["id"]

        # Generate fields
        fields_resp = client.get(f"/api/application-fields/{app_id}")
        fields = fields_resp.json()["fields"]

        # Fill all remaining required fields with valid statutory values
        valid_values = {
            "Enterprise / Proprietor PAN": "AAACP1234F",
            "PIN Code of Enterprise Location": "600058",
            "Enterprise Bank Account Number": "987654321000",
            "Bank IFSC Code": "SBIN0001234",
            "Aadhaar Linked Mobile Number": "9876543210",
            "Official Enterprise Email": "apex.engineering@bizclear.com",
            "Estimated / Annual Turnover (₹)": "50000000",
        }

        for f in fields:
            if f["field_name"] in valid_values:
                put_resp = client.put(f"/api/application-fields/{f['id']}", json={"value": valid_values[f["field_name"]]})
                assert put_resp.status_code == 200

        # Generate and attach documents
        doc_gen_resp = client.post(f"/api/application-documents/{app_id}/generate")
        assert doc_gen_resp.status_code == 200
        docs = doc_gen_resp.json()["documents"]

        for d in docs:
            # Mark documents as uploaded/verified
            db_doc = db.query(ApplicationDocument).filter(ApplicationDocument.id == d["id"]).first()
            if db_doc:
                db_doc.status = "Verified"
                db_doc.file_path = "/uploads/test.pdf"
                db_doc.file_hash = "abc123hash"
        db.commit()

        # Check readiness now
        check_resp = client.post(f"/api/applications/{app_id}/check")
        assert check_resp.status_code == 200
        check_data = check_resp.json()
        assert check_data["ready_for_submission"] is True
        assert check_data["completion_percentage"] == 100

        # Perform Submission with confirmed government reference number from portal acknowledgment
        sub_resp = client.post(
            f"/api/applications/{app_id}/submit",
            json={
                "government_app_id": "UDYAM-TN-02-0089123",
                "reference_no": "UDYAM-TN-02-0089123",
                "portal_acknowledged": True,
            },
        )
        assert sub_resp.status_code == 200
        sub_data = sub_resp.json()
        assert sub_data["government_app_id"] == "UDYAM-TN-02-0089123"
        assert sub_data["application"]["status"] == "Submitted"

        # Verify ApplicationStatusHistory was created
        history_resp = client.get(f"/api/applications/{app_id}/history")
        assert history_resp.status_code == 200
        hist_data = history_resp.json()
        assert hist_data["history_count"] >= 1
        assert hist_data["history"][0]["government_status"] is not None

        # Test Status Sync endpoint
        sync_resp = client.post(f"/api/applications/{app_id}/sync-status")
        assert sync_resp.status_code == 200
        sync_data = sync_resp.json()
        assert sync_data["government_app_id"] == "UDYAM-TN-02-0089123"
        assert sync_data["normalized_status"] in ["UNDER_REVIEW", "GOVERNMENT_CONFIRMED", "SUBMITTED"]

    finally:
        db.close()


def test_government_webhook_receiver():
    """Test webhook receiver for external push updates from government departments."""
    db = TestingSessionLocal()
    try:
        biz = Business(
            name="Apex Precision Engineering Pvt Ltd",
            industry="Manufacturing",
            business_type="Private Limited Company",
            location="Ambattur, Chennai",
            investment=20000000.0,
            employees=40,
        )
        db.add(biz)
        db.commit()
        db.refresh(biz)

        app_rec = Application(
            business_id=biz.id,
            approval_id=1,
            status="Submitted",
            government_service_code="udyam_msme",
            government_app_id="UDYAM-TN-02-0089123",
            government_reference_no="UDYAM-TN-02-0089123",
            normalized_status="SUBMITTED",
            government_status="Application Received",
        )
        db.add(app_rec)
        db.commit()
        db.refresh(app_rec)

        # 1. Unauthenticated webhook call MUST fail with 401
        unauth_resp = client.post(
            "/api/government/webhooks/msme",
            json={
                "government_app_id": "UDYAM-TN-02-0089123",
                "government_status": "Approved and Certificate Generated",
            },
        )
        assert unauth_resp.status_code == 401

        # 2. Authenticated webhook call with valid secret
        auth_resp = client.post(
            "/api/government/webhooks/msme",
            headers={"Authorization": "Bearer bizclear_gov_secret_2026"},
            json={
                "government_app_id": "UDYAM-TN-02-0089123",
                "government_status": "Approved and Digital Udyam Certificate Issued",
                "remarks": "Verified and sanctioned by Joint Director MSME-DFO Chennai.",
            },
        )
        assert auth_resp.status_code == 200
        auth_data = auth_resp.json()
        assert auth_data["status"] == "acknowledged"

        # Verify application status was updated in database
        db.refresh(app_rec)
        assert app_rec.normalized_status == "APPROVED"
        assert app_rec.status == "Approved"

        # Verify status history recorded GOVERNMENT_WEBHOOK source
        history = db.query(ApplicationStatusHistory).filter(ApplicationStatusHistory.application_id == app_rec.id).all()
        assert len(history) > 0
        assert "WEBHOOK" in history[-1].source

    finally:
        db.close()


def test_delete_business_and_clear_all():
    """Test single business cascade deletion and bulk clear of all businesses."""
    db = TestingSessionLocal()
    try:
        # Create test businesses
        biz1 = Business(
            name="Test Biz 1",
            industry="Manufacturing",
            business_type="Private Limited",
            location="Chennai",
            investment=1000000.0,
            employees=20,
        )
        biz2 = Business(
            name="Test Biz 2",
            industry="IT Services",
            business_type="LLP",
            location="Coimbatore",
            investment=500000.0,
            employees=10,
        )
        db.add_all([biz1, biz2])
        db.commit()
        db.refresh(biz1)
        db.refresh(biz2)

        # Create approval requirement for biz1
        req = ApprovalRequirement(
            business_id=biz1.id,
            approval_name="Factory Permit",
            authority="Directorate of Industrial Safety",
            category="Licensing",
            status="Not Started",
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        # Create child application record for biz1
        app_rec = Application(
            business_id=biz1.id,
            approval_id=req.id,
            status="Draft",
        )
        db.add(app_rec)
        db.commit()
        db.refresh(app_rec)

        # 1. Delete biz1 specifically
        resp1 = client.delete(f"/api/businesses/{biz1.id}")
        assert resp1.status_code == 200
        assert resp1.json()["deleted_id"] == biz1.id

        # Verify biz1 and its application were deleted
        assert db.query(Business).filter(Business.id == biz1.id).first() is None
        assert db.query(Application).filter(Application.business_id == biz1.id).first() is None

        # Verify biz2 still exists
        assert db.query(Business).filter(Business.id == biz2.id).first() is not None

        # 2. Clear all businesses
        resp_all = client.delete("/api/businesses/")
        assert resp_all.status_code == 200
        assert resp_all.json()["cleared_count"] >= 1

        # Verify all businesses are deleted
        assert db.query(Business).count() == 0
    finally:
        db.close()
