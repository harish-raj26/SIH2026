import json
import os
from typing import Any

from dotenv import load_dotenv

load_dotenv()


class AIService:
    """Grounded AI adapter with a deterministic mock mode for demos/tests."""

    def __init__(self):
        self.ai_mode = os.getenv("AI_MODE", "mock").lower()
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.client = None

        if self.ai_mode == "gemini":
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                from google import genai
                self.client = genai.Client(api_key=api_key)

    @property
    def available(self) -> bool:
        return self.ai_mode == "gemini" and self.client is not None

    def _generate(self, prompt: str) -> str:
        if not self.available:
            raise RuntimeError("AI_MODE is not configured for live Gemini.")
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )
        return (response.text or "").strip()

    @staticmethod
    def parse_json(text: str, fallback: Any):
        cleaned = (text or "").strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(cleaned)
        except (json.JSONDecodeError, TypeError):
            return fallback

    def generate_roadmap(self, business, approvals):
        if self.available:
            prompt = self.build_prompt(business, approvals)
            return self.parse_json(self._generate(prompt), {
                "business": business.get("name"),
                "summary": "AI response could not be parsed.",
                "roadmap": [],
            })

        roadmap = []
        for index, approval in enumerate(approvals, start=1):
            roadmap.append({
                "step": index,
                "approval": approval.get("name"),
                "authority": approval.get("authority") or "Review required",
                "priority": approval.get("priority") or "Medium",
                "why_required": approval.get("reason") or "Identified from supplied regulatory evidence.",
                "documents_to_prepare": [],
                "preparation_steps": [
                    "Review the cited regulatory evidence.",
                    "Prepare the required application information.",
                    "Confirm the official department process before submission.",
                ],
                "inspection_required": False,
                "evidence": approval.get("regulatory_evidence", []),
            })
        return {
            "business": business.get("name"),
            "summary": "Deterministic grounded roadmap generated from the supplied regulatory evidence.",
            "mode": "mock",
            "roadmap": roadmap,
        }

    def answer_question(self, business, question, approvals, regulatory_evidence):
        if self.available:
            prompt = f"""You are Byte Forge, a regulatory compliance assistant.
Use only the supplied evidence. Do not invent laws, fees, deadlines, authorities or mandatory requirements.
Business: {json.dumps(business, indent=2)}
Approvals: {json.dumps(approvals, indent=2)}
Evidence: {json.dumps(regulatory_evidence, indent=2)}
Question: {question}
If evidence is insufficient, say so clearly."""
            return self._generate(prompt)

        if not regulatory_evidence:
            return "I could not find sufficiently relevant regulatory evidence in the supplied knowledge base. Please verify the requirement with the responsible authority."

        top = regulatory_evidence[:3]
        lines = [
            "Based on the regulatory evidence currently indexed for Byte Forge:",
            *[f"• {item.get('text', '').strip()} (source: {item.get('source')})" for item in top],
            "",
            "This is a prototype evidence-based answer. Confirm the current official procedure before filing."
        ]
        return "\n".join(lines)

    def suggest_field(self, field_name, business):
        values = {
            "Business Entity Information": f"{business.name} — {business.business_type}",
            "Factory Premises Information": ", ".join(
                str(v) for v in [
                    business.location,
                    f"Land area: {business.land_area}" if business.land_area is not None else "",
                    f"Building area: {business.building_area}" if business.building_area is not None else "",
                ] if v
            ),
            "Manufacturing Activities": " — ".join(
                str(v) for v in [business.industry, business.production_type] if v
            ),
            "Number of Workers": str(business.employees),
        }
        if field_name in values:
            return values[field_name]
        return "Information not available"

    def generate_fields(self, business, approval, evidence):
        if self.available:
            prompt = f"""Return only a JSON array of application information fields.
Business: {business.name}
Approval: {approval.approval_name}
Evidence: {json.dumps(evidence)}
Use objects with field_name, field_type (text|number|date|boolean), required."""
            result = self.parse_json(self._generate(prompt), [])
            if isinstance(result, list) and result:
                return result

        return [
            {"field_name": "Business Entity Information", "field_type": "text", "required": True},
            {"field_name": "Factory Premises Information", "field_type": "text", "required": True},
            {"field_name": "Manufacturing Activities", "field_type": "text", "required": True},
            {"field_name": "Number of Workers", "field_type": "number", "required": True},
            {"field_name": "Other Prescribed Information", "field_type": "text", "required": False},
        ]

    def generate_documents(self, business, approval, evidence):
        if self.available:
            prompt = f"""Return only a JSON array of document objects with document_name, document_type and required.
Do not invent requirements; use the evidence.
Business: {business.name}
Approval: {approval.approval_name}
Evidence: {json.dumps(evidence)}"""
            result = self.parse_json(self._generate(prompt), [])
            if isinstance(result, list):
                return result

        # Conservative prototype defaults: supporting checklist, not a legal claim.
        return [
            {"document_name": "Business Registration / Entity Proof", "document_type": "certificate", "required": True},
            {"document_name": "Site / Premises Information", "document_type": "supporting", "required": True},
        ]

    def verify_document(self, document_name, document_type, filename, content):
        if self.available:
            prompt = f"""Return only JSON: {{\"verified\": true|false, \"verification_notes\": \"...\"}}.
Required document: {document_name}
Type: {document_type}
Filename: {filename}
Do not claim legal authenticity."""
            result = self.parse_json(self._generate(prompt), None)
            if isinstance(result, dict):
                return result

        filename_l = filename.lower()
        name_tokens = [t for t in document_name.lower().replace("/", " ").split() if len(t) > 3]
        matches = sum(token in filename_l for token in name_tokens)
        if matches:
            return {"verified": True, "verification_notes": "Prototype consistency check passed: the filename is consistent with the requested document. Legal authenticity was not verified."}
        return {"verified": False, "verification_notes": "Prototype consistency check could not match the uploaded filename to the requested document. Legal authenticity was not assessed."}

    def build_prompt(self, business, approvals):
        return f"""Create a grounded compliance roadmap as JSON.
Business: {json.dumps(business, indent=2)}
Approvals: {json.dumps(approvals, indent=2)}
Use only supplied evidence and state uncertainty explicitly."""


ai_service = AIService()
