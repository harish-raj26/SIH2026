"""
Adapters package for concrete statutory government department integrations.
"""
from app.government_integrations.adapters.udyam_msme import UdyamMSMEAdapter
from app.government_integrations.adapters.gst_registration import GSTRegistrationAdapter
from app.government_integrations.adapters.tnpcb_cto import TNPCBCTOAdapter
from app.government_integrations.adapters.dish_factory import DISHFactoryAdapter
from app.government_integrations.adapters.tnfrs_fire import TNFRSFireAdapter

__all__ = [
    "UdyamMSMEAdapter",
    "GSTRegistrationAdapter",
    "TNPCBCTOAdapter",
    "DISHFactoryAdapter",
    "TNFRSFireAdapter",
]
