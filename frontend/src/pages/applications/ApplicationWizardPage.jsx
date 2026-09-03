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
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Timeline } from '../../components/common/Timeline';
import { FileDropzone } from '../../components/forms/FileDropzone';
import { AISuggestionCard } from '../../components/ai/AISuggestionCard';
import { BusinessModal } from '../../components/forms/BusinessModal';
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
} from 'lucide-react';

export function ApplicationWizardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { businesses, activeBusiness } = useBusiness();
  const { showSuccess, showError, showWarning } = useNotification();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
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
      showSuccess(`Application draft #${app.id} created successfully!`, 'Application Initialized');

      // Auto-fetch fields
      await fetchAndGenerateFields(app.id);
      setCurrentStep(2);
    } catch (err) {
      showError(err.message || 'Failed to initialize application', 'Creation Error');
    } finally {
      setCreatingApp(false);
    }
  };

  // Step 2: Fetch and generate dynamic fields
  const fetchAndGenerateFields = async (appId) => {
    setGeneratingFields(true);
    try {
      const existing = await fieldService.getFields(appId);
      if (existing?.fields && existing.fields.length > 0) {
        setFields(existing.fields);
      } else {
        const generated = await fieldService.generateFields(appId);
        setFields(generated.fields || []);
      }
    } catch (err) {
      showError(err.message || 'Failed to generate form fields', 'Fields Error');
    } finally {
      setGeneratingFields(false);
    }
  };

  // Field change
  const handleFieldChange = (fieldId, val) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, field_value: val, status: val ? 'Completed' : 'Pending' } : f))
    );
  };

  // Field blur / save
  const handleFieldBlur = async (fieldId, val) => {
    try {
      await fieldService.updateField(fieldId, val);
    } catch (err) {
      console.error('Failed to save field:', err);
    }
  };

  // AI Field Suggestion
  const handleSuggestField = async (fieldId) => {
    setSuggestingFieldId(fieldId);
    try {
      const res = await fieldService.suggestField(fieldId);
      const updated = res.field;
      setFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, ai_suggestion: updated.ai_suggestion } : f))
      );
      showSuccess('Gemini AI derived a suggested value from enterprise records', 'AI Autofill');
    } catch (err) {
      showError(err.message || 'Failed to generate suggestion', 'AI Suggestion Error');
    } finally {
      setSuggestingFieldId(null);
    }
  };

  // Accept AI Field Suggestion
  const handleAcceptSuggestion = async (fieldId) => {
    setAcceptingFieldId(fieldId);
    try {
      const res = await fieldService.acceptSuggestion(fieldId);
      const updated = res.field;
      setFields((prev) =>
        prev.map((f) =>
          f.id === fieldId
            ? { ...f, field_value: updated.field_value, status: 'Completed', ai_suggestion: null }
            : f
        )
      );
      showSuccess('Field updated with verified enterprise data', 'Suggestion Accepted');
    } catch (err) {
      showError(err.message || 'Failed to accept suggestion', 'Error');
    } finally {
      setAcceptingFieldId(null);
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
      const existing = await documentService.getDocuments(applicationId);
      if (existing?.documents && existing.documents.length > 0) {
        setDocuments(existing.documents);
      } else {
        const generated = await documentService.generateDocuments(applicationId);
        setDocuments(generated.documents || []);
      }
      setCurrentStep(3);
    } catch (err) {
      showError(err.message || 'Failed to generate required documents list', 'Documents Error');
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
      showSuccess(`"${file.name}" uploaded successfully`, 'Upload Complete');
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
        showSuccess('Document verified as compliant with statutory checklist', 'AI Verified');
      } else {
        showWarning('Document flagged discrepancies. Review notes.', 'Verification Note');
      }
    } catch (err) {
      showError(err.message || 'AI document verification failed', 'Verification Error');
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
      showError(err.message || 'Compliance evaluation failed', 'Evaluation Error');
    } finally {
      setCheckingCompliance(false);
    }
  };

  // Step 6: Final Submission
  const handleSubmitFinal = async () => {
    setSubmittingApp(true);
    try {
      const res = await applicationService.submitApplication(applicationId);
      showSuccess(`Application #${applicationId} formally submitted!`, 'Submission Complete');
      setApplicationData((prev) => ({ ...prev, status: res.status || 'Submitted' }));
      setCurrentStep(6);
    } catch (err) {
      showError(err.message || 'Application submission failed', 'Submission Error');
    } finally {
      setSubmittingApp(false);
    }
  };

  const wizardSteps = [
    { id: 1, title: 'Target Approval', subtitle: 'Entity & permit selection' },
    { id: 2, title: 'Form Fields', subtitle: 'Dynamic data entry' },
    { id: 3, title: 'Documents', subtitle: 'Upload & AI verification' },
    { id: 4, title: 'Dossier Review', subtitle: 'Pre-submission audit' },
    { id: 5, title: 'Compliance Check', subtitle: 'Rule validation' },
    { id: 6, title: 'Confirmation', subtitle: 'Submission receipt' },
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
              Statutory Application Wizard
            </h1>
            <p className="text-xs sm:text-sm text-[#66757A]">
              Step-by-step regulatory application workflow with dynamic AI form completion and document verification.
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
            <CardTitle>1. Select Enterprise & Statutory Permit</CardTitle>
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
                    const aName = a.name || a.approval;
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
                  Applying for <strong>{selectedApprObj.name || selectedApprObj.approval}</strong> under{' '}
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
              Initialize Application Draft
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 2: DYNAMIC FORM FIELDS ================= */}
      {currentStep === 2 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>2. Statutory Form Fields & Information</CardTitle>
                <CardDescription>
                  Enter mandatory regulatory disclosures. Use Gemini AI to derive verified values.
                </CardDescription>
              </div>
              <span className="text-xs text-[#66757A]">
                {fields.filter((f) => f.field_value).length} of {fields.length} Completed
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
                  Generating statutory field schema from statutory regulations...
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
                  className="p-4 rounded-lg border border-[#E2E8E7] bg-white space-y-2"
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
                      </div>
                      <p className="text-[11px] text-[#66757A] capitalize">
                        Data Type: {field.field_type || 'text'}
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
                        AI Autofill
                      </Button>
                    </div>
                  </div>

                  <input
                    type={field.field_type === 'number' ? 'number' : 'text'}
                    value={field.field_value || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    onBlur={(e) => handleFieldBlur(field.id, e.target.value)}
                    placeholder={`Enter ${field.field_name}...`}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8E7] focus:border-[#006B68] focus:ring-2 focus:ring-[#006B68]/15"
                  />

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
                <CardTitle>3. Mandatory Documents & AI Inspection</CardTitle>
                <CardDescription>
                  Upload certified plans, licences, and affidavits. Gemini AI will inspect against regulatory criteria.
                </CardDescription>
              </div>
              <span className="text-xs text-[#66757A]">
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
              Review the complete application packet before triggering rule compliance validation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-[#F8FAF9] border border-[#E2E8E7] text-xs">
              <div>
                <p className="text-[#66757A]">Applicant Enterprise:</p>
                <p className="font-semibold text-[#172126]">{selectedBizObj?.name}</p>
              </div>
              <div>
                <p className="text-[#66757A]">Permit Clearance:</p>
                <p className="font-semibold text-[#006B68]">
                  {selectedApprObj?.name || selectedApprObj?.approval}
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

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#172126] uppercase tracking-wider">
                Submitted Field Declarations ({fields.length})
              </h4>
              <div className="border border-[#E2E8E7] rounded-lg divide-y divide-[#E2E8E7] text-xs">
                {fields.map((f) => (
                  <div key={f.id} className="p-3 flex justify-between gap-4">
                    <span className="text-[#66757A]">{f.field_name}</span>
                    <span className="font-semibold text-[#172126] text-right">
                      {f.field_value || <span className="text-[#E05252] italic">Missing</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#172126] uppercase tracking-wider">
                Attached Documents ({documents.length})
              </h4>
              <div className="border border-[#E2E8E7] rounded-lg divide-y divide-[#E2E8E7] text-xs">
                {documents.map((d) => (
                  <div key={d.id} className="p-3 flex items-center justify-between gap-4">
                    <span className="font-medium text-[#172126]">{d.document_name}</span>
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
              Run Statutory Compliance Validation
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 5: COMPLIANCE CHECK ================= */}
      {currentStep === 5 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>5. Statutory Compliance Evaluation</CardTitle>
            <CardDescription>
              Automated rules verification evaluating mandatory fields, documents, and regulatory checklists.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {complianceCheck && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border text-xs space-y-1.5 ${
                    complianceCheck.validation?.valid
                      ? 'bg-[#E8F6F1] border-[#C2EAD9] text-[#0C6148]'
                      : 'bg-[#FEF6E8] border-[#FDE2B2] text-[#B87707]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {complianceCheck.validation?.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-[#159A72]" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[#F2A51A]" />
                    )}
                    <span>
                      {complianceCheck.validation?.valid
                        ? 'Application Validated: Ready for Submission'
                        : 'Prerequisite Items Require Attention'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {complianceCheck.validation?.message ||
                      'All mandatory statutory declarations and uploaded certificates evaluated.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg border border-[#E2E8E7] bg-white space-y-1">
                    <p className="text-[#66757A]">Fields Status</p>
                    <p className="font-bold text-[#172126] text-sm">
                      {complianceCheck.check?.fields_status || 'Complete'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg border border-[#E2E8E7] bg-white space-y-1">
                    <p className="text-[#66757A]">Documents Status</p>
                    <p className="font-bold text-[#172126] text-sm">
                      {complianceCheck.check?.documents_status || 'Verified'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg border border-[#E2E8E7] bg-white space-y-1">
                    <p className="text-[#66757A]">Readiness State</p>
                    <p className="font-bold text-[#006B68] text-sm">
                      {complianceCheck.status?.status || 'Ready'}
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
              loading={submittingApp}
              onClick={handleSubmitFinal}
            >
              Formal Departmental Submission
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 6: SUBMISSION RECEIPT ================= */}
      {currentStep === 6 && (
        <Card className="max-w-2xl mx-auto text-center p-8 space-y-5">
          <div className="w-14 h-14 rounded-xl bg-[#E8F6F1] text-[#159A72] flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#172126]">
              Clearance Application Submitted Successfully
            </h2>
            <p className="text-xs sm:text-sm text-[#66757A] max-w-md mx-auto">
              Your application dossier #{applicationId} has been registered with the regulatory compliance pipeline.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F8FAF9] border border-[#E2E8E7] text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-[#66757A]">Application Reference:</span>
              <strong className="text-[#172126]">BIZC-{applicationId}-2026</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66757A]">Enterprise Entity:</span>
              <span className="font-medium text-[#172126]">{selectedBizObj?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66757A]">Permit Clearance:</span>
              <span className="font-medium text-[#006B68]">
                {selectedApprObj?.name || selectedApprObj?.approval}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66757A]">Filing Status:</span>
              <StatusBadge status="Submitted" />
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
              onClick={() => navigate('/approvals')}
            >
              View Approvals Pipeline
            </Button>
          </div>
        </Card>
      )}

      <BusinessModal
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
        onSuccess={(newBiz) => {
          if (newBiz?.business_id) {
            setSelectedBusinessId(newBiz.business_id.toString());
          }
        }}
      />
    </div>
  );
}
