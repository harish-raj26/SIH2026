import json
import os

from dotenv import load_dotenv
from google import genai


load_dotenv()


class AIService:

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

    def generate_roadmap(
        self,
        business,
        approvals
    ):

        prompt = self.build_prompt(
            business,
            approvals
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )

        return self.parse_response(
            response.text
        )

        def answer_question(
        self,
        business,
        question,
        approvals,
        regulatory_evidence
    ):

            prompt = f"""
You are BizClear, an AI regulatory compliance assistant.

Answer the user's compliance question using the
business information, approval information, and
regulatory evidence provided below.

BUSINESS:
{business}

APPROVALS:
{approvals}

REGULATORY EVIDENCE:
{regulatory_evidence}

USER QUESTION:
{question}

IMPORTANT RULES:

1. Use the supplied regulatory evidence as the primary source.
2. Do not invent laws, authorities, fees, deadlines, or requirements.
3. If the evidence does not contain enough information,
   clearly say that the information is insufficient.
4. Give a practical answer that an entrepreneur can understand.
5. Distinguish between confirmed information and uncertainty.
6. Do not claim that an approval is mandatory unless the
   supplied information supports that conclusion.

Return only the answer text.
"""

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
        )

            return response.text
    def answer_question(
        self,
        business,
        question,
        approvals,
        regulatory_evidence
    ):

        prompt = f"""
You are BizClear, an AI regulatory compliance assistant.

Answer the user's compliance question using the
business information, approval information, and
regulatory evidence provided below.

BUSINESS:
{business}

APPROVALS:
{approvals}

REGULATORY EVIDENCE:
{regulatory_evidence}

USER QUESTION:
{question}

IMPORTANT RULES:

1. Use the supplied regulatory evidence as the primary source.
2. Do not invent laws, authorities, fees, deadlines, or requirements.
3. If the evidence is insufficient, clearly say so.
4. Give a practical answer that an entrepreneur can understand.
5. Distinguish confirmed information from uncertainty.
6. Do not claim an approval is mandatory unless the supplied
   information supports that conclusion.

Return only the answer text.
"""

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )

        return response.text

    def build_prompt(
        self,
        business,
        approvals
    ):

        approval_context = []

        for approval in approvals:

            evidence = approval.get(
                "regulatory_evidence",
                []
            )

            evidence_text = []

            for item in evidence:

                evidence_text.append(
                    f"""
SOURCE: {item.get("source")}

SCORE: {item.get("score")}

CONTENT:
{item.get("text")}
"""
                )

            approval_context.append(
                f"""
APPROVAL:
{approval.get("name")}

AUTHORITY:
{approval.get("authority")}

CATEGORY:
{approval.get("category")}

PRIORITY:
{approval.get("priority")}

REASON:
{approval.get("reason")}

REGULATORY EVIDENCE:
{''.join(evidence_text)}
"""
            )

        prompt = f"""
You are BizClear, an AI regulatory compliance assistant.

Create a regulatory approval roadmap for the business.

BUSINESS INFORMATION:

{json.dumps(
    business,
    indent=2
)}

APPROVAL INFORMATION:

{''.join(approval_context)}

IMPORTANT RULES:

1. Use the supplied regulatory evidence.
2. Do not invent laws or regulatory requirements.
3. Do not invent authorities.
4. Do not invent application fees.
5. Do not invent deadlines.
6. Do not claim an inspection is required unless the evidence supports it.
7. If evidence is insufficient, clearly state that.
8. Explain why each approval is required.
9. Give practical preparation steps.
10. Return ONLY valid JSON.

Use this structure:

{{
    "business": "business name",
    "summary": "short compliance summary",
    "roadmap": [
        {{
            "step": 1,
            "approval": "approval name",
            "authority": "authority",
            "priority": "High",
            "why_required": "reason",
            "documents_to_prepare": [],
            "preparation_steps": [],
            "inspection_required": false,
            "evidence": []
        }}
    ]
}}
"""

        return prompt

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
                "error": "AI returned invalid JSON",
                "raw_response": response_text
            }


ai_service = AIService()