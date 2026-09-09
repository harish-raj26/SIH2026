import json
import os
import re

from dotenv import load_dotenv
from google import genai


load_dotenv()


class ApprovalDiscoveryService:

    def __init__(self):

        api_key = os.getenv("GEMINI_API_KEY")

        self.client = None

        if api_key:
            self.client = genai.Client(
                api_key=api_key
            )

        self.model = "gemini-3.6-flash"

        self.ai_mode = os.getenv(
            "AI_MODE",
            "mock"
        ).lower()

    def discover_approvals(
        self,
        business_context,
        regulatory_evidence
    ):

        candidates = self.extract_candidates(
            regulatory_evidence
        )

        if not candidates:

            return {
                "approvals": [],
                "mode": self.ai_mode,
                "evidence_count": len(
                    regulatory_evidence
                ),
                "candidate_count": 0
            }

        if self.ai_mode == "gemini":

            if not self.client:

                return {
                    "approvals": [],
                    "mode": "gemini",
                    "evidence_count": len(
                        regulatory_evidence
                    ),
                    "candidate_count": len(
                        candidates
                    ),
                    "error": (
                        "GEMINI_API_KEY is not configured."
                    )
                }

            return self.analyze_with_ai(
                business_context,
                candidates
            )

        return self.analyze_generic(
            business_context,
            candidates
        )

    def extract_candidates(
        self,
        regulatory_evidence
    ):

        candidates = []

        seen = set()

        for item in regulatory_evidence:

            source = item.get(
                "source"
            )

            text = item.get(
                "text",
                ""
            )

            score = item.get(
                "score",
                0
            )

            if not source or not text:
                continue

            lines = text.splitlines()

            for index, raw_line in enumerate(
                lines
            ):

                line = self.clean_line(
                    raw_line
                )

                if not line:
                    continue

                candidate = self.extract_title_candidate(
                    line
                )

                if not candidate:

                    candidate = (
                        self.extract_explicit_requirement(
                            line
                        )
                    )

                if not candidate:
                    continue

                candidate = self.clean_candidate(
                    candidate
                )

                if not self.is_valid_candidate(
                    candidate
                ):
                    continue

                if not self.is_actual_requirement(
                    line
                ):
                    continue

                if not self.has_complete_approval_name(
                    candidate
                ):
                    continue

                normalized = self.normalize_name(
                    candidate
                )

                if normalized in seen:
                    continue

                seen.add(
                    normalized
                )

                context = self.get_context(
                    lines,
                    index
                )

                candidates.append({

                    "approval_name": candidate,

                    "authority": None,

                    "category": self.infer_category(
                        source,
                        candidate
                    ),

                    "application_name": (
                        f"{candidate} Application"
                    ),

                    "application_url": None,

                    "application_department": None,

                    "priority": "Review Required",

                    "reason": (
                        "This approval was identified "
                        "from a specific regulatory "
                        "requirement in the supplied "
                        "regulatory source."
                    ),

                    "evidence": [
                        {
                            "source": source,
                            "text": text,
                            "score": score,
                            "matched_line": line,
                            "context": context
                        }
                    ],

                    "confidence": round(
                        float(score or 0),
                        2
                    ),

                    "applicability": (
                        "Review Required"
                    )
                })

        return candidates

    def clean_line(
        self,
        line
    ):

        line = line.strip()

        line = re.sub(
            r"^[-•*]\s*",
            "",
            line
        )

        line = re.sub(
            r"^\d+[\.)]\s*",
            "",
            line
        )

        line = re.sub(
            r"^\s*[•▪◦]\s*",
            "",
            line
        )

        line = re.sub(
            r"\s+",
            " ",
            line
        )

        return line.strip()

    def clean_candidate(
        self,
        name
    ):

        name = re.sub(
            r"\s+",
            " ",
            name
        )

        name = name.strip(
            " ,.;:-()"
        )

        name = re.sub(
            r"^(?:an?|the)\s+",
            "",
            name,
            flags=re.IGNORECASE
        )

        return name.strip()

    def extract_title_candidate(
        self,
        line
    ):

        if len(line) > 140:
            return None

        approval_suffix = (
            r"(Licence|License|Registration|"
            r"Approval|Permit|Clearance|Consent|"
            r"Authorization|Authorisation|"
            r"Certificate|Permission|NOC)"
        )

        title_match = re.match(
            rf"^(.{{3,100}}?\b{approval_suffix})[.!]?$",
            line,
            flags=re.IGNORECASE
        )

        if title_match:

            candidate = title_match.group(
                1
            )

            candidate = self.clean_candidate(
                candidate
            )

            if self.has_complete_approval_name(
                candidate
            ):
                return candidate

        return None

    def extract_explicit_requirement(
        self,
        line
    ):

        if len(line) > 180:
            return None

        if self.contains_uncertain_language(
            line
        ):
            return None

        patterns = [

            r"^(?:obtain|secure|apply for)"
            r"\s+(?:an?\s+|the\s+)?"
            r"(.+?\b(?:Licence|License|Registration|"
            r"Approval|Permit|Clearance|Consent|"
            r"Authorization|Authorisation|"
            r"Certificate|Permission|NOC))"
            r"(?:\s+from\b|\.|$)",

            r"^(?:businesses?|companies?|"
            r"establishments?|manufacturers?)"
            r"\s+(?:must|required to|shall)"
            r"\s+(?:obtain|secure|apply for)"
            r"\s+(?:an?\s+|the\s+)?"
            r"(.+?\b(?:Licence|License|Registration|"
            r"Approval|Permit|Clearance|Consent|"
            r"Authorization|Authorisation|"
            r"Certificate|Permission|NOC))"
            r"(?:\s+from\b|\.|$)"
        ]

        for pattern in patterns:

            match = re.match(
                pattern,
                line,
                flags=re.IGNORECASE
            )

            if not match:
                continue

            candidate = match.group(
                1
            ).strip()

            candidate = re.sub(
                r"^(?:an?|the)\s+",
                "",
                candidate,
                flags=re.IGNORECASE
            )

            if self.has_complete_approval_name(
                candidate
            ):
                return candidate

        return None

    def starts_with_sentence_word(
        self,
        text
    ):

        normalized = self.normalize_name(
            text
        )

        sentence_starters = {

            "a",
            "an",
            "the",
            "this",
            "that",
            "these",
            "those",
            "businesses",
            "business",
            "companies",
            "company",
            "manufacturing",
            "manufacturers",
            "establishments",
            "establishment",
            "requirements",
            "possible",
            "potential"
        }

        first_word = (
            normalized.split()[0]
            if normalized
            else ""
        )

        return first_word in sentence_starters

    def contains_uncertain_language(
        self,
        text
    ):

        normalized = self.normalize_name(
            text
        )

        uncertain_phrases = [

            "may require",
            "may be required",
            "may need",
            "might require",
            "might be required",
            "could require",
            "could be required",
            "possible",
            "potential",
            "where applicable",
            "if applicable",
            "as applicable",
            "depending on",
            "where necessary",
            "where required",
            "or appropriate",
            "or relevant"
        ]

        for phrase in uncertain_phrases:

            if phrase in normalized:
                return True

        return False

    def is_sentence_like(
        self,
        line
    ):

        normalized = self.normalize_name(
            line
        )

        if self.contains_uncertain_language(
            line
        ):
            return True

        sentence_patterns = [

            r"^a\s+",
            r"^an\s+",
            r"^the\s+",
            r"^this\s+",
            r"^that\s+",
            r"^these\s+",
            r"^those\s+",
            r"^businesses?\s+",
            r"^companies?\s+",
            r"^manufacturing establishments?\s+",
            r"^manufacturers?\s+",
            r"^requirements?\s+",
            r"^possible\s+",
            r"^potential\s+"
        ]

        for pattern in sentence_patterns:

            if re.match(
                pattern,
                normalized
            ):
                return True

        sentence_verbs = [

            "requires",
            "require",
            "required",
            "includes",
            "include",
            "provides",
            "provide",
            "ensures",
            "ensure",
            "allows",
            "allow",
            "covers",
            "cover"
        ]

        words = normalized.split()

        if len(words) > 7:

            for word in sentence_verbs:

                if word in words:
                    return True

        return False

    def is_actual_requirement(
        self,
        line
    ):

        if self.contains_uncertain_language(
            line
        ):
            return False

        normalized = self.normalize_name(
            line
        )

        explicit_patterns = [

            r"\bobtain\b",
            r"\bsecure\b",
            r"\bapply for\b",
            r"\bmust\b",
            r"\bshall\b",
            r"\bis required\b",
            r"\bare required\b",
            r"\bmandatory\b"
        ]

        for pattern in explicit_patterns:

            if re.search(
                pattern,
                normalized
            ):
                return True

        if self.is_clean_title_line(
            line
        ):
            return True

        return False

    def is_clean_title_line(
        self,
        line
    ):

        if len(line) > 100:
            return False

        if len(line.split()) > 10:
            return False

        if not re.search(
            r"\b(Licence|License|Registration|"
            r"Approval|Permit|Clearance|Consent|"
            r"Authorization|Authorisation|"
            r"Certificate|Permission|NOC)$",
            line,
            flags=re.IGNORECASE
        ):
            return False

        if self.starts_with_sentence_word(
            line
        ):
            return False

        if self.contains_uncertain_language(
            line
        ):
            return False

        return True

    def has_complete_approval_name(
        self,
        candidate
    ):

        candidate = candidate.strip()

        if len(candidate) < 5:
            return False

        words = candidate.split()

        if len(words) < 2:
            return False

        if len(words) > 10:
            return False

        if candidate[0].islower():
            return False

        if re.match(
            r"^(aste|nsport|c|ion|ation)\s",
            candidate,
            flags=re.IGNORECASE
        ):
            return False

        suffix_pattern = (
            r"(Licence|License|Registration|"
            r"Approval|Permit|Clearance|Consent|"
            r"Authorization|Authorisation|"
            r"Certificate|Permission|NOC)$"
        )

        if not re.search(
            suffix_pattern,
            candidate,
            flags=re.IGNORECASE
        ):
            return False

        return True

    def is_valid_candidate(
        self,
        name
    ):

        normalized = self.normalize_name(
            name
        )

        if not normalized:
            return False

        invalid_phrases = [

            "potential approval",
            "potential registration",
            "potential licence",
            "potential license",

            "possible approval",
            "possible registration",
            "possible licence",
            "possible license",

            "regulatory requirements",

            "approval types",
            "registration types",
            "licence types",
            "license types",

            "a business may",

            "the licence",
            "the license",
            "the approval",
            "the registration",

            "manufacturing establishments",

            "requirements may",
            "approval may",
            "registration may",
            "permit may",
            "clearance may",
            "authorization may",
            "authorisation may"
        ]

        for phrase in invalid_phrases:

            if phrase in normalized:
                return False

        if self.starts_with_sentence_word(
            name
        ):
            return False

        approval_words = {

            "licence",
            "license",
            "registration",
            "approval",
            "permit",
            "clearance",
            "consent",
            "authorization",
            "authorisation",
            "certificate",
            "permission",
            "noc"
        }

        words = normalized.split()

        if not any(
            word in approval_words
            for word in words
        ):
            return False

        return True

    def get_context(
        self,
        lines,
        index
    ):

        start = max(
            0,
            index - 2
        )

        end = min(
            len(lines),
            index + 3
        )

        context = []

        for line in lines[start:end]:

            cleaned = line.strip()

            if cleaned:
                context.append(
                    cleaned
                )

        return context

    def normalize_name(
        self,
        name
    ):

        name = name.lower()

        name = re.sub(
            r"[^a-z0-9\s]",
            " ",
            name
        )

        name = re.sub(
            r"\s+",
            " ",
            name
        )

        return name.strip()

    def tokenize(
        self,
        text
    ):

        normalized = self.normalize_name(
            text
        )

        return {
            word
            for word in normalized.split()
            if len(word) > 2
        }

    def build_business_text(
        self,
        business
    ):

        fields = [

            business.get(
                "name"
            ),

            business.get(
                "industry"
            ),

            business.get(
                "business_type"
            ),

            business.get(
                "location"
            ),

            business.get(
                "production_type"
            ),

            business.get(
                "pollution_category"
            ),

            str(
                business.get(
                    "investment"
                )
                or ""
            ),

            str(
                business.get(
                    "employees"
                )
                or ""
            ),

            str(
                business.get(
                    "land_area"
                )
                or ""
            ),

            str(
                business.get(
                    "building_area"
                )
                or ""
            ),

            str(
                business.get(
                    "water_requirement"
                )
                or ""
            ),

            str(
                business.get(
                    "electricity_requirement"
                )
                or ""
            )
        ]

        return " ".join(
            str(field)
            for field in fields
            if field
        )

    def analyze_generic(
        self,
        business_context,
        candidates
    ):

        business_text = (
            self.build_business_text(
                business_context
            )
        )

        business_tokens = (
            self.tokenize(
                business_text
            )
        )

        results = []

        for candidate in candidates:

            evidence = candidate.get(
                "evidence",
                []
            )

            evidence_text = " ".join(
                item.get(
                    "text",
                    ""
                )
                for item in evidence
                if isinstance(
                    item,
                    dict
                )
            )

            source_text = " ".join(
                item.get(
                    "source",
                    ""
                )
                for item in evidence
                if isinstance(
                    item,
                    dict
                )
            )

            candidate_name = (
                candidate.get(
                    "approval_name",
                    ""
                )
            )

            candidate_tokens = (
                self.tokenize(
                    candidate_name
                )
            )

            evidence_tokens = (
                self.tokenize(
                    evidence_text
                )
            )

            source_tokens = (
                self.tokenize(
                    source_text
                )
            )

            evidence_overlap = (
                business_tokens
                &
                evidence_tokens
            )

            source_overlap = (
                business_tokens
                &
                source_tokens
            )

            candidate_overlap = (
                business_tokens
                &
                candidate_tokens
            )

            business_domain_score = (
                self.calculate_domain_score(
                    business_tokens,
                    evidence_tokens,
                    source_tokens,
                    candidate_tokens
                )
            )

            candidate_overlap_score = (
                self.calculate_candidate_score(
                    business_tokens,
                    candidate_tokens
                )
            )

            best_evidence_score = 0.0

            for item in evidence:

                try:

                    item_score = float(
                        item.get(
                            "score",
                            0
                        )
                    )

                except (
                    TypeError,
                    ValueError
                ):

                    item_score = 0.0

                best_evidence_score = max(
                    best_evidence_score,
                    item_score
                )

            applicability = (
                self.determine_applicability(
                    business_context,
                    candidate_name,
                    business_domain_score,
                    candidate_overlap_score,
                    best_evidence_score
                )
            )

            if applicability == "Not Applicable":
                continue

            confidence = (
                self.calculate_confidence(
                    business_domain_score,
                    candidate_overlap_score,
                    best_evidence_score,
                    applicability
                )
            )

            results.append({

                "approval_name": candidate_name,

                "authority": candidate.get(
                    "authority"
                ),

                "category": candidate.get(
                    "category"
                ),

                "application_name": candidate.get(
                    "application_name"
                ),

                "application_url": candidate.get(
                    "application_url"
                ),

                "application_department": candidate.get(
                    "application_department"
                ),

                "priority": self.determine_priority(
                    confidence,
                    applicability
                ),

                "reason": self.build_reason(
                    candidate_name,
                    applicability,
                    evidence_overlap,
                    source_overlap
                ),

                "evidence": evidence,

                "confidence": round(
                    confidence,
                    2
                ),

                "applicability": applicability,

                "matching_terms": sorted(
                    list(
                        evidence_overlap
                        |
                        source_overlap
                        |
                        candidate_overlap
                    )
                )
            })

        return {
            "approvals": results,
            "mode": "generic",
            "evidence_count": len(
                candidates
            ),
            "candidate_count": len(
                candidates
            )
        }

    def calculate_domain_score(
        self,
        business_tokens,
        evidence_tokens,
        source_tokens,
        candidate_tokens
    ):

        if not business_tokens:
            return 0.0

        evidence_overlap = (
            business_tokens
            &
            evidence_tokens
        )

        source_overlap = (
            business_tokens
            &
            source_tokens
        )

        candidate_overlap = (
            business_tokens
            &
            candidate_tokens
        )

        evidence_score = (
            len(evidence_overlap)
            /
            max(
                1,
                len(business_tokens)
            )
        )

        source_score = (
            len(source_overlap)
            /
            max(
                1,
                len(business_tokens)
            )
        )

        candidate_score = (
            len(candidate_overlap)
            /
            max(
                1,
                len(business_tokens)
            )
        )

        return min(
            1.0,
            (
                evidence_score * 0.50
            )
            +
            (
                source_score * 0.20
            )
            +
            (
                candidate_score * 0.30
            )
        )

    def calculate_candidate_score(
        self,
        business_tokens,
        candidate_tokens
    ):

        if not business_tokens:
            return 0.0

        if not candidate_tokens:
            return 0.0

        overlap = (
            business_tokens
            &
            candidate_tokens
        )

        return (
            len(overlap)
            /
            len(candidate_tokens)
        )

    def determine_applicability(
        self,
        business_context,
        candidate_name,
        domain_score,
        candidate_score,
        evidence_score
    ):

        business_text = self.normalize_name(
            self.build_business_text(
                business_context
            )
        )

        candidate = self.normalize_name(
            candidate_name
        )

        if self.has_structure_conflict(
            business_text,
            candidate
        ):
            return "Not Applicable"

        if self.has_strong_business_match(
            business_text,
            candidate
        ):

            if evidence_score >= 0.05:
                return "Applicable"

        if (
            domain_score >= 0.15
            and evidence_score >= 0.07
        ):
            return "Applicable"

        if (
            domain_score >= 0.08
            and evidence_score >= 0.05
        ):
            return "Review Required"

        return "Not Applicable"

    def has_strong_business_match(
        self,
        business_text,
        candidate
    ):

        domain_groups = [

            (
                [
                    "pharmaceutical",
                    "pharmaceuticals",
                    "pharma"
                ],
                [
                    "drug",
                    "pharmaceutical",
                    "chemical",
                    "substance"
                ]
            ),

            (
                [
                    "food",
                    "beverage"
                ],
                [
                    "food",
                    "beverage"
                ]
            ),

            (
                [
                    "hospitality",
                    "hotel",
                    "tourism"
                ],
                [
                    "hotel",
                    "hospitality",
                    "tourism"
                ]
            ),

            (
                [
                    "chemical",
                    "chemicals"
                ],
                [
                    "chemical",
                    "hazardous",
                    "substance"
                ]
            ),

            (
                [
                    "manufacturing",
                    "factory",
                    "industrial"
                ],
                [
                    "factory",
                    "manufacturing",
                    "industrial"
                ]
            )
        ]

        for business_terms, approval_terms in (
            domain_groups
        ):

            business_match = any(
                term in business_text
                for term in business_terms
            )

            approval_match = any(
                term in candidate
                for term in approval_terms
            )

            if (
                business_match
                and approval_match
            ):
                return True

        return False

    def has_structure_conflict(
        self,
        business_text,
        candidate
    ):

        private_limited = (
            "private limited"
            in business_text
            or
            "private limited company"
            in business_text
            or
            "pvt ltd"
            in business_text
        )

        llp = (
            "llp"
            in business_text
            or
            "limited liability partnership"
            in business_text
        )

        partnership = (
            "partnership"
            in business_text
            and
            "limited liability partnership"
            not in business_text
        )

        proprietorship = (
            "proprietorship"
            in business_text
            or
            "sole proprietorship"
            in business_text
        )

        if private_limited:

            forbidden = [

                "llp registration",

                "limited liability partnership registration",

                "partnership registration",

                "proprietorship registration",

                "llp incorporation",

                "partnership incorporation"
            ]

            if any(
                value in candidate
                for value in forbidden
            ):
                return True

        if llp:

            if (
                "partnership registration"
                in candidate
                or
                "proprietorship registration"
                in candidate
            ):
                return True

        if partnership:

            if (
                "llp registration"
                in candidate
                or
                "proprietorship registration"
                in candidate
            ):
                return True

        if proprietorship:

            if (
                "llp registration"
                in candidate
                or
                "partnership registration"
                in candidate
            ):
                return True

        return False

    def calculate_confidence(
        self,
        domain_score,
        candidate_score,
        evidence_score,
        applicability
    ):

        if applicability == "Not Applicable":
            return 0.0

        confidence = (
            evidence_score * 0.45
            +
            domain_score * 0.35
            +
            candidate_score * 0.20
        )

        if applicability == "Applicable":
            confidence += 0.10

        return max(
            0.0,
            min(
                0.95,
                confidence
            )
        )

    def determine_priority(
        self,
        confidence,
        applicability
    ):

        if applicability == "Applicable":

            if confidence >= 0.65:
                return "High"

            if confidence >= 0.40:
                return "Medium"

            return "Low"

        if applicability == "Review Required":
            return "Medium"

        return "Low"

    def build_reason(
        self,
        candidate,
        applicability,
        evidence_overlap,
        source_overlap
    ):

        terms = sorted(
            list(
                evidence_overlap
                |
                source_overlap
            )
        )

        if applicability == "Applicable":

            if terms:

                return (
                    f"{candidate} was identified "
                    f"as applicable based on the "
                    f"regulatory evidence and the "
                    f"business context. Matching "
                    f"context: "
                    f"{', '.join(terms[:8])}."
                )

            return (
                f"{candidate} was identified as "
                f"applicable from the supplied "
                f"regulatory evidence."
            )

        return (
            f"{candidate} has relevant regulatory "
            f"evidence, but additional business "
            f"information is required before its "
            f"applicability can be confirmed."
        )

    def infer_category(
        self,
        source,
        approval_name
    ):

        combined = self.normalize_name(
            source
            + " "
            + approval_name
        )

        category_map = [

            (
                [
                    "pharmaceutical",
                    "chemical",
                    "drug"
                ],
                "Pharmaceutical & Chemical"
            ),

            (
                [
                    "food",
                    "beverage"
                ],
                "Food & Beverage"
            ),

            (
                [
                    "fire"
                ],
                "Fire & Safety"
            ),

            (
                [
                    "electrical",
                    "energy"
                ],
                "Electrical & Energy"
            ),

            (
                [
                    "environment",
                    "pollution",
                    "water",
                    "waste"
                ],
                "Environment"
            ),

            (
                [
                    "labour",
                    "employment"
                ],
                "Labour & Employment"
            ),

            (
                [
                    "building",
                    "land"
                ],
                "Building & Land"
            ),

            (
                [
                    "packaging",
                    "labeling",
                    "labelling"
                ],
                "Packaging & Labelling"
            ),

            (
                [
                    "transport",
                    "storage"
                ],
                "Transport & Storage"
            ),

            (
                [
                    "factory",
                    "industrial"
                ],
                "Factory & Industrial"
            ),

            (
                [
                    "business",
                    "registration"
                ],
                "Business Registration"
            )
        ]

        for keywords, category in (
            category_map
        ):

            if any(
                keyword in combined
                for keyword in keywords
            ):
                return category

        return "Regulatory Compliance"

    def analyze_with_ai(
        self,
        business_context,
        candidates
    ):

        prompt = f"""
You are BizClear's regulatory approval
applicability engine.

BUSINESS:

{json.dumps(
    business_context,
    indent=2
)}

CANDIDATES:

{json.dumps(
    candidates,
    indent=2
)}

STRICT RULES:

1. Use ONLY supplied candidates.

2. Use ONLY supplied regulatory evidence.

3. Do NOT invent approvals.

4. Do NOT invent authorities.

5. Do NOT invent laws.

6. Do NOT invent application URLs.

7. Do NOT treat a sentence describing
possible requirements as an approval.

8. Do NOT recommend alternative legal
structures.

9. If the business is a Private Limited
Company, do not recommend LLP Registration,
Partnership Registration, or Proprietorship
Registration.

10. Use Applicable only when the business
and evidence strongly support applicability.

11. Use Review Required when evidence is
relevant but insufficient.

12. Use Not Applicable when business context
contradicts the candidate.

13. Preserve the candidate approval name.

14. Return ONLY valid JSON.

Return:

{{
    "approvals": [
        {{
            "approval_name": "name",
            "authority": null,
            "category": "category",
            "application_name": "name Application",
            "application_url": null,
            "application_department": null,
            "priority": "High",
            "reason": "reason",
            "evidence": [],
            "confidence": 0.0,
            "applicability": "Applicable"
        }}
    ]
}}
"""

        try:

            response = (
                self.client
                .models
                .generate_content(
                    model=self.model,
                    contents=prompt
                )
            )

        except Exception as error:

            error_text = str(
                error
            )

            if (
                "429" in error_text
                or
                "RESOURCE_EXHAUSTED"
                in error_text
            ):

                return {
                    "approvals": [],
                    "mode": "gemini",
                    "error": (
                        "AI approval discovery "
                        "is temporarily unavailable "
                        "because the Gemini API quota "
                        "has been exhausted."
                    )
                }

            return {
                "approvals": [],
                "mode": "gemini",
                "error": (
                    "AI approval discovery failed: "
                    + error_text
                )
            }

        result = self.parse_response(
            response.text
        )

        result["mode"] = "gemini"

        return result

    def parse_response(
        self,
        response_text
    ):

        cleaned = (
            response_text.strip()
        )

        if cleaned.startswith(
            "```"
        ):

            cleaned = re.sub(
                r"^```(?:json)?\s*",
                "",
                cleaned,
                flags=re.IGNORECASE
            )

            cleaned = re.sub(
                r"\s*```$",
                "",
                cleaned
            )

        try:

            data = json.loads(
                cleaned.strip()
            )

            if not isinstance(
                data,
                dict
            ):

                return {
                    "approvals": []
                }

            if "approvals" not in data:

                data["approvals"] = []

            return data

        except json.JSONDecodeError:

            return {
                "approvals": [],
                "error": (
                    "AI returned invalid JSON"
                ),
                "raw_response": response_text
            }


approval_discovery_service = (
    ApprovalDiscoveryService()
)