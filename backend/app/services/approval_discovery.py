import json
import os

from dotenv import load_dotenv
from google import genai


load_dotenv()


class ApprovalDiscoveryService:

    def __init__(self):

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is not configured"
            )

        self.client = genai.Client(
            api_key=api_key
        )

        self.model = "gemini-3.6-flash"

    def discover_approvals(
        self,
        business_context,
        regulatory_evidence
    ):

        evidence_text = []

        for item in regulatory_evidence:

            evidence_text.append(
                f"""
SOURCE: {item.get("source")}

RETRIEVAL SCORE: {item.get("score")}

REGULATORY CONTENT:
{item.get("text")}
"""
            )

        prompt = f"""
You are the approval discovery engine for BizClear.

Your task is to identify regulatory approvals, licences,
permits, registrations, clearances, or certificates that
may apply to the business.

BUSINESS INFORMATION:

{json.dumps(
    business_context,
    indent=2
)}

REGULATORY EVIDENCE:

{''.join(evidence_text)}

IMPORTANT RULES:

1. Use ONLY the supplied regulatory evidence.

2. Do NOT invent approvals, licences, permits,
   authorities, laws, fees, deadlines, or requirements.

3. An approval can be suggested only when the supplied
   evidence provides a reasonable basis for suggesting it.

4. If the evidence does not support an approval,
   do not include it.

5. Consider the business industry, business type,
   production type, location, employees, investment,
   pollution category, water requirement, electricity
   requirement, land area, and building area when
   determining applicability.

6. Do not assume that every approval mentioned in the
   evidence applies to every business.

7. Explain why the approval appears applicable.

8. Give the exact regulatory source supporting the
   recommendation.

9. Confidence represents confidence in the recommendation
   based on the supplied evidence and business information.
   It is NOT a legal probability.

10. If applicability is uncertain, use:
    "Review Required"

11. Avoid duplicate approvals.

12. Return ONLY valid JSON.

Return exactly this structure:

{{
    "approvals": [
        {{
            "approval_name": "name of approval",
            "authority": "responsible authority",
            "category": "category",
            "priority": "High",
            "reason": "why this business may require it",
            "evidence": [
                {{
                    "source": "file name",
                    "text": "supporting regulatory text"
                }}
            ],
            "confidence": 0.0,
            "applicability": "Applicable"
        }}
    ]
}}
"""

        try:

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )

        except Exception as error:

            error_text = str(error)

            if (
                "429" in error_text
                or "RESOURCE_EXHAUSTED" in error_text
            ):

                return {
                    "approvals": [],
                    "error": (
                        "AI approval discovery is temporarily "
                        "unavailable because the Gemini API "
                        "quota has been exhausted. "
                        "Please try again after the quota resets "
                        "or upgrade the Gemini API project."
                    )
                }

            return {
                "approvals": [],
                "error": (
                    "AI approval discovery failed: "
                    + error_text
                )
            }

        return self.parse_response(
            response.text
        )

    def parse_response(
        self,
        response_text
    ):

        cleaned = response_text.strip()

        if cleaned.startswith("```"):

            cleaned = cleaned.replace(
                "```json",
                ""
            )

            cleaned = cleaned.replace(
                "```",
                ""
            )

            cleaned = cleaned.strip()

        try:

            return json.loads(
                cleaned
            )

        except json.JSONDecodeError:

            return {
                "approvals": [],
                "error": "AI returned invalid JSON",
                "raw_response": response_text
            }


approval_discovery_service = ApprovalDiscoveryService()