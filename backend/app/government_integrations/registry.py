"""
Central Government Integration Service Registry.
Discovers and instantiates appropriate adapters for statutory approval requirements.
"""
from typing import Any, Dict, List, Optional
from app.government_integrations.base import GovernmentIntegration

from app.government_integrations.adapters.udyam_msme import UdyamMSMEAdapter
from app.government_integrations.adapters.gst_registration import GSTRegistrationAdapter
from app.government_integrations.adapters.tnpcb_cto import TNPCBCTOAdapter
from app.government_integrations.adapters.dish_factory import DISHFactoryAdapter
from app.government_integrations.adapters.tnfrs_fire import TNFRSFireAdapter


_ADAPTERS: Dict[str, GovernmentIntegration] = {
    "udyam_msme": UdyamMSMEAdapter(),
    "gst_registration": GSTRegistrationAdapter(),
    "tnpcb_cto": TNPCBCTOAdapter(),
    "dish_factory_license": DISHFactoryAdapter(),
    "tnfrs_fire_noc": TNFRSFireAdapter(),
}

# Lookup map from statutory approval names / aliases to service codes
_APPROVAL_NAME_MAPPINGS: Dict[str, str] = {
    "udyam msme registration certificate": "udyam_msme",
    "udyam msme registration": "udyam_msme",
    "msme registration": "udyam_msme",
    "goods and services tax (gst) registration": "gst_registration",
    "gst registration": "gst_registration",
    "gst registration (reg-01)": "gst_registration",
    "tnpcb consent to establish (cte)": "tnpcb_cto",
    "tnpcb consent to operate (cto)": "tnpcb_cto",
    "tnpcb consent to establish (cte) / consent to operate (cto)": "tnpcb_cto",
    "tnpcb consent to establish (cte) under water and air acts": "tnpcb_cto",
    "tnpcb consent to operate (cto) under water and air acts": "tnpcb_cto",
    "dish factory plan approval & license (form 2)": "dish_factory_license",
    "dish factory license": "dish_factory_license",
    "factory license (form 2)": "dish_factory_license",
    "directorate of industrial safety and health (dish) factory license": "dish_factory_license",
    "tnfrs fire safety compliance certificate / noc": "tnfrs_fire_noc",
    "tnfrs fire safety noc": "tnfrs_fire_noc",
    "fire safety compliance certificate / noc": "tnfrs_fire_noc",
    "fire noc": "tnfrs_fire_noc",
}


def get_adapter_by_service_code(service_code: str) -> Optional[GovernmentIntegration]:
    """Retrieve adapter instance by unique service code."""
    if not service_code:
        return None
    return _ADAPTERS.get(service_code.strip().lower())


def get_adapter_for_approval(approval_name: str, authority: Optional[str] = None) -> Optional[GovernmentIntegration]:
    """
    Intelligently resolve the appropriate real government integration adapter
    based on approval name and governing authority.
    """
    if not approval_name:
        return None

    clean_name = approval_name.strip().lower()

    # Exact alias match
    if clean_name in _APPROVAL_NAME_MAPPINGS:
        code = _APPROVAL_NAME_MAPPINGS[clean_name]
        return _ADAPTERS.get(code)

    # Partial / substring matching
    if "udyam" in clean_name or "msme" in clean_name:
        return _ADAPTERS.get("udyam_msme")
    elif "gst" in clean_name:
        return _ADAPTERS.get("gst_registration")
    elif "tnpcb" in clean_name or "consent to establish" in clean_name or "consent to operate" in clean_name or "pollution" in clean_name:
        return _ADAPTERS.get("tnpcb_cto")
    elif "dish" in clean_name or "factory" in clean_name or "form 2" in clean_name:
        return _ADAPTERS.get("dish_factory_license")
    elif "fire" in clean_name or "tnfrs" in clean_name:
        return _ADAPTERS.get("tnfrs_fire_noc")

    # Fallback to authority-based matching
    if authority:
        auth_clean = authority.strip().lower()
        if "msme" in auth_clean:
            return _ADAPTERS.get("udyam_msme")
        elif "gst" in auth_clean or "cbic" in auth_clean:
            return _ADAPTERS.get("gst_registration")
        elif "tnpcb" in auth_clean or "pollution" in auth_clean:
            return _ADAPTERS.get("tnpcb_cto")
        elif "dish" in auth_clean or "industrial safety" in auth_clean:
            return _ADAPTERS.get("dish_factory_license")
        elif "fire" in auth_clean or "tnfrs" in auth_clean:
            return _ADAPTERS.get("tnfrs_fire_noc")

    # Default to Udyam MSME if no specific adapter found
    return _ADAPTERS.get("udyam_msme")


def list_available_government_services() -> List[Dict[str, Any]]:
    """List all registered and genuinely integrated government services."""
    return [
        {
            "service_code": adapter.service_code,
            "service_name": adapter.service_name,
            "authority_name": adapter.authority_name,
            "portal_url": adapter.portal_url,
            "official_status_url": adapter.official_status_url,
            "auth_mode": adapter.auth_mode,
            "field_count": len(adapter.get_field_definitions()),
            "document_count": len(adapter.get_document_definitions()),
        }
        for adapter in _ADAPTERS.values()
    ]
