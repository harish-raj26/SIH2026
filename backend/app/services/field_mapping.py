"""
Field Mapping and Validation Service for BizClear.
Provides deterministic mapping from Business profile to statutory application fields,
tracks field provenance sources, and performs rigorous validation.
"""
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.application_field import ApplicationField
from app.models.approval_requirement import ApprovalRequirement
from app.models.business import Business
from app.government_integrations.registry import get_adapter_for_approval, get_adapter_by_service_code
from app.government_integrations.base import GovernmentIntegration


class FieldMappingService:
    """
    Manages field generation, deterministic value mapping, provenance source tracking,
    and statutory format validation.
    """

    @staticmethod
    def get_adapter_for_app(application: Application, db: Session) -> Optional[GovernmentIntegration]:
        """Resolve government adapter for a given Application record."""
        if application.government_service_code:
            adapter = get_adapter_by_service_code(application.government_service_code)
            if adapter:
                return adapter

        approval = db.query(ApprovalRequirement).filter(
            ApprovalRequirement.id == application.approval_id
        ).first()

        if approval:
            adapter = get_adapter_for_approval(approval.approval_name, approval.authority)
            if adapter and not application.government_service_code:
                application.government_service_code = adapter.service_code
                db.commit()
            return adapter

        return None

    @classmethod
    def generate_and_map_fields(cls, application_id: int, db: Session) -> List[ApplicationField]:
        """
        Generate statutory form fields and deterministically populate them
        from the registered Business profile with data provenance tags.
        """
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            return []

        business = db.query(Business).filter(Business.id == application.business_id).first()
        if not business:
            return []

        adapter = cls.get_adapter_for_app(application, db)
        if not adapter:
            return []

        # Get deterministic field mappings from adapter
        mapped_fields = adapter.map_business_to_fields(business)
        persisted_fields = []

        for item in mapped_fields:
            field_name = item["field_name"]
            existing = db.query(ApplicationField).filter(
                ApplicationField.application_id == application_id,
                ApplicationField.field_name == field_name,
            ).first()

            val = item.get("value") or ""
            source = item.get("source", "user_input")
            field_key = item.get("field_key")
            field_type = item.get("field_type", "text")
            required = item.get("required", True)
            validation_err = item.get("validation_error")

            if existing:
                # Keep user-entered value if present and source is user_input, otherwise update with mapped
                if not existing.value and val:
                    existing.value = val
                    existing.source = source
                existing.field_key = field_key or existing.field_key
                existing.field_type = field_type or existing.field_type
                existing.required = required
                existing.source_field_path = item.get("source_field_path")
                existing.validation_error = validation_err

                if existing.value and not validation_err:
                    existing.status = "Completed"
                persisted_fields.append(existing)
            else:
                new_field = ApplicationField(
                    application_id=application_id,
                    field_name=field_name,
                    field_key=field_key,
                    field_type=field_type,
                    required=required,
                    value=val if val else None,
                    source=source if val else "user_input",
                    source_field_path=item.get("source_field_path"),
                    validation_error=validation_err,
                    status="Completed" if val and not validation_err else "Pending",
                )
                db.add(new_field)
                persisted_fields.append(new_field)

        db.commit()
        for f in persisted_fields:
            db.refresh(f)

        return persisted_fields

    @classmethod
    def update_field_value(
        cls,
        field_id: int,
        new_value: str,
        db: Session,
        source: str = "user_input"
    ) -> ApplicationField:
        """Update a specific field value and re-run statutory validation."""
        field = db.query(ApplicationField).filter(ApplicationField.id == field_id).first()
        if not field:
            raise ValueError("Application field not found")

        application = db.query(Application).filter(Application.id == field.application_id).first()
        adapter = cls.get_adapter_for_app(application, db) if application else None

        clean_value = new_value.strip() if new_value is not None else ""

        # Validate with adapter if available
        validation_error = None
        if adapter:
            # Find field definition
            defs = {f.field_name: f for f in adapter.get_field_definitions()}
            defs.update({f.field_key: f for f in adapter.get_field_definitions()})
            f_def = defs.get(field.field_name) or (defs.get(field.field_key) if field.field_key else None)
            if f_def:
                validation_error = adapter.validate_field(f_def, clean_value)

        field.value = clean_value
        field.source = source
        field.validation_error = validation_error
        field.status = "Completed" if clean_value and not validation_error else "Pending"

        db.commit()
        db.refresh(field)
        return field


field_mapping_service = FieldMappingService()
