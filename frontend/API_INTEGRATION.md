# BizClear AI — Frontend to Backend API Integration Documentation

This document specifies the exact mapping between the **BizClear AI Frontend** and the existing **FastAPI Backend**.

---

## 1. System & Health Endpoints

### 1.1 Root Ping
- **Endpoint**: `/`
- **HTTP Method**: `GET`
- **Request Parameters**: None
- **Request Body**: None
- **Response Format**:
  ```json
  {
    "message": "BizClear AI backend is running",
    "status": "online"
  }
  ```
- **Authentication**: Public
- **Frontend Usage**: `src/services/healthService.js` (used in `ProfilePage` and `Navbar` connectivity health check).

---

### 1.2 Health Check
- **Endpoint**: `/api/health`
- **HTTP Method**: `GET`
- **Request Parameters**: None
- **Request Body**: None
- **Response Format**:
  ```json
  {
    "status": "healthy",
    "service": "BizClear AI API"
  }
  ```
- **Authentication**: Public
- **Frontend Usage**: `src/services/healthService.js` (used in `Navbar` dynamic status badge and `ProfilePage` diagnostic panel).

---

## 2. Business Management Endpoints

### 2.1 Register New Business Profile
- **Endpoint**: `/api/businesses/`
- **HTTP Method**: `POST`
- **Request Query Parameters**:
  - `name` (string, required): Legal company name.
  - `industry` (string, required): Industrial domain (e.g., Manufacturing, Food Processing).
  - `location` (string, required): Physical/Jurisdiction location.
  - `business_type` (string, required): Legal entity structure (e.g., Private Limited Company).
  - `investment` (float, required): Capital investment in INR.
  - `employees` (integer, required): Total workforce headcount.
- **Request Body**: None
- **Response Format**:
  ```json
  {
    "message": "Business created successfully",
    "business_id": 1
  }
  ```
- **Authentication**: Public / Session Context
- **Frontend Usage**: `src/services/businessService.js` -> `createBusiness()` (used in `BusinessModal`, `BusinessesPage`, `DashboardPage`).

---

### 2.2 List All Businesses
- **Endpoint**: `/api/businesses/`
- **HTTP Method**: `GET`
- **Request Parameters**: None
- **Request Body**: None
- **Response Format**:
  ```json
  [
    {
      "id": 1,
      "name": "Apex BioTech Labs",
      "industry": "Manufacturing",
      "location": "Pune, Maharashtra",
      "business_type": "Private Limited Company",
      "investment": 50000000.0,
      "employees": 85,
      "land_area": null,
      "building_area": null,
      "pollution_category": "Orange",
      "production_type": null,
      "water_requirement": null,
      "electricity_requirement": null,
      "created_at": "2026-09-03T18:00:00"
    }
  ]
  ```
- **Authentication**: Public / Session Context
- **Frontend Usage**: `src/services/businessService.js` -> `getBusinesses()` (used in `BusinessContext`, `DashboardPage`, `BusinessesPage`, `ActiveBusinessSwitcher`).

---

## 3. Approval Discovery & Statutory Roadmaps

### 3.1 Discover Business Approvals
- **Endpoint**: `/api/approvals/discover/{business_id}`
- **HTTP Method**: `POST`
- **Path Parameter**: `business_id` (integer)
- **Request Body**: None
- **Backend Logic**: Discovers statutory requirements matching business profile, retrieves top-2 regulatory evidence chunks from RAG index, and persists `ApprovalRequirement` records in database.
- **Response Format**:
  ```json
  {
    "business_id": 1,
    "business_name": "Apex BioTech Labs",
    "approval_count": 4,
    "approvals": [
      {
        "id": 1,
        "name": "Factory Licence",
        "authority": "Factories and Labour Department",
        "category": "Factory",
        "priority": "High",
        "status": "Not Started",
        "confidence": 0.8,
        "reason": "The business operates a manufacturing facility.",
        "regulatory_evidence": [
          {
            "source": "factory_licence.txt",
            "score": 0.94,
            "text": "Any factory employing 10 or more workers with power requires registration..."
          }
        ]
      }
    ]
  }
  ```
- **Authentication**: Public / Session Context
- **Frontend Usage**: `src/services/approvalService.js` -> `discoverApprovals()` (used in `ApprovalsPage`, `DashboardPage`).

---

