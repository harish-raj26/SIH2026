"""
Authoritative Government Status Tracking & History Service.
Synchronizes live status from official government sources, maintains immutable status history,
and dispatches real in-app notifications.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.application_status_history import ApplicationStatusHistory
from app.models.notification import Notification
from app.government_integrations.registry import get_adapter_by_service_code, get_adapter_for_approval
from app.government_integrations.base import StatusCheckResult, NormalizedStatus


class StatusTrackingService:
    """
    Manages authoritative government status querying, status normalization,
    status transition logging, and enterprise notification.
    """

    @classmethod
    def sync_application_status(
        cls,
        application_id: int,
        db: Session,
        override_source: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Query the authoritative government endpoint, detect status changes,
        log to ApplicationStatusHistory, and update the Application record.
        """
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            raise ValueError(f"Application #{application_id} not found.")

        # Resolve adapter
        adapter = None
        if application.government_service_code:
            adapter = get_adapter_by_service_code(application.government_service_code)
        if not adapter:
            from app.models.approval_requirement import ApprovalRequirement
            approval = db.query(ApprovalRequirement).filter(
                ApprovalRequirement.id == application.approval_id
            ).first()
            if approval:
                adapter = get_adapter_for_approval(approval.approval_name, approval.authority)

        if not adapter:
            raise ValueError(f"No government integration adapter found for Application #{application_id}.")

        # If application has not been submitted yet or lacks real government ID
        if not application.government_app_id and not application.government_reference_no:
            return {
                "application_id": application_id,
                "status": application.status,
                "normalized_status": application.normalized_status or "DRAFT",
                "government_status": application.government_status or "Not Submitted to Government",
                "synced": False,
                "message": "Application has not been submitted to the government yet. No government application number exists.",
            }

        app_id = application.government_app_id or application.government_reference_no
        ref_no = application.government_reference_no

        # Query authoritative government adapter
        check_result: StatusCheckResult = adapter.get_application_status(app_id, ref_no)

        old_status = application.status
        old_normalized = application.normalized_status
        old_gov_status = application.government_status

        new_gov_status = check_result.government_status
        new_normalized = check_result.normalized_status.value

        # Update application timestamp and raw status
        application.last_synced_at = datetime.now(timezone.utc)
        application.government_status = new_gov_status
        application.normalized_status = new_normalized

        # Map normalized status to legacy display status for compatibility
        status_display_map = {
            "DRAFT": "Draft",
            "PREPARED": "Prepared",
            "SUBMITTED": "Submitted",
            "GOVERNMENT_CONFIRMED": "Submitted",
            "UNDER_REVIEW": "Under Review",
            "DOCUMENT_VERIFICATION": "Under Review",
            "INSPECTION_SCHEDULED": "Under Review",
            "CLARIFICATION_REQUIRED": "Needs Attention",
            "APPROVED": "Approved",
            "REJECTED": "Rejected",
        }
        application.status = status_display_map.get(new_normalized, "Under Review")

        # Determine if status changed
        status_changed = (old_gov_status != new_gov_status or old_normalized != new_normalized)

        if status_changed:
            # Record immutable status history entry
            history_entry = ApplicationStatusHistory(
                application_id=application.id,
                old_status=old_status,
                new_status=application.status,
                government_status=new_gov_status,
                normalized_status=new_normalized,
                source=override_source or check_result.source,
                remarks=check_result.remarks or f"Authoritative update from {adapter.authority_name}",
                created_at=datetime.now(timezone.utc),
            )
            db.add(history_entry)

            # Create real notification for enterprise
            notif = Notification(
                business_id=application.business_id,
                title=f"Government Status Update: {adapter.service_name}",
                message=f"Application {app_id} status updated to '{new_gov_status}' ({new_normalized}). {check_result.remarks or ''}".strip(),
                type="info" if new_normalized not in ["REJECTED", "CLARIFICATION_REQUIRED"] else "warning",
                read=False,
                created_at=datetime.now(timezone.utc),
            )
            db.add(notif)

        db.commit()
        db.refresh(application)

        return {
            "application_id": application.id,
            "government_app_id": application.government_app_id,
            "government_reference_no": application.government_reference_no,
            "government_status": application.government_status,
            "normalized_status": application.normalized_status,
            "status": application.status,
            "last_synced_at": application.last_synced_at.isoformat() if application.last_synced_at else None,
            "status_changed": status_changed,
            "remarks": check_result.remarks,
            "source": check_result.source,
        }

    @classmethod
    def get_status_history(cls, application_id: int, db: Session) -> List[Dict[str, Any]]:
        """Retrieve complete immutable history of authoritative status transitions."""
        rows = (
            db.query(ApplicationStatusHistory)
            .filter(ApplicationStatusHistory.application_id == application_id)
            .order_by(ApplicationStatusHistory.created_at.asc())
            .all()
        )

        return [
            {
                "id": r.id,
                "application_id": r.application_id,
                "old_status": r.old_status,
                "new_status": r.new_status,
                "government_status": r.government_status,
                "normalized_status": r.normalized_status,
                "source": r.source,
                "remarks": r.remarks,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]

    @classmethod
    def sync_all_pending_applications(cls, db: Session) -> List[Dict[str, Any]]:
        """Batch background sync for active submitted applications."""
        active_apps = (
            db.query(Application)
            .filter(
                Application.government_app_id.isnot(None),
                Application.normalized_status.notin_(["APPROVED", "REJECTED"]),
            )
            .all()
        )

        results = []
        for app in active_apps:
            try:
                res = cls.sync_application_status(app.id, db)
                results.append(res)
            except Exception as e:
                results.append({"application_id": app.id, "error": str(e)})

        return results


status_tracking_service = StatusTrackingService()
