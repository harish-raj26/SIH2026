import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { useNotification } from '../../context/NotificationContext';
import { approvalService } from '../../services/approvalService';
import { aiService } from '../../services/aiService';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { RegulatoryEvidenceCard } from '../../components/ai/RegulatoryEvidenceCard';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/ui/Modal';
import {
  ListChecks,
  Sparkles,
  Building2,
  AlertTriangle,
  ArrowRight,
  Layers,
  FileCheck,
  ExternalLink,
  Info,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Landmark,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  SlidersHorizontal,
  Globe2,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import {
  PRIORITY_STYLES,
  STATUTORY_STATUS_STYLES,
  LIFECYCLE_STAGES,
  APPROVAL_CATEGORIES
} from '../../utils/constants';

export function ApprovalsPage() {
  const { activeBusiness, refreshBusinesses } = useBusiness();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('discovered');
  const [approvalsData, setApprovalsData] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [aiRoadmapData, setAiRoadmapData] = useState(null);
  const [sourcesData, setSourcesData] = useState(null);

  // Analysis / Discovery flow state
  const [discovering, setDiscovering] = useState(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [loadingAiRoadmap, setLoadingAiRoadmap] = useState(false);

  // Filter and view state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDocs, setExpandedDocs] = useState({});
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState('all'); // 'all' | 'required' | 'filtered'

  // Discovery progress step items
  const analysisSteps = [
    'Analyzing enterprise business profile & sector...',
    'Evaluating State & District jurisdiction regulations...',
    'Checking Central NSWS & statutory Acts (Factories, EPFO, ESIC)...',
    'Assessing TNPCB Environmental & Pollution category schedule...',
    'Scanning Labour, Safety, and DISH regulatory thresholds...',
    'Evaluating Fire, Electrical CEIG, and Boiler requirements...',
    'Verifying Hazardous materials & International trade conditions...',
    'Finalizing dynamic statutory applicability & roadmap sequence...'
  ];

  const handleDiscover = async () => {
    if (!activeBusiness?.id) return;

    setDiscovering(true);
    setAnalysisStepIndex(0);

    // Animate checklist steps progressively
    const stepInterval = setInterval(() => {
      setAnalysisStepIndex((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      const data = await approvalService.discoverApprovals(activeBusiness.id);
      clearInterval(stepInterval);
      setAnalysisStepIndex(analysisSteps.length);

      setApprovalsData(data);

      const total = data?.total_identified ?? data?.approval_count ?? data?.approvals?.length ?? 0;
      const req = data?.required_count ?? data?.counts?.required ?? 0;
      const cond = data?.conditional_count ?? data?.counts?.conditional ?? 0;
      const ver = data?.verification_count ?? data?.counts?.needs_verification ?? 0;

      showSuccess(
        `Dynamic discovery complete: ${total} approvals identified (${req} Required, ${cond} Conditional, ${ver} Needs Verification).`,
        'Approval Analysis Complete'
      );

      await loadRoadmap(activeBusiness.id);
    } catch (err) {
      clearInterval(stepInterval);
      showError(err.message || 'Approval discovery failed', 'Discovery Error');
    } finally {
      setDiscovering(false);
    }
  };

  const loadRoadmap = useCallback(async (businessId) => {
    if (!businessId) return;
    setLoadingRoadmap(true);
    try {
      const data = await approvalService.getRoadmap(businessId);
      setRoadmapData(data);
    } catch (err) {
      console.warn('Could not fetch statutory roadmap:', err.message);
    } finally {
      setLoadingRoadmap(false);
    }
  }, []);

  const loadSources = async () => {
    try {
      const data = await approvalService.getApprovalSources();
      setSourcesData(data);
      setIsSourcesModalOpen(true);
    } catch (err) {
      showError('Could not load regulatory sources', 'Sources Error');
    }
  };

  const loadAiRoadmap = async () => {
    if (!activeBusiness?.id) return;
    setLoadingAiRoadmap(true);
    try {
      const data = await aiService.getAIRoadmap(activeBusiness.id);
      setAiRoadmapData(data);
      showSuccess('AI Compliance Executive Roadmap generated successfully', 'Gemini AI');
    } catch (err) {
      showError(err.message || 'AI Roadmap generation failed', 'AI Roadmap Error');
    } finally {
      setLoadingAiRoadmap(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) {
      loadRoadmap(activeBusiness.id);
      setApprovalsData(null);
      setAiRoadmapData(null);
    }
  }, [activeBusiness, loadRoadmap]);

  const toggleDocs = (id) => {
    setExpandedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!activeBusiness) {
    return (
      <EmptyState
        icon={Building2}
        title="No Active Enterprise Selected"
        description="Select or register an enterprise entity to discover statutory approvals and view compliance roadmaps."
        actionLabel="Go to Enterprises"
        onAction={() => navigate('/businesses')}
      />
    );
  }

  // Determine displayed approvals
  const rawApprovals = approvalsData?.approvals?.length > 0
    ? approvalsData.approvals
    : roadmapData?.roadmap || [];

  const totalIdentified = approvalsData?.total_identified ?? rawApprovals.length;
  const requiredCount = approvalsData?.required_count ?? rawApprovals.filter(a => (a.approval_status || a.status) === 'REQUIRED').length;
  const conditionalCount = approvalsData?.conditional_count ?? rawApprovals.filter(a => (a.approval_status || a.status) === 'CONDITIONAL').length;
  const verificationCount = approvalsData?.verification_count ?? rawApprovals.filter(a => (a.approval_status || a.status) === 'NEEDS_VERIFICATION').length;

  // Filtered approvals list
  const filteredApprovals = rawApprovals.filter((item) => {
    const itemStatus = (item.approval_status || item.status || 'REQUIRED').toUpperCase();
    if (statusFilter !== 'ALL' && itemStatus !== statusFilter) return false;
    if (stageFilter !== 'ALL' && item.stage !== stageFilter) return false;
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.approval_name?.toLowerCase().includes(q) || item.name?.toLowerCase().includes(q);
      const matchAuth = item.authority?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      const matchReason = item.reason?.toLowerCase().includes(q);
      if (!matchName && !matchAuth && !matchCat && !matchReason) return false;
    }
    return true;
  });

  const getTargetApprovalsForExport = () => {
    if (exportScope === 'required') {
      return rawApprovals.filter(a => (a.approval_status || a.status) === 'REQUIRED');
    }
    if (exportScope === 'filtered') {
      return filteredApprovals;
    }
    return rawApprovals;
  };

  // ---------------------------------------------------------------------------
  // CSV Export Handler
  // ---------------------------------------------------------------------------
  const handleDownloadCSV = () => {
    const target = getTargetApprovalsForExport();
    if (!target || target.length === 0) {
      showError('No approvals available to export. Run discovery first.', 'Export Error');
      return;
    }

    const headers = [
      'Approval Name',
      'Status',
      'Authority / Department',
      'Jurisdiction',
      'Lifecycle Stage',
      'Category',
      'Priority',
      'Why it Applies (Reason)',
      'Required Documents',
      'Processing Timeline',
      'Validity',
      'Indicative Fees',
      'Official Source Type',
      'Official Source URL',
      'Application Portal URL'
    ];

    const rows = target.map((appr) => {
      const docs = Array.isArray(appr.documents_required)
        ? appr.documents_required.join('; ')
        : (appr.documents_required || '');

      return [
        `"${(appr.approval_name || appr.name || '').replace(/"/g, '""')}"`,
        `"${(appr.approval_status || appr.status || 'REQUIRED').replace(/"/g, '""')}"`,
        `"${(appr.authority || '').replace(/"/g, '""')}"`,
        `"${(appr.jurisdiction || 'State').replace(/"/g, '""')}"`,
        `"${(appr.stage || 'Pre-Operation').replace(/"/g, '""')}"`,
        `"${(appr.category || 'General').replace(/"/g, '""')}"`,
        `"${(appr.priority || 'Medium').replace(/"/g, '""')}"`,
        `"${(appr.reason || '').replace(/"/g, '""')}"`,
        `"${docs.replace(/"/g, '""')}"`,
        `"${(appr.timeline || '').replace(/"/g, '""')}"`,
        `"${(appr.validity || '').replace(/"/g, '""')}"`,
        `"${(appr.fees || '').replace(/"/g, '""')}"`,
        `"${(appr.source_type || 'Official Government Source').replace(/"/g, '""')}"`,
        `"${(appr.source_url || '').replace(/"/g, '""')}"`,
        `"${(appr.application_url || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const sanitizedBizName = (activeBusiness?.name || 'Enterprise').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${sanitizedBizName}_Statutory_Approvals_List.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportModalOpen(false);
    showSuccess(`Downloaded ${target.length} approvals as CSV spreadsheet.`, 'CSV Export Complete');
  };

  // ---------------------------------------------------------------------------
  // JSON Export Handler
  // ---------------------------------------------------------------------------
  const handleDownloadJSON = () => {
    const target = getTargetApprovalsForExport();
    if (!target || target.length === 0) {
      showError('No approvals available to export.', 'Export Error');
      return;
    }

    const exportData = {
      enterprise: activeBusiness,
      export_date: new Date().toISOString(),
      total_identified: target.length,
      counts: {
        required: target.filter(a => (a.approval_status || a.status) === 'REQUIRED').length,
        conditional: target.filter(a => (a.approval_status || a.status) === 'CONDITIONAL').length,
        needs_verification: target.filter(a => (a.approval_status || a.status) === 'NEEDS_VERIFICATION').length,
      },
      disclaimer: 'Applicable approvals identified based on the enterprise information and available regulatory sources.',
      approvals: target
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    const sanitizedBizName = (activeBusiness?.name || 'Enterprise').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `${sanitizedBizName}_Statutory_Approvals.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportModalOpen(false);
    showSuccess(`Downloaded ${target.length} approvals as JSON.`, 'JSON Export Complete');
  };

  // ---------------------------------------------------------------------------
  // Print / Save as PDF Report Handler
  // ---------------------------------------------------------------------------
  const handlePrintReport = () => {
    const target = getTargetApprovalsForExport();
    if (!target || target.length === 0) {
      showError('No approvals available to print. Run discovery first.', 'Print Error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError('Pop-up blocked. Please allow pop-ups to print or save as PDF.', 'Print Blocked');
      return;
    }

    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const stages = [
      'Pre-Establishment',
      'Land & Construction',
      'Pre-Operation',
      'Operation',
      'Ongoing Compliance / Renewal'
    ];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Statutory Regulatory Approvals Checklist — ${activeBusiness?.name || 'Enterprise'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #172126; margin: 30px; line-height: 1.4; }
            .header { border-bottom: 2px solid #006B68; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 20px; font-weight: bold; color: #006B68; margin: 0; }
            .subtitle { font-size: 12px; color: #66757A; margin-top: 4px; }
            .biz-card { background: #F8FAF9; border: 1px solid #C5D5D3; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
            .biz-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 11px; }
            .stats { display: flex; gap: 12px; margin-bottom: 16px; }
            .stat-box { flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid #C5D5D3; text-align: center; font-size: 11px; }
            .stat-val { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
            .stage-title { font-size: 13px; font-weight: bold; color: #003F3D; background: #E6F2F2; padding: 6px 10px; border-radius: 4px; margin: 16px 0 8px 0; border-left: 3px solid #006B68; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10.5px; }
            th, td { border: 1px solid #C5D5D3; padding: 6px 8px; text-align: left; vertical-align: top; }
            th { background: #F0F4F4; color: #172126; font-weight: bold; }
            .badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: bold; }
            .badge-req { background: #FCEEEE; color: #C93D3D; border: 1px solid #F8CDCD; }
            .badge-cond { background: #FEF6E8; color: #B87707; border: 1px solid #FDE2B2; }
            .badge-ver { background: #EBF3FF; color: #1D63CB; border: 1px solid #C5DBF8; }
            .docs-list { margin: 4px 0 0 0; padding-left: 14px; font-size: 10px; color: #4D5C61; }
            .disclaimer { margin-top: 24px; border-top: 1px solid #C5D5D3; padding-top: 8px; font-size: 9.5px; color: #66757A; }
            @media print {
              body { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Byte Forge / BizClear — Statutory Regulatory Clearances Dossier</h1>
              <div class="subtitle">Official Approvals & Compliance Checklist • Generated on ${dateStr}</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #006B68; font-weight: bold;">
              Dynamic Statutory Discovery
            </div>
          </div>

          <div class="biz-card">
            <div class="biz-grid">
              <div><strong>Enterprise:</strong> ${activeBusiness?.name || ''}</div>
              <div><strong>Industry Sector:</strong> ${activeBusiness?.industry || ''}</div>
              <div><strong>Sub-sector:</strong> ${activeBusiness?.sub_sector || 'General'}</div>
              <div><strong>Legal Structure:</strong> ${activeBusiness?.business_type || ''}</div>
              <div><strong>Location:</strong> ${activeBusiness?.location || ''}</div>
              <div><strong>State & District:</strong> ${activeBusiness?.district || 'Coimbatore'}, ${activeBusiness?.state || 'Tamil Nadu'}</div>
              <div><strong>Capital Investment:</strong> ₹${activeBusiness?.investment ? Number(activeBusiness.investment).toLocaleString('en-IN') : '0'}</div>
              <div><strong>Workforce:</strong> ${activeBusiness?.employees || ''} Employees</div>
              <div><strong>Factory/Plant:</strong> ${activeBusiness?.factory ? 'Yes' : 'No'}</div>
              <div><strong>Pollution Category:</strong> ${activeBusiness?.pollution_category || 'Orange'}</div>
            </div>
          </div>

          <div class="stats">
            <div class="stat-box"><div class="stat-val text-dark">${target.length}</div>Total Clearances</div>
            <div class="stat-box"><div class="stat-val" style="color:#C93D3D;">${target.filter(a => (a.approval_status || a.status) === 'REQUIRED').length}</div>Mandatory Required</div>
            <div class="stat-box"><div class="stat-val" style="color:#B87707;">${target.filter(a => (a.approval_status || a.status) === 'CONDITIONAL').length}</div>Conditional Clearances</div>
            <div class="stat-box"><div class="stat-val" style="color:#1D63CB;">${target.filter(a => (a.approval_status || a.status) === 'NEEDS_VERIFICATION').length}</div>Needs Verification</div>
          </div>

          ${stages.map(stageName => {
            const items = target.filter(a => (a.stage || 'Pre-Operation') === stageName);
            if (items.length === 0) return '';
            return `
              <div class="stage-title">${stageName} (${items.length} Clearances)</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 24%;">Approval Name</th>
                    <th style="width: 10%;">Status</th>
                    <th style="width: 20%;">Department / Authority</th>
                    <th style="width: 26%;">Why Required (Statutory Trigger)</th>
                    <th style="width: 20%;">Required Documents & Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => {
                    const st = (item.approval_status || item.status || 'REQUIRED').toUpperCase();
                    const badgeClass = st === 'REQUIRED' ? 'badge-req' : st === 'CONDITIONAL' ? 'badge-cond' : 'badge-ver';
                    const docsList = Array.isArray(item.documents_required) ? item.documents_required : [];
                    return `
                      <tr>
                        <td>
                          <strong>${item.approval_name || item.name}</strong><br>
                          <small style="color:#66757A;">${item.category || ''} • ${item.priority || 'Medium'} Priority</small>
                        </td>
                        <td><span class="badge ${badgeClass}">${st}</span></td>
                        <td>
                          ${item.authority || ''}<br>
                          <small style="color:#66757A;">${item.source_type || 'Official Portal'}</small>
                        </td>
                        <td>${item.reason || 'Statutory requirement based on enterprise parameters.'}</td>
                        <td>
                          <strong>Timeline:</strong> ${item.timeline || '15-30 days'}<br>
                          ${docsList.length > 0 ? `
                            <strong>Key Documents:</strong>
                            <ul class="docs-list">
                              ${docsList.slice(0, 3).map(d => `<li>${d}</li>`).join('')}
                              ${docsList.length > 3 ? `<li>+${docsList.length - 3} more</li>` : ''}
                            </ul>
                          ` : ''}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            `;
          }).join('')}

          <div class="disclaimer">
            <strong>Legal Accuracy Advisory:</strong> Applicable approvals identified based on the enterprise information and available regulatory sources. This report serves as an advisory prototype checklist. Statutory procedures, inspection mandates, and fee schedules must be verified with respective government authorities prior to formal submission.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setIsExportModalOpen(false);
  };

  const tabs = [
    {
      id: 'discovered',
      label: 'Statutory Approvals',
      icon: ListChecks,
      badge: totalIdentified,
    },
    {
      id: 'roadmap',
      label: 'Lifecycle Stage Roadmap',
      icon: Layers,
      badge: totalIdentified,
    },
    {
      id: 'ai-roadmap',
      label: 'Executive AI Synthesis',
      icon: Sparkles,
      badge: 'Gemini',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-white border border-[#C5D5D3] shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172126] tracking-tight">
              Dynamic Statutory Approvals & Roadmap
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F2F2] text-[#006B68] border border-[#BFE0DF]">
              Dynamic Rule Engine
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#66757A]">
            Active Enterprise:{' '}
            <span className="font-semibold text-[#006B68]">
              {activeBusiness.name}
            </span>{' '}
            • {activeBusiness.industry} {activeBusiness.sub_sector ? `(${activeBusiness.sub_sector})` : ''} • {activeBusiness.location || activeBusiness.state}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => setIsExportModalOpen(true)}
            disabled={rawApprovals.length === 0}
          >
            Download Approvals List
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Globe2}
            onClick={loadSources}
          >
            Official Sources
          </Button>

          <Button
            variant="primary"
            icon={Sparkles}
            loading={discovering}
            onClick={handleDiscover}
          >
            {discovering ? 'Analyzing Regulations...' : 'Run Approval Discovery'}
          </Button>
        </div>
      </div>

      {/* Statutory Metrics Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
            statusFilter === 'ALL' ? 'border-[#006B68] ring-2 ring-[#006B68]/15 shadow-sm' : 'border-[#C5D5D3] hover:border-[#CBD5D3]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#66757A]">Total Identified</span>
            <FileCheck className="w-4 h-4 text-[#006B68]" />
          </div>
          <p className="text-2xl font-bold text-[#172126] mt-1.5">{totalIdentified}</p>
          <p className="text-[11px] text-[#006B68] font-medium mt-0.5">Statutory Clearances</p>
        </div>

        <div
          onClick={() => setStatusFilter('REQUIRED')}
          className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
            statusFilter === 'REQUIRED' ? 'border-[#C93D3D] ring-2 ring-[#C93D3D]/15 shadow-sm' : 'border-[#C5D5D3] hover:border-[#CBD5D3]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#66757A]">Required</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#E05252]" />
          </div>
          <p className="text-2xl font-bold text-[#C93D3D] mt-1.5">{requiredCount}</p>
          <p className="text-[11px] text-[#66757A] font-medium mt-0.5">Mandatory Clearances</p>
        </div>

        <div
          onClick={() => setStatusFilter('CONDITIONAL')}
          className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
            statusFilter === 'CONDITIONAL' ? 'border-[#B87707] ring-2 ring-[#B87707]/15 shadow-sm' : 'border-[#C5D5D3] hover:border-[#CBD5D3]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#66757A]">Conditional</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#F2A51A]" />
          </div>
          <p className="text-2xl font-bold text-[#B87707] mt-1.5">{conditionalCount}</p>
          <p className="text-[11px] text-[#66757A] font-medium mt-0.5">Triggered by Thresholds</p>
        </div>

        <div
          onClick={() => setStatusFilter('NEEDS_VERIFICATION')}
          className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
            statusFilter === 'NEEDS_VERIFICATION' ? 'border-[#1D63CB] ring-2 ring-[#1D63CB]/15 shadow-sm' : 'border-[#C5D5D3] hover:border-[#CBD5D3]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#66757A]">Needs Verification</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A75E6]" />
          </div>
          <p className="text-2xl font-bold text-[#1D63CB] mt-1.5">{verificationCount}</p>
          <p className="text-[11px] text-[#66757A] font-medium mt-0.5">Parameter Review</p>
        </div>
      </div>

      {/* Legal Accuracy Disclaimer Banner */}
      <div className="p-3.5 rounded-lg bg-[#F0F4F4] border border-[#C5D5D3] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#006B68] shrink-0 mt-0.5" />
        <p className="text-xs text-[#4D5C61] leading-relaxed">
          <strong className="text-[#172126] font-semibold">Statutory Advisory:</strong>{' '}
          Applicable approvals identified based on the enterprise information and available regulatory sources.
          Verify specific department prerequisites before filing formal statutory submissions.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ===================================================================== */}
      {/* TAB 1: STATUTORY DISCOVERED APPROVALS */}
      {/* ===================================================================== */}
      {activeTab === 'discovered' && (
        <div className="space-y-4">
          {/* Animated Checklist Progress Modal / Section during Discovery */}
          {discovering && (
            <Card className="p-6 bg-white border-[#006B68] shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#E6F2F2] text-[#006B68] flex items-center justify-center animate-spin">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172126]">
                    Analyzing Regulatory Requirements...
                  </h3>
                  <p className="text-xs text-[#66757A]">
                    Evaluating statutory Acts, NSWS Central portals, and Tamil Nadu State regulations.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E2E8E7]">
                {analysisSteps.map((s, idx) => {
                  const isDone = idx < analysisStepIndex;
                  const isCurrent = idx === analysisStepIndex;

                  return (
                    <div key={idx} className="flex items-center gap-2.5 text-xs">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#159A72] shrink-0" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[#006B68] border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#C5D5D3] bg-[#F8FAF9] shrink-0" />
                      )}
                      <span className={isDone ? 'text-[#172126] font-medium' : isCurrent ? 'text-[#006B68] font-semibold' : 'text-[#9AA5A8]'}>
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Filter Toolbar */}
          {!discovering && rawApprovals.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-white border border-[#C5D5D3]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#66757A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by approval name, department, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border border-[#C5D5D3] bg-white text-[#172126] placeholder-[#9AA5A8] focus:outline-none focus:border-[#006B68]"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Stage Filter */}
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#C5D5D3] bg-white text-[#172126] text-xs focus:outline-none focus:border-[#006B68]"
                >
                  <option value="ALL">All Lifecycle Stages</option>
                  {LIFECYCLE_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#C5D5D3] bg-white text-[#172126] text-xs focus:outline-none focus:border-[#006B68]"
                >
                  <option value="ALL">All Categories</option>
                  {APPROVAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  size="xs"
                  icon={Download}
                  onClick={() => setIsExportModalOpen(true)}
                >
                  {statusFilter === 'REQUIRED' ? `Download Needed (${filteredApprovals.length})` : `Download List (${filteredApprovals.length})`}
                </Button>

                {(statusFilter !== 'ALL' || stageFilter !== 'ALL' || categoryFilter !== 'ALL' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setStageFilter('ALL');
                      setCategoryFilter('ALL');
                      setSearchQuery('');
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Approvals Cards Grid */}
          {!discovering && rawApprovals.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No Approvals Discovered Yet"
              description="Click 'Run Approval Discovery' to evaluate statutory rules and identify mandatory clearances for this enterprise."
              actionLabel="Run Approval Discovery"
              actionIcon={Sparkles}
              onAction={handleDiscover}
            />
          ) : !discovering && filteredApprovals.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="No Matching Approvals"
              description="No approvals match your current filter criteria."
              actionLabel="Clear Filters"
              onAction={() => {
                setStatusFilter('ALL');
                setStageFilter('ALL');
                setCategoryFilter('ALL');
                setSearchQuery('');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredApprovals.map((appr) => {
                const priorityStyle = PRIORITY_STYLES[appr.priority] || PRIORITY_STYLES.Medium;
                const statusKey = (appr.approval_status || appr.status || 'REQUIRED').toUpperCase();
                const statusStyle = STATUTORY_STATUS_STYLES[statusKey] || STATUTORY_STATUS_STYLES.REQUIRED;
                const isDocsExpanded = expandedDocs[appr.id || appr.name];
                const docsList = Array.isArray(appr.documents_required) ? appr.documents_required : [];

                return (
                  <Card
                    key={appr.id || appr.name}
                    className="flex flex-col justify-between hover:border-[#CBD5D3] transition-all"
                  >
                    <div>
                      {/* Card Header */}
                      <CardHeader className="pb-3 pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1.5">
                            {/* Badges row */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                              >
                                {statusStyle.label}
                              </span>

                              <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
                              >
                                {appr.priority} Priority
                              </span>

                              {appr.stage && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F0F4F4] text-[#4D5C61] border border-[#DDE4E4]">
                                  {appr.stage}
                                </span>
                              )}
                            </div>

                            <CardTitle className="text-base font-bold text-[#172126] pt-1">
                              {appr.approval_name || appr.name}
                            </CardTitle>

                            <p className="text-xs text-[#006B68] font-semibold flex items-center gap-1">
                              <Landmark className="w-3.5 h-3.5 shrink-0" />
                              {appr.authority}
                            </p>
                          </div>

                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F8FAF9] text-[#4D5C61] border border-[#E2E8E7] shrink-0">
                            {appr.category || 'General'}
                          </span>
                        </div>
                      </CardHeader>

                      {/* Card Body */}
                      <CardContent className="space-y-3 pt-2 text-xs">
                        {/* Why it applies trigger reason */}
                        {appr.reason && (
                          <div className="p-3 rounded-lg bg-[#F8FAF9] border border-[#E2E8E7] text-[#172126] space-y-1">
                            <span className="font-bold text-[#006B68] block">
                              Why it applies:
                            </span>
                            <p className="text-xs text-[#4D5C61] leading-relaxed">
                              {appr.reason}
                            </p>
                          </div>
                        )}

                        {/* Statutory Parameters Grid */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white border border-[#E2E8E7] text-[11px]">
                          <div>
                            <span className="text-[#66757A] block">Processing Timeline:</span>
                            <span className="font-semibold text-[#172126]">{appr.timeline || '15 - 30 working days'}</span>
                          </div>
                          <div>
                            <span className="text-[#66757A] block">Validity:</span>
                            <span className="font-semibold text-[#172126]">{appr.validity || '1 to 5 Years'}</span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-[#F0F4F4]">
                            <span className="text-[#66757A] block">Indicative Fees:</span>
                            <span className="font-medium text-[#172126]">{appr.fees || 'Prescribed schedule fee'}</span>
                          </div>
                        </div>

                        {/* Expandable Required Documents */}
                        {docsList.length > 0 && (
                          <div className="border border-[#E2E8E7] rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleDocs(appr.id || appr.name)}
                              className="w-full px-3 py-2 bg-[#F8FAF9] flex items-center justify-between text-xs font-semibold text-[#172126] hover:bg-[#F0F4F4] transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[#006B68]" />
                                Required Documents ({docsList.length})
                              </span>
                              {isDocsExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-[#66757A]" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-[#66757A]" />
                              )}
                            </button>

                            {isDocsExpanded && (
                              <div className="p-3 bg-white space-y-1.5 border-t border-[#E2E8E7]">
                                {docsList.map((doc, dIdx) => (
                                  <div key={dIdx} className="flex items-start gap-2 text-[11px] text-[#4D5C61]">
                                    <CheckCircle2 className="w-3 h-3 text-[#159A72] shrink-0 mt-0.5" />
                                    <span>{doc}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Regulatory Citations */}
                        {appr.regulatory_evidence?.length > 0 && (
                          <RegulatoryEvidenceCard evidence={appr.regulatory_evidence} />
                        )}

                        {/* Official Source Provenance */}
                        <div className="flex items-center justify-between text-[11px] text-[#66757A] pt-1">
                          <span className="truncate">
                            Source: <strong className="text-[#172126]">{appr.source_type || 'Official Government Source'}</strong>
                          </span>
                          {appr.last_verified && (
                            <span className="shrink-0 text-[10px] text-[#9AA5A8]">
                              Verified: {appr.last_verified}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </div>

                    {/* Card Footer Actions */}
                    <CardFooter className="flex items-center justify-between gap-2 pt-3 border-t border-[#E2E8E7]">
                      {appr.source_url ? (
                        <a
                          href={appr.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#006B68] hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Official Source
                        </a>
                      ) : (
                        <span className="text-xs text-[#9AA5A8]">Official Portal Verified</span>
                      )}

                      <Button
                        size="xs"
                        variant="primary"
                        icon={ArrowRight}
                        iconPosition="right"
                        onClick={() =>
                          navigate(
                            `/applications/new?business_id=${activeBusiness.id}&approval_id=${appr.id || appr.approval_id || 1}`
                          )
                        }
                      >
                        Start Application
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: LIFECYCLE STAGE & DEPENDENCY ROADMAP */}
      {/* ===================================================================== */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {/* Statutory Dependency Chain Diagram */}
          <Card className="p-5 bg-[#F8FAF9] border-[#C5D5D3]">
            <CardHeader className="pb-3 pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-[#172126] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#006B68]" />
                  Statutory Prerequisite Clearance Flow
                </CardTitle>
                <CardDescription className="text-xs">
                  Government approvals operate in sequential dependency. Complete preceding approvals before submitting subsequent applications.
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="xs"
                icon={Download}
                onClick={() => {
                  setExportScope('all');
                  setIsExportModalOpen(true);
                }}
              >
                Download Roadmap
              </Button>
            </CardHeader>

            <CardContent className="pt-2">
              <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-[#172126]">
                <span className="px-3 py-1.5 rounded-lg bg-white border border-[#C5D5D3] shadow-2xs">
                  1. Company Inc. / Land Allotment
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#006B68]" />
                <span className="px-3 py-1.5 rounded-lg bg-white border border-[#C5D5D3] shadow-2xs">
                  2. Building & Planning Approval
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#006B68]" />
                <span className="px-3 py-1.5 rounded-lg bg-white border border-[#C5D5D3] shadow-2xs">
                  3. Consent to Establish (CTE)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#006B68]" />
                <span className="px-3 py-1.5 rounded-lg bg-white border border-[#C5D5D3] shadow-2xs">
                  4. Fire NOC & DISH Factory License
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#006B68]" />
                <span className="px-3 py-1.5 rounded-lg bg-[#E6F2F2] border border-[#BFE0DF] text-[#006B68] shadow-2xs">
                  5. Consent to Operate (CTO) & Trade License
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 5 Sequential Stages */}
          {LIFECYCLE_STAGES.map((stageName, sIdx) => {
            const stageApprovals = (roadmapData?.roadmap || rawApprovals).filter(
              (a) => (a.stage || 'Pre-Operation') === stageName
            );

            if (stageApprovals.length === 0) return null;

            return (
              <Card key={stageName} className="overflow-hidden border-[#C5D5D3]">
                <div className="px-5 py-3.5 bg-[#F0F4F4] border-b border-[#C5D5D3] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#006B68] text-white flex items-center justify-center text-xs font-bold">
                      {sIdx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#172126]">
                        Stage {sIdx + 1}: {stageName}
                      </h3>
                      <p className="text-[11px] text-[#66757A]">
                        {stageApprovals.length} Statutory Clearances in this phase
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-[#006B68]">
                    Sequential Phase
                  </span>
                </div>

                <CardContent className="p-4 space-y-3">
                  {stageApprovals.map((step) => {
                    const pStyle = PRIORITY_STYLES[step.priority] || PRIORITY_STYLES.Medium;
                    const statusKey = (step.approval_status || step.status || 'REQUIRED').toUpperCase();
                    const statusStyle = STATUTORY_STATUS_STYLES[statusKey] || STATUTORY_STATUS_STYLES.REQUIRED;

                    return (
                      <div
                        key={step.step || step.id || step.approval_name}
                        className="p-3.5 rounded-lg border border-[#E2E8E7] bg-white hover:bg-[#F8FAF9] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-[#E6F2F2] text-[#006B68] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {step.step || '✓'}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-[#172126]">
                                {step.approval || step.approval_name}
                              </h4>

                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                {statusStyle.label}
                              </span>

                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                                {step.priority} Priority
                              </span>
                            </div>

                            <p className="text-xs text-[#66757A]">
                              Authority: <strong className="text-[#172126] font-medium">{step.authority}</strong> • Category: {step.category}
                            </p>

                            {step.dependencies?.length > 0 && (
                              <p className="text-[11px] text-[#B87707] font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Prerequisite: {step.dependencies.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {step.source_url && (
                            <a
                              href={step.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded text-[#66757A] hover:text-[#006B68] hover:bg-[#E6F2F2] transition-colors"
                              title="Official Source"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          <Button
                            size="xs"
                            variant="primary"
                            icon={ArrowRight}
                            iconPosition="right"
                            onClick={() =>
                              navigate(
                                `/applications/new?business_id=${activeBusiness.id}&approval_id=${step.approval_id || step.id || 1}`
                              )
                            }
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: EXECUTIVE AI SYNTHESIS */}
      {/* ===================================================================== */}
      {activeTab === 'ai-roadmap' && (
        <div className="space-y-4">
          {!aiRoadmapData ? (
            <div className="p-8 text-center space-y-3 bg-white rounded-xl border border-[#C5D5D3]">
              <div className="w-10 h-10 rounded-lg bg-[#E6F2F2] text-[#006B68] flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>

              <h3 className="text-base font-bold text-[#172126]">
                Generate Executive AI Compliance Plan with Gemini
              </h3>

              <p className="text-xs text-[#66757A] max-w-md mx-auto">
                Synthesize statutory evidence, inspection readiness, and required document checklists for {activeBusiness.name}.
              </p>

              <Button
                variant="primary"
                icon={Sparkles}
                loading={loadingAiRoadmap}
                onClick={loadAiRoadmap}
              >
                {loadingAiRoadmap ? 'Synthesizing with Gemini AI...' : 'Generate Executive AI Plan'}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <Card className="bg-[#E6F2F2] border-[#BFE0DF]">
                <CardHeader>
                  <div className="flex items-center gap-2 text-[#006B68] text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    Gemini AI Compliance Synthesis
                  </div>

                  <CardTitle className="text-lg font-bold text-[#003F3D] pt-1">
                    Executive Compliance Summary
                  </CardTitle>

                  <CardDescription className="text-[#004F4D] text-xs leading-relaxed">
                    {aiRoadmapData.summary || 'AI Compliance Roadmap generated from statutory evidence.'}
                  </CardDescription>
                </CardHeader>
              </Card>

              {aiRoadmapData.roadmap && (
                <div className="space-y-4">
                  {aiRoadmapData.roadmap.map((item, idx) => (
                    <Card key={idx} className="p-5 space-y-3 border-[#C5D5D3]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-[#006B68] text-white font-bold text-xs flex items-center justify-center shrink-0">
                            #{item.step || idx + 1}
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-[#172126]">
                              {item.approval}
                            </h4>
                            <p className="text-xs text-[#66757A]">
                              {item.authority}
                            </p>
                          </div>
                        </div>

                        {item.inspection_required && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#FEF6E8] text-[#B87707] border border-[#FDE2B2] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Physical Inspection Required
                          </span>
                        )}
                      </div>

                      {item.why_required && (
                        <p className="text-xs text-[#172126] bg-[#F8FAF9] p-3 rounded-lg border border-[#E2E8E7]">
                          <strong className="text-[#006B68]">Why Required:</strong> {item.why_required}
                        </p>
                      )}

                      {item.preparation_steps?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#172126]">
                            Preparation Steps:
                          </p>
                          <ul className="list-disc list-inside text-xs text-[#66757A] space-y-0.5">
                            {item.preparation_steps.map((st, i) => (
                              <li key={i}>{st}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* EXPORT / DOWNLOAD MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Download Statutory Approvals List"
        description={`Export the identified statutory clearances and compliance requirements for ${activeBusiness?.name}.`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {/* Scope selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#172126] block">
              Select Export Scope
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  exportScope === 'all'
                    ? 'border-[#006B68] bg-[#E6F2F2] text-[#006B68] font-bold ring-1 ring-[#006B68]'
                    : 'border-[#C5D5D3] bg-white text-[#4D5C61] hover:border-[#CBD5D3]'
                }`}
              >
                <div className="font-semibold">All Identified</div>
                <div className="text-[11px] text-[#66757A]">{totalIdentified} Approvals</div>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('required')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  exportScope === 'required'
                    ? 'border-[#C93D3D] bg-[#FCEEEE] text-[#C93D3D] font-bold ring-1 ring-[#C93D3D]'
                    : 'border-[#C5D5D3] bg-white text-[#4D5C61] hover:border-[#CBD5D3]'
                }`}
              >
                <div className="font-semibold">Required Only</div>
                <div className="text-[11px] text-[#66757A]">{requiredCount} Mandatory</div>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('filtered')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  exportScope === 'filtered'
                    ? 'border-[#006B68] bg-[#E6F2F2] text-[#006B68] font-bold ring-1 ring-[#006B68]'
                    : 'border-[#C5D5D3] bg-white text-[#4D5C61] hover:border-[#CBD5D3]'
                }`}
              >
                <div className="font-semibold">Current View</div>
                <div className="text-[11px] text-[#66757A]">{filteredApprovals.length} Filtered</div>
              </button>
            </div>
          </div>

          {/* Export Format Options */}
          <div className="space-y-2.5 pt-2 border-t border-[#E2E8E7]">
            <label className="text-xs font-bold text-[#172126] block">
              Choose Download Format
            </label>

            {/* Option 1: PDF / Print Report */}
            <div
              onClick={handlePrintReport}
              className="p-3.5 rounded-xl border border-[#C5D5D3] bg-white hover:border-[#006B68] hover:bg-[#F8FAF9] cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#E6F2F2] text-[#006B68] flex items-center justify-center group-hover:bg-[#006B68] group-hover:text-white transition-colors">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172126]">
                    Print / Save as PDF Compliance Dossier
                  </h4>
                  <p className="text-[11px] text-[#66757A]">
                    Executive formatted statutory report with enterprise summary, categorized checklist & required documents.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#66757A] group-hover:text-[#006B68] group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Option 2: CSV Spreadsheet */}
            <div
              onClick={handleDownloadCSV}
              className="p-3.5 rounded-xl border border-[#C5D5D3] bg-white hover:border-[#006B68] hover:bg-[#F8FAF9] cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#E8F6F1] text-[#159A72] flex items-center justify-center group-hover:bg-[#159A72] group-hover:text-white transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172126]">
                    Download CSV Spreadsheet (.csv)
                  </h4>
                  <p className="text-[11px] text-[#66757A]">
                    Complete tabular dataset with approval names, departments, timelines, fees, and official links for Excel.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#66757A] group-hover:text-[#006B68] group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Option 3: JSON Data */}
            <div
              onClick={handleDownloadJSON}
              className="p-3.5 rounded-xl border border-[#C5D5D3] bg-white hover:border-[#006B68] hover:bg-[#F8FAF9] cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EBF3FF] text-[#1D63CB] flex items-center justify-center group-hover:bg-[#1D63CB] group-hover:text-white transition-colors">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172126]">
                    Download JSON Data (.json)
                  </h4>
                  <p className="text-[11px] text-[#66757A]">
                    Structured JSON payload for statutory compliance integration and automated audit systems.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#66757A] group-hover:text-[#006B68] group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-[#E2E8E7]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExportModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Official Regulatory Sources Modal */}
      <Modal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        title="Authoritative Government Regulatory Sources"
        description="Statutory clearances are retrieved directly from official Central, State, and Municipal regulatory authorities."
        maxWidth="max-w-3xl"
      >
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {sourcesData?.sources?.map((src, idx) => (
            <div key={idx} className="p-3.5 rounded-lg border border-[#C5D5D3] bg-[#F8FAF9] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[#006B68]" />
                  <h4 className="text-sm font-bold text-[#172126]">{src.name}</h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F2F2] text-[#006B68] border border-[#BFE0DF]">
                  {src.jurisdiction}
                </span>
              </div>

              <p className="text-xs text-[#66757A]">
                Administered by: <strong className="text-[#172126]">{src.authority}</strong>
              </p>

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {src.approvals_covered?.map((app, aIdx) => (
                  <span key={aIdx} className="text-[10px] px-2 py-0.5 rounded bg-white text-[#4D5C61] border border-[#E2E8E7]">
                    {app}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] border-t border-[#E2E8E7]">
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#006B68] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Visit Official Portal
                </a>
                <span className="text-[#9AA5A8]">Status: {src.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}