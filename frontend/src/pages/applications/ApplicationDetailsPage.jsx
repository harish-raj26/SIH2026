import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applicationService } from '../../services/applicationService';
import { fieldService } from '../../services/fieldService';
import { documentService } from '../../services/documentService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ArrowLeft,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

export function ApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [statusData, setStatusData] = useState(null);
  const [fields, setFields] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [st, fl, dc] = await Promise.all([
        applicationService.getApplicationStatus(Number(id)),
        fieldService.getFields(Number(id)),
        documentService.getDocuments(Number(id)),
      ]);
      setStatusData(st);
      setFields(fl.fields || []);
      setDocuments(dc.documents || []);
    } catch (err) {
      setError(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <SkeletonLoader type="card" count={3} />
        <SkeletonLoader type="table" count={3} />
      </div>
    );
  }

  if (error || !statusData) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Application Not Found"
        description={error || `Could not find application record for ID #${id}`}
        actionLabel="Back to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8E7] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-1 rounded-lg text-[#66757A] hover:text-[#172126] hover:bg-[#F8FAF9] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172126] tracking-tight">
              Clearance Application #{id}
            </h1>
            <StatusBadge status={statusData.status} />
          </div>
          <p className="text-xs text-[#66757A] pl-8">
            {statusData.application_ready ? 'All requirements satisfied' : 'Statutory clearance in progress'}
          </p>
        </div>

        <div className="flex items-center gap-2 pl-8 sm:pl-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
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
          <p className="text-xs text-[#66757A] font-medium">Field Declarations</p>
          <p className="text-2xl font-bold text-[#172126]">
            {fields.filter((f) => f.field_value).length} / {fields.length}
          </p>
          <p className="text-[11px] text-[#66757A]">
            {fields.every((f) => f.field_value) ? '100% Completed' : 'Pending input'}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-[#66757A] font-medium">Uploaded Documents</p>
          <p className="text-2xl font-bold text-[#172126]">
            {documents.filter((d) => d.status === 'Uploaded' || d.status === 'Verified').length} / {documents.length}
          </p>
          <p className="text-[11px] text-[#66757A]">
            {documents.filter((d) => d.status === 'Verified').length} AI Verified
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-[#66757A] font-medium">Submission State</p>
          <p className="text-2xl font-bold text-[#006B68]">
            {statusData.status}
          </p>
          <p className="text-[11px] text-[#66757A]">
            {statusData.application_ready ? 'Ready for Authority Review' : 'Draft stage'}
          </p>
        </Card>
      </div>

      {/* Fields List */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle>Mandatory Form Fields & Values</CardTitle>
          <CardDescription>
            Field declarations recorded in this application dossier.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#E2E8E7] text-xs">
            {fields.map((f) => (
              <div key={f.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#172126]">{f.field_name}</p>
                  <p className="text-[11px] text-[#66757A] capitalize">Type: {f.field_type}</p>
                </div>
                <div className="text-right font-medium text-[#172126]">
                  {f.field_value || <span className="text-[#E05252] italic">Missing</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle>Required Documents & Verification Status</CardTitle>
          <CardDescription>
            Attached evidence documents inspected by Gemini AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#E2E8E7] text-xs">
            {documents.map((d) => (
              <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#172126]">{d.document_name}</p>
                  <p className="text-[11px] text-[#66757A] capitalize">Type: {d.document_type}</p>
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
