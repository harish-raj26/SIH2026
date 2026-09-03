# BizClear AI — Frontend Web Application

Modern, production-grade React + Vite + Tailwind CSS frontend interface for the **BizClear AI** regulatory compliance, statutory approval discovery, and automated clearance platform.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0 or newer (v22+ recommended)
- **FastAPI Backend**: Running at `http://localhost:8000`

### 2. Installation
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install
```

### 3. Environment Configuration
Ensure `.env` exists in the `frontend` root:
```env
VITE_API_BASE_URL=http://localhost:8000
```
*(Copy from `.env.example` if not already present)*

### 4. Running the Development Server
```bash
npm run dev
```
The application will be accessible at: **`http://localhost:5173`**

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 📁 Architecture & Folder Structure

```
frontend/
├── .env.example                # Environment configuration template
├── API_INTEGRATION.md          # Complete API endpoints specification & mapping
├── index.html                  # HTML entrypoint with Inter and Outfit typography
├── package.json
├── vite.config.js              # Vite configuration with Tailwind CSS v4 & path aliases
├── src/
│   ├── api/
│   │   └── api.js              # Centralized Axios client with error normalization
│   ├── assets/
│   ├── components/
│   │   ├── ai/                 # AISuggestionCard, RegulatoryEvidenceCard
│   │   ├── common/             # StatusBadge, Timeline, StatCard, SkeletonLoader, EmptyState, ToastContainer
│   │   ├── forms/              # BusinessModal, FileDropzone
│   │   ├── layout/             # Navbar, Sidebar, Footer, ActiveBusinessSwitcher, ThemeToggle
│   │   └── ui/                 # Button, Input, Select, Card, Modal, Tabs, ProgressBar, ConfirmationDialog
│   ├── context/
│   │   ├── AuthContext.jsx     # User authentication, roles & demo switcher
│   │   ├── BusinessContext.jsx # Global active enterprise state & switcher
│   │   ├── NotificationContext.jsx # Toast notifications & persistent notification center
│   │   └── ThemeContext.jsx    # Dark & light mode switcher
│   ├── hooks/
│   ├── layouts/
│   │   ├── AuthLayout.jsx      # Minimalist auth pages container
│   │   ├── MainLayout.jsx      # App shell with responsive sidebar & top navbar
│   │   └── ProtectedRoute.jsx  # Role-based route guard
│   ├── pages/
│   │   ├── auth/               # Login, Register, Forgot Password, Reset Password
│   │   ├── dashboard/          # Enterprise metrics, KPIs, clearances summary & quick actions
│   │   ├── businesses/         # Business registry & onboarding
│   │   ├── approvals/          # AI Approval Discovery, Statutory Roadmap & AI Executive Plan
│   │   ├── applications/       # 6-step dynamic Application Wizard & Application Tracking
│   │   ├── documents/          # Regulatory document repository & AI verification hub
│   │   ├── ai/                 # Conversational compliance assistant with RAG citations
│   │   ├── search/             # Global vector search over regulatory clauses & acts
│   │   ├── officer/            # Clearance officer oversight & audit portal
│   │   ├── profile/            # User settings, role switcher & live FastAPI diagnostics
│   │   └── NotFoundPage.jsx
│   ├── services/               # Separate service modules for each backend domain
│   ├── utils/                  # Constants, currency/date formatters, validators
│   ├── styles/
│   │   └── index.css           # Tailwind CSS design system & glassmorphism tokens
│   ├── App.jsx                 # Router tree & Context Provider hierarchy
│   └── main.jsx
```

---

## 🔐 Demo Accounts & Role Switching

You can switch between user roles instantly from the Navbar / Profile menu or login page:
1. **Applicant**: `rajesh@enterprise.com` (Creates businesses, runs discovery, submits clearance applications)
2. **Compliance Officer**: `sunita.officer@gov.in` (Access to the Officer Audit Portal and compliance oversight)
3. **Administrator**: `admin@bizclear.ai` (Full platform administration)

---

## ⚙️ Backend Compatibility

Every frontend action directly interfaces with the FastAPI backend at `http://localhost:8000`:
- **Statutory Rules & Discovery**: `POST /api/approvals/discover/{business_id}`
- **Prioritized Roadmaps**: `GET /api/roadmap/{business_id}`
- **Gemini Executive AI Roadmaps**: `GET /api/ai/roadmap/{business_id}`
- **RAG Knowledge Search**: `GET /api/rag/search`
- **Dynamic Field Generation**: `POST /api/application-fields/{id}/generate`
- **AI Autofill Suggestion**: `POST /api/application-fields/{field_id}/suggest`
- **Document AI Verification**: `POST /api/application-documents/{document_id}/verify`
- **Compliance Evaluation & Submission**: `POST /api/applications/{id}/check` & `submit`

See [`API_INTEGRATION.md`](./API_INTEGRATION.md) for full endpoint specifications.