### 3.2 Get Statutory Approval Roadmap
- **Endpoint**: `/api/roadmap/{business_id}`
- **HTTP Method**: `GET`
- **Path Parameter**: `business_id` (integer)
- **Request Body**: None
- **Response Format**:
  ```json
  {
    "business_id": 1,
    "business_name": "Apex BioTech Labs",
    "total_steps": 4,
    "roadmap": [
      {
        "step": 1,
        "approval_id": 1,
        "approval": "Factory Licence",
        "authority": "Factories and Labour Department",
        "category": "Factory",
        "priority": "High",
        "status": "Not Started",
        "confidence": 0.8,
        "application_url": null,
        "regulatory_evidence": [...]
      }
    ]
  }
  ```
- **Authentication**: Public / Session Context
- **Frontend Usage**: `src/services/approvalService.js` -> `getRoadmap()` (used in `ApprovalsPage`, `DashboardPage`, `ApplicationWizardPage`).

---

## 4. AI Assistant & RAG Knowledge Search

### 4.1 AI Executive Compliance Roadmap
- **Endpoint**: `/api/ai/roadmap/{business_id}`
- **HTTP Method**: `GET`
- **Path Parameter**: `business_id` (integer)
- **Request Body**: None
- **Backend Logic**: Google Gemini models generate structured roadmap with preparation steps, required documents, and inspection flags.
- **Response Format**:
  ```json
  {
    "business": "Apex BioTech Labs",
    "summary": "Compliance summary derived from statutory evidence.",
    "roadmap": [
      {
        "step": 1,
        "approval": "Factory Licence",
        "authority": "Factories and Labour Department",
        "priority": "High",
        "why_required": "The business operates a manufacturing facility.",
        "documents_to_prepare": ["Building plan", "Machinery layout"],
        "preparation_steps": ["Conduct site audit", "Submit Form 1"],
        "inspection_required": true,
        "evidence": [...]
      }
    ]
  }
  ```
- **Authentication**: Public / Session Context
- **Frontend Usage**: `src/services/aiService.js` -> `getAIRoadmap()` (used in `ApprovalsPage`).

---

### 4.2 Ask AI Regulatory Compliance Assistant
- **Endpoint**: `/api/ai/ask`
- **HTTP Method**: `POST`
- **Request Query Parameters**:
  - `business_id` (integer): ID of target business.
  - `question` (string): User compliance query.
- **Request Body**: None
- **Response Format**:
  ```json
  {
    "business": "Apex BioTech Labs",
    "question": "What documents are required for Factory Licence?",
    "answer": "Under the Factories Act, you must submit approved building plans, machinery list, and occupier identification."
  }
  ```
- **Authentication**: Public / Session Context
- **Frontend Usage**: `src/services/aiService.js` -> `askAI()` (used in `AiAssistantPage`, `DashboardPage`).

---

### 4.3 Search Regulations (RAG Vector Search)
- **Endpoint**: `/api/rag/search`
- **HTTP Method**: `GET`
- **Request Query Parameters**:
  - `query` (string): Keywords or search text.
  - `top_k` (integer, default: 3): Number of top results.
- **Request Body**: None
- **Response Format**:
  ```json
  {
    "query": "factory safety",
    "results": [
      {
        "source": "factory_licence.txt",
        "text": "Every occupier of a factory must ensure safe working conditions...",
        "score": 0.88
      }
    ]
  }
  ```
- **Authentication**: Public / Session Context
- **Frontend Usage**: `src/services/ragService.js` -> `searchRegulations()` (used in `SearchPage`).

---

## 5. Applications Lifecycle

### 5.1 Create or Fetch Application
- **Endpoint**: `/api/applications/`
- **HTTP Method**: `POST`
- **Request Query Parameters**:
  - `business_id` (integer)
  - `approval_id` (integer)
- **Request Body**: None
- **Response Format**:
  ```json
  {
    "message": "Application created successfully",
    "application": {
      "id": 1,
      "business_id": 1,
      "approval_id": 1,
      "status": "Draft",
      "application_url": null,
      "created_at": "2026-09-03T18:00:00"
    }
  }
  ```
- **Authentication**: Public / Session Context
- **Frontend Usage**: `src/services/applicationService.js` -> `createApplication()` (used in `ApplicationWizardPage`).

---

