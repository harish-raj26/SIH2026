import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { useNotification } from '../../context/NotificationContext';
import { applicationService } from '../../services/applicationService';
import { fieldService } from '../../services/fieldService';
import { documentService } from '../../services/documentService';
import { approvalService } from '../../services/approvalService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Timeline } from '../../components/common/Timeline';
import { FileDropzone } from '../../components/forms/FileDropzone';
import { AISuggestionCard } from '../../components/ai/AISuggestionCard';
import { BusinessModal } from '../../components/forms/BusinessModal';
import { ApplicationReviewTable } from '../../components/applications/ApplicationReviewTable';
import { GovernmentSubmissionModal } from '../../components/applications/GovernmentSubmissionModal';
import {
  Building2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Send,
  Plus,
  ShieldCheck,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';

export function ApplicationWizardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { businesses, activeBusiness } = useBusiness();
  const { showSuccess, showError, showWarning } = useNotification();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    searchParams.get('business_id') || activeBusiness?.id || ''
  );
  const [selectedApprovalId, setSelectedApprovalId] = useState(
    searchParams.get('approval_id') || ''
  );
  const [approvalsList, setApprovalsList] = useState([]);

  // Active Application state
  const [applicationId, setApplicationId] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  const [fields, setFields] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [complianceCheck, setComplianceCheck] = useState(null);

  // Loading states
  const [creatingApp, setCreatingApp] = useState(false);
  const [generatingFields, setGeneratingFields] = useState(false);
  const [generatingDocs, setGeneratingDocs] = useState(false);
  const [suggestingFieldId, setSuggestingFieldId] = useState(null);
  const [acceptingFieldId, setAcceptingFieldId] = useState(null);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [verifyingDocId, setVerifyingDocId] = useState(null);
  const [checkingCompliance, setCheckingCompliance] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);

  // Load approvals for selected business
  const loadApprovalsForBusiness = useCallback(async (bId) => {
    if (!bId) return;
    try {
      const data = await approvalService.getRoadmap(bId);
      if (data?.roadmap && data.roadmap.length > 0) {
        setApprovalsList(data.roadmap);
      } else {
        const disc = await approvalService.discoverApprovals(bId);
        setApprovalsList(disc.approvals || []);
      }
    } catch (err) {
      console.warn('Error loading approvals for wizard:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedBusinessId) {
      loadApprovalsForBusiness(selectedBusinessId);
    }
  }, [selectedBusinessId, loadApprovalsForBusiness]);

  // Step 1: Initialize / Create Application
  const handleCreateOrResumeApp = async () => {
    if (!selectedBusinessId || !selectedApprovalId) {
      showWarning('Please select both a business entity and an approval requirement.');
      return;
    }

    setCreatingApp(true);
    try {
      const res = await applicationService.createApplication(
        parseInt(selectedBusinessId, 10),
        parseInt(selectedApprovalId, 10)
      );
      const app = res.application;
      setApplicationId(app.id);
      setApplicationData(app);
      showSuccess(`Application draft #${app.id} initialized with official statutory schema!`, 'Application Initialized');

      // Auto-fetch fields
      await fetchAndGenerateFields(app.id);
      setCurrentStep(2);
    } catch (err) {
      showError(err.message || 'Failed to initialize application', 'Creation Error');
    } finally {
      setCreatingApp(false);
    }
  };

  // Step 2: Fetch and generate dynamic fields with deterministic mapping
  const fetchAndGenerateFields = async (appId) => {
    setGeneratingFields(true);
    try {
      const res = await fieldService.generateFields(appId);
      const normalizeFields = (items = []) =>
        items.map((field) => ({
          ...field,
          field_value: field.field_value ?? field.value ?? '',
          validation_error: field.validation_error || null,
        }));

      if (res?.fields && res.fields.length > 0) {
        setFields(normalizeFields(res.fields));
      } else {
        const existing = await fieldService.getFields(appId);
        setFields(normalizeFields(existing.fields || []));
      }
    } catch (err) {
      showError(err.message || 'Failed to derive statutory form fields', 'Fields Error');
    } finally {
      setGeneratingFields(false);
    }
  };

  // Field change
  const handleFieldChange = (fieldId, value) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              field_value: value,
              value: value,
              source: 'user_input',
              status: value ? 'Completed' : 'Pending',
            }
          : f
      )
    );
  };

  // Field blur / save with live validation
  const handleFieldBlur = async (fieldId, val) => {
    try {
      const res = await fieldService.updateField(fieldId, val);
      const updatedField = res.field;

      setFields((prev) =>
        prev.map((f) =>
          f.id === fieldId
            ? {
                ...f,
                field_value: updatedField.value ?? val,
                value: updatedField.value ?? val,
                source: updatedField.source || 'user_input',
                status: updatedField.status || (val ? 'Completed' : 'Pending'),
                validation_error: updatedField.validation_error || null,
              }
            : f
        )
      );

      if (updatedField.validation_error) {
        showWarning(updatedField.validation_error, 'Validation Note');
      }
    } catch (err) {
      const message = err.message || 'Statutory validation error for this field.';
      setFields((prev) =>
        prev.map((f) =>
          f.id === fieldId
            ? {
                ...f,
                status: 'Pending',
                validation_error: message,
              }
            : f
        )
      );
      showError(message, 'Invalid Information');
    }
  };

  // AI Field Suggestion
  const handleSuggestField = async (fieldId) => {
    setSuggestingFieldId(fieldId);
    try {
      const res = await fieldService.suggestField(fieldId);
      const updated = res.field;
      const suggestion = updated.ai_suggestion?.trim();

      if (!suggestion || suggestion.toLowerCase() === 'information not available') {
        showError(
          'AI could not find suitable verified information for this field. Please enter it manually.',
          'AI Suggestion'
        );
        return;
      }

      const acceptRes = await fieldService.acceptSuggestion(fieldId);
      const accepted = acceptRes.field;

      setFields((prev) =>
        prev.map((f) =>
          f.id === fieldId
            ? {
                ...f,
                field_value: accepted.value || suggestion,
                value: accepted.value || suggestion,
                ai_suggestion: null,
                status: accepted.status || 'Completed',
                validation_error: accepted.validation_error || null,
              }
            : f
        )
      );

      showSuccess('Field auto-populated with enterprise data', 'Autofill Complete');
    } catch (err) {
      showError(err.message || 'Failed to generate suggestion', 'Suggestion Error');
    } finally {
      setSuggestingFieldId(null);
    }
  };

  // Proceed to Step 3: Documents
  const handleProceedToDocuments = async () => {
    // Save all fields
    for (const f of fields) {
      if (f.field_value) {
        await fieldService.updateField(f.id, f.field_value);
      }
    }

    setGeneratingDocs(true);
    try {
      const res = await documentService.generateDocuments(applicationId);
      if (res?.documents && res.documents.length > 0) {
        setDocuments(res.documents);
      } else {
        const existing = await documentService.getDocuments(applicationId);
        setDocuments(existing.documents || []);
      }
      setCurrentStep(3);
    } catch (err) {
      showError(err.message || 'Failed to generate statutory documents checklist', 'Documents Error');
    } finally {
      setGeneratingDocs(false);
    }
  };

  // Step 3: Document Upload
  const handleUploadDocument = async (docId, file) => {
    setUploadingDocId(docId);
    try {
      const res = await documentService.uploadDocument(docId, file);
      const updated = res.document;
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, ...updated, status: 'Uploaded' } : d))
      );
      showSuccess(`"${file.name}" uploaded successfully with SHA-256 integrity hash`, 'Upload Complete');
    } catch (err) {
      showError(err.message || 'Document upload failed', 'Upload Error');
    } finally {
      setUploadingDocId(null);
    }
  };

  // Document AI Verify
  const handleVerifyDocument = async (docId) => {
    setVerifyingDocId(docId);
    try {
      const res = await documentService.verifyDocument(docId);
      const updated = res.document;
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, ...updated } : d))
      );
      if (updated.status === 'Verified') {
        showSuccess('Document verified against statutory checklist criteria', 'Statutory Verified');
      } else {
        showWarning('Document flagged discrepancies. Review verification note.', 'Verification Note');
      }
    } catch (err) {
      showError(err.message || 'Document inspection failed', 'Verification Error');
    } finally {
      setVerifyingDocId(null);
    }
  };

  // Proceed to Step 4: Review
  const handleProceedToReview = async () => {
    setCurrentStep(4);
  };

  // Proceed to Step 5: Compliance Check
  const handleProceedToCompliance = async () => {
    setCheckingCompliance(true);
    try {
      const checkRes = await applicationService.checkApplication(applicationId);
      const valRes = await applicationService.validateApplication(applicationId);
      const statusRes = await applicationService.getApplicationStatus(applicationId);

      setComplianceCheck({
        check: checkRes,
        validation: valRes,
        status: statusRes,
      });
      setCurrentStep(5);
    } catch (err) {
      showError(err.message || 'Statutory evaluation failed', 'Evaluation Error');
    } finally {
      setCheckingCompliance(false);
    }
  };

  // Open Submission Modal
  const handleOpenSubmissionModal = () => {
    setIsSubmissionModalOpen(true);
  };

  // Step 6: Final Submission Confirmed
  const handleConfirmedSubmit = async (payload) => {
    setSubmittingApp(true);
    try {
      const res = await applicationService.submitApplication(applicationId, payload);
      showSuccess(res.message || `Application #${applicationId} recorded successfully!`, 'Submission Complete');
      setApplicationData((prev) => ({
        ...prev,
        ...res.application,
        government_app_id: res.government_app_id,
        government_status: res.government_status,
        status: res.application?.status || 'Submitted',
      }));
      setIsSubmissionModalOpen(false);
      setCurrentStep(6);
    } catch (err) {
      showError(err.message || 'Application submission could not be processed', 'Submission Error');
    } finally {
      setSubmittingApp(false);
    }
  };

  const wizardSteps = [
    { id: 1, title: 'Target Approval', subtitle: 'Entity & permit selection' },
    { id: 2, title: 'Form Fields', subtitle: 'Statutory disclosures' },
    { id: 3, title: 'Documents', subtitle: 'Upload & verification' },
    { id: 4, title: 'Dossier Review', subtitle: 'Pre-submission audit' },
    { id: 5, title: 'Compliance Check', subtitle: 'Strict statutory check' },
    { id: 6, title: 'Confirmation', subtitle: 'Authoritative receipt' },
  ];

  const selectedBizObj = businesses.find((b) => b.id.toString() === selectedBusinessId.toString());
  const selectedApprObj = approvalsList.find(
    (a) => (a.id || a.approval_id || a.step)?.toString() === selectedApprovalId.toString()
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8E7] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172126] tracking-tight">
              Statutory Application Processing
            </h1>
            <p className="text-xs sm:text-sm text-[#66757A]">
              Authoritative government application processing pipeline with deterministic enterprise mapping, format validation, and verified reference capture.
            </p>
          </div>

          {applicationId && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs text-[#66757A]">
                Draft ID: <strong className="text-[#006B68]">#{applicationId}</strong>
              </span>
              <StatusBadge status={applicationData?.status || 'Draft'} />
            </div>
          )}
        </div>

        {/* Wizard Timeline Tracker */}
        <div className="pt-2 border-t border-[#E2E8E7]">
          <Timeline steps={wizardSteps} currentStep={currentStep} />
        </div>
      </div>

      {/* ================= STEP 1: ENTITY & APPROVAL SELECTION ================= */}
      {currentStep === 1 && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>1. Select Enterprise & Regulatory Clearance</CardTitle>
            <CardDescription>
              Choose the enterprise entity and specific regulatory approval you are applying for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#172126]">
                Operating Enterprise <span className="text-[#E05252]">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedBusinessId}
                  onChange={(e) => {
                    setSelectedBusinessId(e.target.value);
                    setSelectedApprovalId('');
                  }}
                  className="block w-full rounded-lg border border-[#E2E8E7] bg-white px-3.5 py-2 text-sm text-[#172126] focus:border-[#006B68] focus:ring-2 focus:ring-[#006B68]/15"
                >
                  <option value="">-- Choose Registered Business Entity --</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.industry} • {b.location})
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  icon={Plus}
                  onClick={() => setIsBusinessModalOpen(true)}
                >
                  New
                </Button>
              </div>
            </div>

            {selectedBusinessId && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#172126]">
                  Regulatory Approval / Licence <span className="text-[#E05252]">*</span>
                </label>
                <select
                  value={selectedApprovalId}
                  onChange={(e) => setSelectedApprovalId(e.target.value)}
                  className="block w-full rounded-lg border border-[#E2E8E7] bg-white px-3.5 py-2 text-sm text-[#172126] focus:border-[#006B68] focus:ring-2 focus:ring-[#006B68]/15"
                >
                  <option value="">-- Select Discovered Clearance Requirement --</option>
                  {approvalsList.map((a) => {
                    const aId = a.id || a.approval_id || a.step;
                    const aName = a.name || a.approval_name || a.approval;
                    return (
                      <option key={aId} value={aId}>
                        {aName} — {a.authority} ({a.priority || 'Statutory'} Priority)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {selectedBizObj && selectedApprObj && (
              <div className="p-4 rounded-lg bg-[#E6F2F2] border border-[#BFE0DF] space-y-1 text-xs">
                <p className="font-semibold text-[#003F3D]">Selected Clearance Scope:</p>
                <p className="text-[#004F4D]">
                  Applying for <strong>{selectedApprObj.name || selectedApprObj.approval_name || selectedApprObj.approval}</strong> under{' '}
                  <strong>{selectedApprObj.authority}</strong> on behalf of{' '}
                  <strong>{selectedBizObj.name}</strong>.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              loading={creatingApp}
              disabled={!selectedBusinessId || !selectedApprovalId}
              onClick={handleCreateOrResumeApp}
            >
              Initialize Government Application
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 2: STATUTORY FORM FIELDS ================= */}
      {currentStep === 2 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>2. Statutory Form Fields & Declarations</CardTitle>
                <CardDescription>
                  Enter mandatory regulatory disclosures. BizClear auto-populates verified enterprise values.
                </CardDescription>
              </div>
              <span className="text-xs font-semibold text-[#006B68]">
                {fields.filter((f) => f.field_value && !f.validation_error).length} of {fields.length} Completed
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {generatingFields ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#E6F2F2] text-[#006B68] flex items-center justify-center mx-auto animate-pulse">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#172126]">
                  Loading official statutory schema & auto-mapping enterprise data...
                </p>
              </div>
            ) : fields.length === 0 ? (
              <p className="text-xs text-[#66757A] text-center p-4">
                No specific fields required for this clearance. You may proceed.
              </p>
            ) : (
              fields.map((field) => (
                <div
                  key={field.id}
                  className={`p-4 rounded-lg border bg-white space-y-2 transition-colors ${
                    field.validation_error ? 'border-[#F8D7D7] bg-[#FFFBFB]' : 'border-[#E2E8E7]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-[#172126]">
                          {field.field_name}
                        </label>
                        {field.required && (
                          <span className="text-[10px] text-[#C93D3D] font-medium bg-[#FCEEEE] px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )}
                        {field.source === 'business_profile' && (
                          <span className="text-[10px] text-[#0C6148] font-medium bg-[#E8F6F1] px-1.5 py-0.5 rounded border border-[#C2EAD9]">
                            Auto-filled from Profile
                          </span>
                        )}
                        {field.source === 'government_data' && (
                          <span className="text-[10px] text-[#0369A1] font-medium bg-[#E0F2FE] px-1.5 py-0.5 rounded border border-[#BAE6FD]">
                            Statutory Derived
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#66757A] capitalize">
                        Data Type: <span className="font-mono">{field.field_type || 'text'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Sparkles}
                        loading={suggestingFieldId === field.id}
                        onClick={() => handleSuggestField(field.id)}
                      >
                        AI Suggest
                      </Button>
                    </div>
                  </div>

                  <input
                    type={field.field_type === 'number' ? 'number' : 'text'}
                    value={field.field_value || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    onBlur={(e) => handleFieldBlur(field.id, e.target.value)}
                    placeholder={`Enter ${field.field_name}...`}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:ring-2 ${
                      field.validation_error
                        ? 'border-[#E05252] focus:border-[#E05252] focus:ring-[#E05252]/15'
                        : 'border-[#E2E8E7] focus:border-[#006B68] focus:ring-[#006B68]/15'
                    }`}
                  />

                  {field.validation_error && (
                    <div className="flex items-center gap-1 text-[11px] text-[#C93D3D]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{field.validation_error}</span>
                    </div>
                  )}

                  {field.ai_suggestion && (
                    <AISuggestionCard
                      suggestion={field.ai_suggestion}
                      accepting={acceptingFieldId === field.id}
                      onAccept={() => handleAcceptSuggestion(field.id)}
                      onRegenerate={() => handleSuggestField(field.id)}
                    />
                  )}
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => setCurrentStep(1)}
            >
              Back
            </Button>
            <Button
              variant="primary"
              icon={ArrowRight}
              iconPosition="right"
              loading={generatingDocs}
              onClick={handleProceedToDocuments}
            >
              Proceed to Documents
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 3: DOCUMENT HUB ================= */}
      {currentStep === 3 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>3. Mandatory Documents & Statutory Evidence</CardTitle>
                <CardDescription>
                  Upload certified plans, licences, and affidavits matching departmental checklists.
                </CardDescription>
              </div>
              <span className="text-xs font-semibold text-[#006B68]">
                {documents.filter((d) => d.status === 'Uploaded' || d.status === 'Verified').length} of{' '}
                {documents.length} Uploaded
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.length === 0 ? (
              <p className="text-xs text-[#66757A] text-center p-4">
                No formal attachments required for this clearance step.
              </p>
            ) : (
              documents.map((doc) => (
                <FileDropzone
                  key={doc.id}
                  document={doc}
                  onUpload={handleUploadDocument}
                  onVerify={handleVerifyDocument}
                  uploading={uploadingDocId === doc.id}
                  verifying={verifyingDocId === doc.id}
                />
              ))
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => setCurrentStep(2)}
            >
              Back to Fields
            </Button>
            <Button
              variant="primary"
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleProceedToReview}
            >
              Review Dossier
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 4: DOSSIER REVIEW ================= */}
      {currentStep === 4 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>4. Application Dossier Review</CardTitle>
            <CardDescription>
              Comprehensive audit of all statutory fields, data sources, and document evidence before compliance checking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F8FAF9] border border-[#E2E8E7] text-xs">
              <div>
                <p className="text-[#66757A]">Applicant Enterprise:</p>
                <p className="font-semibold text-[#172126]">{selectedBizObj?.name}</p>
              </div>
              <div>
                <p className="text-[#66757A]">Permit Clearance:</p>
                <p className="font-semibold text-[#006B68]">
                  {selectedApprObj?.name || selectedApprObj?.approval_name || selectedApprObj?.approval}
                </p>
              </div>
              <div>
                <p className="text-[#66757A]">Supervisory Authority:</p>
                <p className="font-medium text-[#172126]">{selectedApprObj?.authority}</p>
              </div>
              <div>
                <p className="text-[#66757A]">Application Status:</p>
                <StatusBadge status={applicationData?.status || 'Draft'} />
              </div>
            </div>

            {/* Application Review Table with Provenance Badges */}
            <ApplicationReviewTable fields={fields} />

            {/* Documents List */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#172126] uppercase tracking-wider">
                Attached Documents ({documents.length})
              </h4>
              <div className="border border-[#E2E8E7] rounded-xl divide-y divide-[#E2E8E7] text-xs overflow-hidden">
                {documents.map((d) => (
                  <div key={d.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-[#F8FAF9]">
                    <div>
                      <span className="font-medium text-[#172126]">{d.document_name}</span>
                      {d.file_hash && (
                        <p className="text-[10px] text-[#66757A] font-mono mt-0.5">
                          SHA-256: {d.file_hash.substring(0, 16)}...
                        </p>
                      )}
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => setCurrentStep(3)}
            >
              Back to Documents
            </Button>
            <Button
              variant="primary"
              icon={ArrowRight}
              iconPosition="right"
              loading={checkingCompliance}
              onClick={handleProceedToCompliance}
            >
              Run Statutory Compliance Check
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 5: COMPLIANCE CHECK ================= */}
      {currentStep === 5 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>5. Statutory Compliance Check</CardTitle>
            <CardDescription>
              Authoritative validation enforcing complete mandatory disclosures and document attachments before submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {complianceCheck && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                    complianceCheck.check?.ready_for_submission
                      ? 'bg-[#E8F6F1] border-[#C2EAD9] text-[#0C6148]'
                      : 'bg-[#FEF6E8] border-[#FDE2B2] text-[#B87707]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {complianceCheck.check?.ready_for_submission ? (
                      <CheckCircle2 className="w-5 h-5 text-[#159A72]" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[#F2A51A]" />
                    )}
                    <span>
                      {complianceCheck.check?.ready_for_submission
                        ? 'Application Validated: Ready for Authoritative Submission'
                        : 'Prerequisite Statutory Items Missing or Invalid'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {complianceCheck.check?.summary ||
                      'All mandatory statutory declarations and uploaded certificates evaluated.'}
                  </p>
                </div>

                {/* Missing / Invalid Items List */}
                {(!complianceCheck.check?.ready_for_submission && (
                  <div className="p-4 rounded-xl bg-[#FFFBFB] border border-[#F8D7D7] text-xs space-y-2">
                    <p className="font-bold text-[#C93D3D]">Items Requiring Attention:</p>
                    {complianceCheck.check?.missing_fields?.length > 0 && (
                      <div>
                        <span className="font-semibold text-[#172126]">Missing Fields: </span>
                        <span className="text-[#C93D3D]">{complianceCheck.check.missing_fields.join(', ')}</span>
                      </div>
                    )}
                    {complianceCheck.check?.invalid_fields?.length > 0 && (
                      <div>
                        <span className="font-semibold text-[#172126]">Invalid Declarations: </span>
                        <span className="text-[#C93D3D]">
                          {complianceCheck.check.invalid_fields.map((f) => f.field || f).join(', ')}
                        </span>
                      </div>
                    )}
                    {complianceCheck.check?.missing_documents?.length > 0 && (
                      <div>
                        <span className="font-semibold text-[#172126]">Missing Documents: </span>
                        <span className="text-[#C93D3D]">{complianceCheck.check.missing_documents.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl border border-[#E2E8E7] bg-white space-y-1">
                    <p className="text-[#66757A]">Statutory Fields</p>
                    <p className="font-bold text-[#172126] text-sm">
                      {complianceCheck.check?.validation_details?.completed_fields ?? 0} /{' '}
                      {complianceCheck.check?.validation_details?.total_fields ?? 0} Valid
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#E2E8E7] bg-white space-y-1">
                    <p className="text-[#66757A]">Attached Documents</p>
                    <p className="font-bold text-[#172126] text-sm">
                      {complianceCheck.check?.validation_details?.verified_documents ?? 0} /{' '}
                      {complianceCheck.check?.validation_details?.total_documents ?? 0} Verified
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#E2E8E7] bg-white space-y-1">
                    <p className="text-[#66757A]">Completion</p>
                    <p className="font-bold text-[#006B68] text-sm">
                      {complianceCheck.check?.completion_percentage ?? 0}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => setCurrentStep(4)}
            >
              Back to Review
            </Button>
            <Button
              variant="primary"
              icon={Send}
              disabled={!complianceCheck?.check?.ready_for_submission}
              onClick={handleOpenSubmissionModal}
            >
              Proceed to Authoritative Government Submission
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 6: SUBMISSION RECEIPT ================= */}
      {currentStep === 6 && (
        <Card className="max-w-2xl mx-auto text-center p-8 space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F6F1] text-[#159A72] flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#172126]">
              Government Application Submitted Successfully
            </h2>
            <p className="text-xs sm:text-sm text-[#66757A] max-w-md mx-auto">
              Your application dossier #{applicationId} has been filed with <strong>{selectedApprObj?.authority || 'the department'}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E2E8E7] text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-[#66757A]">Government Application ID:</span>
              <strong className="text-[#172126] font-mono">
                {applicationData?.government_app_id || applicationData?.government_reference_no || 'Recorded'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66757A]">Enterprise Entity:</span>
              <span className="font-medium text-[#172126]">{selectedBizObj?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66757A]">Permit Clearance:</span>
              <span className="font-medium text-[#006B68]">
                {selectedApprObj?.name || selectedApprObj?.approval_name || selectedApprObj?.approval}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66757A]">Authoritative Department Status:</span>
              <span className="font-semibold text-[#172126]">
                {applicationData?.government_status || 'Under Review by Department'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66757A]">Lifecycle Status:</span>
              <StatusBadge status={applicationData?.status || 'Submitted'} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/applications/${applicationId}`)}
            >
              View Application Details & Track Status
            </Button>
          </div>
        </Card>
      )}

      {/* Modals */}
      <BusinessModal
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
        onSuccess={(newBiz) => {
          if (newBiz?.business_id) {
            setSelectedBusinessId(newBiz.business_id.toString());
          }
        }}
      />

      <GovernmentSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        onSubmit={handleConfirmedSubmit}
        submitting={submittingApp}
        application={applicationData}
        approval={selectedApprObj}
        business={selectedBizObj}
      />
    </div>
  );
}
