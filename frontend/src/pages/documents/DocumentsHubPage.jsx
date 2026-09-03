import React, { useState, useEffect, useCallback } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { useNotification } from '../../context/NotificationContext';
import { documentService } from '../../services/documentService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileDropzone } from '../../components/forms/FileDropzone';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FolderOpen,
  Search,
  Filter,
  CheckCircle2,
  Building2,
} from 'lucide-react';

export function DocumentsHubPage() {
  const { activeBusiness } = useBusiness();
  const { showSuccess, showError, showWarning } = useNotification();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [verifyingDocId, setVerifyingDocId] = useState(null);

  const loadDocuments = useCallback(async () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    try {
      const data = await documentService.getDocuments(1);
      setDocuments(data.documents || []);
    } catch (err) {
      console.warn('Could not load documents hub:', err.message);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUploadDoc = async (documentId, file) => {
    setUploadingDocId(documentId);
    try {
      const res = await documentService.uploadDocument(documentId, file);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === documentId
            ? { ...d, file_path: res.document.file_path, status: res.document.status }
            : d
        )
      );
      showSuccess(`Uploaded ${file.name}`, 'Document Saved');
    } catch (err) {
      showError(err.message || 'Upload failed', 'Upload Error');
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleVerifyDoc = async (documentId) => {
    setVerifyingDocId(documentId);
    try {
      const res = await documentService.verifyDocument(documentId);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === documentId
            ? {
                ...d,
                status: res.document.status,
                verification_notes: res.document.verification_notes,
              }
            : d
        )
      );
      if (res.document.status === 'Verified') {
        showSuccess('Document verified as compliant with statutory checklist', 'AI Verification Passed');
      } else {
        showWarning('Document verification flagged compliance issues.', 'Verification Notice');
      }
    } catch (err) {
      showError(err.message || 'Verification failed', 'Verification Error');
    } finally {
      setVerifyingDocId(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'verified'
        ? doc.status === 'Verified'
        : filter === 'uploaded'
        ? doc.status === 'Uploaded'
        : doc.status !== 'Verified' && doc.status !== 'Uploaded';

    const matchesSearch =
      !searchQuery.trim() ||
      doc.document_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const verifiedCount = documents.filter((d) => d.status === 'Verified').length;
  const uploadedCount = documents.filter((d) => d.status === 'Uploaded' || d.status === 'Verified').length;

  if (!activeBusiness) {
    return (
      <EmptyState
        icon={Building2}
        title="No Active Enterprise Selected"
        description="Select an enterprise to view and manage compliance documents."
        actionLabel="Go to Enterprises"
        onAction={() => window.location.assign('/businesses')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8E7] shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-[#172126] tracking-tight">
            Document Repository & AI Inspection
          </h1>
          <p className="text-xs sm:text-sm text-[#66757A]">
            Enterprise:{' '}
            <span className="font-semibold text-[#006B68]">
              {activeBusiness.name}
            </span>{' '}
            • {uploadedCount} uploaded ({verifiedCount} AI-verified)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[#E8F6F1] text-[#159A72] border border-[#C2EAD9] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {verifiedCount} Verified by Gemini
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-[#66757A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs sm:text-sm border border-[#E2E8E7] bg-white text-[#172126] placeholder-[#9AA5A8] focus:outline-none focus:border-[#006B68] focus:ring-2 focus:ring-[#006B68]/15"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#F0F4F4] rounded-lg border border-[#E2E8E7] self-stretch sm:self-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'verified', label: 'AI Verified' },
            { id: 'uploaded', label: 'Uploaded' },
            { id: 'pending', label: 'Pending' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-white text-[#006B68] font-semibold shadow-2xs'
                  : 'text-[#66757A] hover:text-[#172126]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No Documents Found"
          description={
            searchQuery
              ? `No documents matching "${searchQuery}".`
              : 'Create an application in the wizard to generate mandatory document requirements.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDocs.map((doc) => (
            <FileDropzone
              key={doc.id}
              document={doc}
              onUpload={handleUploadDoc}
              onVerify={handleVerifyDoc}
              uploading={uploadingDocId === doc.id}
              verifying={verifyingDocId === doc.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
