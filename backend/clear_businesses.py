"""
CLI script to safely clear all business entities and their associated cascaded records from SQLite.
Usage:
    python clear_businesses.py
"""
import sys
from pathlib import Path

# Add backend directory to sys.path so app imports work
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import (
    Business,
    ApprovalRequirement,
    Application,
    ApplicationField,
    ApplicationDocument,
    ApplicationStatusHistory,
    Notification,
    Inspection,
    ComplianceDue,
)

def clear_all_businesses():
    db = SessionLocal()
    try:
        print("Clearing all business entities and related records...")
        hist_count = db.query(ApplicationStatusHistory).delete()
        doc_count = db.query(ApplicationDocument).delete()
        field_count = db.query(ApplicationField).delete()
        app_count = db.query(Application).delete()
        req_count = db.query(ApprovalRequirement).delete()
        notif_count = db.query(Notification).delete()
        
        try:
            db.query(Inspection).delete()
        except Exception:
            pass
        try:
            db.query(ComplianceDue).delete()
        except Exception:
            pass

        biz_count = db.query(Business).delete()
        db.commit()

        print(f"Successfully cleared:")
        print(f" - {biz_count} Business entities")
        print(f" - {app_count} Applications ({field_count} fields, {doc_count} docs, {hist_count} history logs)")
        print(f" - {req_count} Approval requirements")
        print(f" - {notif_count} Notifications")
    except Exception as e:
        db.rollback()
        print(f"Error clearing businesses: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    clear_all_businesses()
