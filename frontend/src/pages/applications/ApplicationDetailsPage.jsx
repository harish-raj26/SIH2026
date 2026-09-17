import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applicationService } from '../../services/applicationService';
import { fieldService } from '../../services/fieldService';
import { documentService } from '../../services/documentService';
import { useNotification } from '../../context/NotificationContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusHistoryTimeline } from '../../components/applications/StatusHistoryTimeline';
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building2,
  Clock,
  FileCheck2,
} from 'lucide-react';

export function ApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();

  const [applicationData, setApplicationData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [fields, setFields] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [app, st, fl, dc, hist] = await Promise.all([
        applicationService.getApplication(Number(id)),
        applicationService.getApplicationStatus(Number(id)),
        fieldService.getFields(Number(id)),
        documentService.getDocuments(Number(id)),
        applicationService.getApplicationHistory(Number(id)).catch(() => ({ history: [] })),
      ]);
      setApplicationData(app);
      setStatusData(st);
      setFields(fl.fields || []);
      setDocuments(dc.documents || []);
      setHistory(hist.history || []);
    } catch (err) {
      setError(err.message || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Sync status directly from government department
  const handleSyncStatus = async () => {
    setSyncing(true);
    try {
      const res = await applicationService.syncApplicationStatus(Number(id));
      if (res.status_changed) {
        showSuccess(
          `Status updated from authority: ${res.government_status} (${res.normalized_status})`,
          'Status Synchronized'
        );
      } else {
        showInfo(
          `Current verified status: ${res.government_status || 'Under Review'}`,
          'Status Confirmed'
        );
      }
      await loadAll();
    } catch (err) {
      showError(err.message || 'Failed to synchronize with government service', 'Sync Error');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <SkeletonLoader type="card" count={3} />
        <SkeletonLoader type="table" count={3} />
      </div>
    );
  }

  if (error || !applicationData) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Application Record Not Found"
        description={error || `Could not find application record for ID #${id}`}
        actionLabel="Back to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const govAppId = applicationData.government_app_id || applicationData.government_reference_no;
  const portalUrl = applicationData.portal_submission_url || applicationData.application_url;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white border border-[#E2E8E7] shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard"
              className="p-1 rounded-lg text-[#66757A] hover:text-[#172126] hover:bg-[#F8FAF9] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172126] tracking-tight">
              Application #{id}
            </h1>
            <StatusBadge status={applicationData.status} />
            {applicationData.normalized_status && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6F2F2] text-[#006B68] border border-[#BFE0DF]">
                {applicationData.normalized_status}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#66757A] pl-8">
            {govAppId ? (
              <span className="flex items-center gap-1 font-mono font-semibold text-[#172126]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006B68]" />
                Gov Ref: {govAppId}
              </span>
            ) : (
              <span className="italic text-[#66757A]">
                Unsubmitted Draft — No government application number assigned
              </span>
            )}
            {applicationData.last_synced_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Synced: {new Date(applicationData.last_synced_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-8 sm:pl-0">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={syncing}
            onClick={handleSyncStatus}
          >
            Sync from Government
          </Button>

          {portalUrl && (
            <Button
              variant="outline"
              size="sm"
              icon={ExternalLink}
              onClick={() => window.open(portalUrl, '_blank', 'noopener,noreferrer')}
            >
              Official Portal
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/applications/new?app_id=${id}`)}
          >
            Open Wizard
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1">
          <p className="text-xs text-[#66757A] font-medium">Authoritative Department Status</p>
          <p className="text-lg font-bold text-[#172126] truncate">
            {applicationData.government_status || 'Draft Preparation'}
          </p>
          <p className="text-[11px] text-[#006B68] font-medium">
            Mode: {applicationData.submission_mode || 'Portal Assisted'}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-[#66757A] font-medium">Statutory Field Declarations</p>
          <p className="text-2xl font-bold text-[#172126]">
            {fields.filter((f) => f.value || f.field_value).length} / {fields.length}
          </p>
          <p className="text-[11px] text-[#66757A]">
            {fields.every((f) => (f.value || f.field_value) && !f.validation_error)
              ? '100% Compliant'
              : 'Pending verification'}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-[#66757A] font-medium">Statutory Documents Attached</p>
          <p className="text-2xl font-bold text-[#172126]">
            {documents.filter((d) => d.status === 'Uploaded' || d.status === 'Verified').length} / {documents.length}
          </p>
          <p className="text-[11px] text-[#006B68]">
            {documents.filter((d) => d.status === 'Verified').length} Verified
          </p>
        </Card>
      </div>

      {/* Government Status History Timeline */}
      <Card>
        <CardHeader className="py-4 border-b border-[#E2E8E7]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Authoritative Government Status History</CardTitle>
              <CardDescription>
                Immutable record of status updates, inspections, and scrutiny observations from official department records.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="xs"
              icon={RefreshCw}
              loading={syncing}
              onClick={handleSyncStatus}
            >
              Check Now
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <StatusHistoryTimeline history={history} />
        </CardContent>
      </Card>

      {/* Fields List */}
      <Card>
        <CardHeader className="py-4 border-b border-[#E2E8E7]">
          <CardTitle>Statutory Field Declarations & Provenance</CardTitle>
          <CardDescription>
            Field declarations recorded in this application dossier with verified origin sources.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#E2E8E7] text-xs">
            {fields.map((f) => {
              const val = f.value ?? f.field_value;
              return (
                <div key={f.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F8FAF9]">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#172126]">{f.field_name}</p>
                      {f.source === 'business_profile' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E8F6F1] text-[#0C6148] border border-[#C2EAD9]">
                          Profile
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#66757A] capitalize font-mono">
                      Type: {f.field_type} {f.source_field_path ? `• Path: ${f.source_field_path}` : ''}
                    </p>
                  </div>
                  <div className="text-right font-medium text-[#172126] font-mono">
                    {val || <span className="text-[#E05252] italic">Missing</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader className="py-4 border-b border-[#E2E8E7]">
          <CardTitle>Required Documents & Verification Status</CardTitle>
          <CardDescription>
            Attached statutory evidence documents with SHA-256 integrity hashing.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#E2E8E7] text-xs">
            {documents.map((d) => (
              <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F8FAF9]">
                <div>
                  <p className="font-semibold text-[#172126]">{d.document_name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#66757A] mt-0.5 font-mono">
                    <span>Type: {d.document_type}</span>
                    {d.file_hash && <span>• SHA-256: {d.file_hash.substring(0, 12)}...</span>}
                  </div>
                  {d.verification_notes && (
                    <p className="text-[11px] text-[#006B68] mt-1 bg-[#E6F2F2] p-2 rounded">
                      Note: {d.verification_notes}
                    </p>
                  )}
                </div>
                <div className="shrink-0 self-start sm:self-center">
                  <StatusBadge status={d.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
