"""
Government Integrations Package for BizClear.
Provides authoritative adapters, strict statutory schemas, deterministic field mapping,
and verified government status tracking.
"""
from app.government_integrations.base import (
    GovernmentIntegration,
    ValidationResult,
    PreparedDossier,
    SubmissionResult,
    StatusCheckResult,
    NormalizedStatus,
)
from app.government_integrations.registry import (
    get_adapter_by_service_code,
    get_adapter_for_approval,
    list_available_government_services,
)

__all__ = [
    "GovernmentIntegration",
    "ValidationResult",
    "PreparedDossier",
    "SubmissionResult",
    "StatusCheckResult",
    "NormalizedStatus",
    "get_adapter_by_service_code",
    "get_adapter_for_approval",
    "list_available_government_services",
]
