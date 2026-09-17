# Byte Forge — SIH2026

Byte Forge is an AI-assisted regulatory approval and compliance workflow prototype. This version improves the existing SIH2026 codebase while keeping its React/Vite + FastAPI/SQLAlchemy architecture.

## What is implemented

- Business profile creation and selection
- RAG-based regulatory knowledge search
- Evidence-backed approval discovery with applicability/confidence
- Approval roadmap
- AI roadmap and compliance Q&A
- Dynamic application fields
- AI-assisted field autofill
- Application completeness/validation
- Dynamic document checklist
- Document upload and prototype consistency verification
- Application submission workflow
- Officer review and approve/reject workflow
- Inspection scheduling and notifications
- Compliance due recording and payment-status tracking
- Compliance lifecycle view
- Applicant / Officer / Administrator UI roles
- SQLite persistence
- CORS configuration
- Mock AI mode so the demo works without a Gemini quota/API key

## Important prototype limitations

The regulatory files under `backend/data/regulations/` are **demo/prototype sources**. They are not official law and must not be presented as legal advice.

Application submission is recorded inside Byte Forge; it is **not a real submission to a government department**.

Document verification is a prototype consistency check. It does not establish authenticity, validity, or government acceptance.

Compliance dues and "payment" only store status in SQLite. No real payment gateway is connected.

Official application URLs are shown only when a verified URL is actually available in the project data.

## Backend

From `backend`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload
```

Open:

`http://127.0.0.1:8000/docs`

For a no-key demo, keep:

```text
AI_MODE=mock
```

To use Gemini, set `AI_MODE=gemini`, provide `GEMINI_API_KEY`, and optionally set `GEMINI_MODEL`.

## Frontend

From `frontend`:

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:

`http://localhost:5173`

Optional frontend API configuration:

```text
VITE_API_BASE_URL=http://localhost:8000
```

## Main workflow

1. Register/select a business.
2. Discover approvals.
3. Review the evidence-backed roadmap.
4. Start an application.
5. Generate application fields.
6. Use AI autofill where business data supports it.
7. Generate the document checklist.
8. Upload and verify documents.
9. Check application readiness.
10. Record prototype submission.
11. Officer reviews the application.
12. Officer can schedule an inspection and record a decision.
13. Applicant sees notifications, inspections and compliance dues.

## Roles

- Applicant — business and application workflow
- Compliance Officer — application review, decisions, inspections and dues
- Administrator — officer-level prototype access

Role selection is a prototype UI mechanism; production authentication/authorization should be connected to an identity provider before deployment.

## Project structure

```text
Bizclear/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── models/
│   │   ├── rag/
│   │   ├── routers/
│   │   └── services/
│   ├── data/regulations/
│   ├── uploads/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
└── README.md
```