### 5.2 Check Application Fields Progress
- **Endpoint**: `/api/applications/{application_id}/check`
- **HTTP Method**: `POST`
- **Path Parameter**: `application_id` (integer)
- **Response Format**:
  ```json
  {
    "application_id": 1,
    "status": "Incomplete",
    "completion_percentage": 60,
    "completed_fields": 3,
    "total_required_fields": 5,
    "missing_fields": ["Machinery Information", "Factory Premises Information"],
    "ready_for_compliance": false
  }
  ```
- **Frontend Usage**: `src/services/applicationService.js` -> `checkApplication()` (used in `ApplicationWizardPage`).

---

### 5.3 Validate Application Compliance
- **Endpoint**: `/api/applications/{application_id}/validate`
- **HTTP Method**: `POST`
- **Path Parameter**: `application_id` (integer)
- **Response Format**:
  ```json
  {
    "application_id": 1,
    "validation_status": "Compliant",
    "compliant": true,
    "total_required_fields": 5,
    "missing_fields": []
  }
  ```
- **Frontend Usage**: `src/services/applicationService.js` -> `validateApplication()` (used in `ApplicationWizardPage`).

---

### 5.4 Get Application Status & Document Progress
- **Endpoint**: `/api/applications/{application_id}/status`
- **HTTP Method**: `GET`
- **Path Parameter**: `application_id` (integer)
- **Response Format**:
  ```json
  {
    "application_id": 1,
    "status": "Ready",
    "application_ready": true,
    "fields": {
      "total_required": 5,
      "completed": 5,
      "missing": 0,
      "missing_fields": []
    },
    "documents": {
      "total_required": 3,
      "verified": 3,
      "missing": 0,
      "missing_documents": []
    }
  }
  ```
- **Frontend Usage**: `src/services/applicationService.js` -> `getApplicationStatus()` (used in `ApplicationDetailsPage`, `ApplicationWizardPage`).

---

### 5.5 Submit Application
- **Endpoint**: `/api/applications/{application_id}/submit`
- **HTTP Method**: `POST`
- **Path Parameter**: `application_id` (integer)
- **Response Format**:
  ```json
  {
    "message": "Application submitted successfully",
    "application": {
      "id": 1,
      "business_id": 1,
      "approval_id": 1,
      "status": "Submitted",
      "application_url": null
    }
  }
  ```
- **Error Response (400)**:
  ```json
  {
    "detail": {
      "message": "Application is not ready for submission",
      "missing_fields": [...],
      "missing_documents": [...]
    }
  }
  ```
- **Frontend Usage**: `src/services/applicationService.js` -> `submitApplication()` (used in `ApplicationWizardPage`).

---

## 6. Dynamic Application Fields

### 6.1 Generate Fields with AI
- **Endpoint**: `/api/application-fields/{application_id}/generate`
- **HTTP Method**: `POST`
- **Path Parameter**: `application_id` (integer)
- **Response Format**:
  ```json
  {
    "message": "Application fields generated successfully",
    "application_id": 1,
    "approval": "Factory Licence",
    "field_count": 5,
    "fields": [
      {
        "id": 1,
        "field_name": "Business Entity Information",
        "field_type": "text",
        "required": true,
        "value": null,
        "ai_suggestion": null,
        "status": "Pending"
      }
    ]
  }
  ```
- **Frontend Usage**: `src/services/fieldService.js` -> `generateFields()` (used in `ApplicationWizardPage`).

---

### 6.2 Get Application Fields
- **Endpoint**: `/api/application-fields/{application_id}`
- **HTTP Method**: `GET`
- **Path Parameter**: `application_id` (integer)
- **Response Format**:
  ```json
  {
    "application_id": 1,
    "field_count": 5,
    "fields": [...]
  }
  ```
- **Frontend Usage**: `src/services/fieldService.js` -> `getFields()` (used in `ApplicationWizardPage`, `ApplicationDetailsPage`).

---

### 6.3 Update Application Field Value
- **Endpoint**: `/api/application-fields/{field_id}`
- **HTTP Method**: `PUT`
- **Path Parameter**: `field_id` (integer)
- **Request Body**:
  ```json
  {
    "value": "Apex BioManufacturing Labs Ltd."
  }
  ```
- **Response Format**:
  ```json
  {
    "message": "Application field updated successfully",
    "field": {
      "id": 1,
      "field_name": "Business Entity Information",
      "value": "Apex BioManufacturing Labs Ltd.",
      "status": "Completed"
    }
  }
  ```
- **Frontend Usage**: `src/services/fieldService.js` -> `updateField()` (used in `ApplicationWizardPage`).

---

### 6.4 Generate AI Suggestion for Field
- **Endpoint**: `/api/application-fields/{field_id}/suggest`
- **HTTP Method**: `POST`
- **Path Parameter**: `field_id` (integer)
- **Response Format**:
  ```json
  {
    "message": "AI suggestion generated successfully",
    "field": {
      "id": 1,
      "field_name": "Business Entity Information",
      "ai_suggestion": "Apex BioManufacturing Labs Ltd., Private Limited Company",
      "status": "Pending"
    }
  }
  ```
- **Frontend Usage**: `src/services/fieldService.js` -> `suggestField()` (used in `ApplicationWizardPage`).

---

### 6.5 Accept AI Suggestion
- **Endpoint**: `/api/application-fields/{field_id}/accept-suggestion`
- **HTTP Method**: `POST`
- **Path Parameter**: `field_id` (integer)
- **Response Format**:
  ```json
  {
    "message": "AI suggestion accepted successfully",
    "field": {
      "id": 1,
      "field_name": "Business Entity Information",
      "value": "Apex BioManufacturing Labs Ltd., Private Limited Company",
      "status": "Completed"
    }
  }
  ```
- **Frontend Usage**: `src/services/fieldService.js` -> `acceptSuggestion()` (used in `ApplicationWizardPage`).

---

## 7. Dynamic Documents & AI Verification

### 7.1 Generate Required Documents
- **Endpoint**: `/api/application-documents/{application_id}/generate`
- **HTTP Method**: `POST`
- **Path Parameter**: `application_id` (integer)
- **Response Format**:
  ```json
  {
    "regulatory_evidence": [...],
    "message": "Required documents generated successfully",
    "application_id": 1,
    "approval": "Factory Licence",
    "document_count": 3,
    "documents": [
      {
        "id": 1,
        "document_name": "Factory Building Plan Approval",
        "document_type": "certificate",
        "required": true,
        "status": "Missing",
        "verification_notes": null
      }
    ]
  }
  ```
- **Frontend Usage**: `src/services/documentService.js` -> `generateDocuments()` (used in `ApplicationWizardPage`, `DocumentsHubPage`).

---

### 7.2 Get Application Documents
- **Endpoint**: `/api/application-documents/{application_id}`
- **HTTP Method**: `GET`
- **Path Parameter**: `application_id` (integer)
- **Response Format**:
  ```json
  {
    "application_id": 1,
    "document_count": 3,
    "documents": [...]
  }
  ```
- **Frontend Usage**: `src/services/documentService.js` -> `getDocuments()` (used in `ApplicationWizardPage`, `DocumentsHubPage`, `ApplicationDetailsPage`).

---

### 7.3 Upload Document File
- **Endpoint**: `/api/application-documents/{document_id}/upload`
- **HTTP Method**: `POST`
- **Path Parameter**: `document_id` (integer)
- **Request Format**: `multipart/form-data` with key `file` (binary)
- **Response Format**:
  ```json
  {
    "message": "Document uploaded successfully",
    "document": {
      "id": 1,
      "document_name": "Factory Building Plan Approval",
      "document_type": "certificate",
      "required": true,
      "file_path": "uploads/1_building_plan.pdf",
      "status": "Uploaded",
      "verification_notes": null
    }
  }
  ```
- **Frontend Usage**: `src/services/documentService.js` -> `uploadDocument()` (used in `FileDropzone`, `ApplicationWizardPage`, `DocumentsHubPage`).

---

### 7.4 AI Document Verification
- **Endpoint**: `/api/application-documents/{document_id}/verify`
- **HTTP Method**: `POST`
- **Path Parameter**: `document_id` (integer)
- **Backend Logic**: Reads uploaded document binary, calls Gemini AI model with verification prompt, inspects validity against requirement, and sets `Verified` or `Rejected` status with explanatory notes.
- **Response Format**:
  ```json
  {
    "message": "Document verification completed",
    "document": {
      "id": 1,
      "document_name": "Factory Building Plan Approval",
      "status": "Verified",
      "verification_notes": "Document satisfies statutory requirement with certified layout."
    }
  }
  ```
- **Frontend Usage**: `src/services/documentService.js` -> `verifyDocument()` (used in `FileDropzone`, `ApplicationWizardPage`, `DocumentsHubPage`).
