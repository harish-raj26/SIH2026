import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { approvalService } from '../../services/approvalService';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { BusinessModal } from '../../components/forms/BusinessModal';
import {
  Building2,
  ListChecks,
  Sparkles,
  ArrowRight,
  Plus,
  HelpCircle,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { PRIORITY_STYLES } from '../../utils/constants';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { businesses, activeBusiness, selectBusiness } = useBusiness();

  const [roadmapData, setRoadmapData] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);

  // Fetch roadmap for the active business
  const fetchActiveRoadmap = useCallback(async () => {
    if (!activeBusiness?.id) {
      setRoadmapData(null);
      return;
    }
    setLoadingRoadmap(true);
    try {
      const data = await approvalService.getRoadmap(activeBusiness.id);
      if (data?.roadmap && data.roadmap.length > 0) {
        setRoadmapData(data);
      } else {
        setRoadmapData(null);
      }
    } catch (err) {
      console.warn('Could not load roadmap for dashboard:', err.message);
      setRoadmapData(null);
    } finally {
      setLoadingRoadmap(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchActiveRoadmap();
  }, [fetchActiveRoadmap]);

  const handleRunDiscovery = async () => {
    if (!activeBusiness?.id) {
      navigate('/businesses');
      return;
    }
    setDiscovering(true);
    try {
      const data = await approvalService.discoverApprovals(activeBusiness.id);
      if (data?.approvals) {
        setRoadmapData({
          roadmap: data.approvals.map((a, idx) => ({
            step: idx + 1,
            approval_id: a.id,
            approval: a.name,
            authority: a.authority,
            priority: a.priority,
            status: 'Discovered',
          })),
          total_steps: data.approvals.length,
        });
      }
    } catch (err) {
      console.error('Discovery error:', err);
    } finally {
      setDiscovering(false);
    }
  };

  const steps = roadmapData?.roadmap || [];
  const totalApprovals = steps.length;
  const highPriority = steps.filter((s) => s.priority === 'High').length;
  const readinessPercent =
    totalApprovals > 0
      ? Math.min(
          100,
          Math.round(
            (steps.filter((s) => s.status === 'Submitted' || s.status === 'Complete').length /
              totalApprovals) *
              100
          )
        )
      : 0;

  // Fallback defaults matching UI preview when no custom business yet registered
  const displayBizName = activeBusiness?.name || 'Apex BioManufacturing Labs Ltd.';
  const displayIndustry = activeBusiness?.industry || 'Manufacturing';
  const displayLocation = activeBusiness?.location || 'Industrial Area Phase 2, Pune, Maharashtra';
  const displayInvestment = activeBusiness?.investment || 45000000;
  const displayEmployees = activeBusiness?.employees || 85;
  const displayType = activeBusiness?.business_type || 'Private Limited Company';

  return (
    <div className="space-y-6 pb-12">
      {/* ================= HERO ORCHESTRATOR BANNER ================= */}
      <div className="relative rounded-2xl bg-[#0A4D46] p-6 sm:p-7 text-white shadow-xs overflow-hidden">
        {/* Subtle decorative topographic line pattern in background */}
        <div
          className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#D1E8E2] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#F2A51A]" />
              AI Regulatory Orchestrator
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {displayBizName}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#C2E2DA] font-medium leading-relaxed">
              {displayIndustry} • {displayLocation} • Capital: {formatCurrency(displayInvestment)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/approvals')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F0F7F5] text-[#0A4D46] text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0A4D46]" />
              AI Discovery
            </button>

            <button
              type="button"
              onClick={() => navigate('/applications/new')}
              className="px-4 py-2.5 rounded-xl bg-[#F2A51A] hover:bg-[#E09612] text-[#172126] text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 text-[#172126]" />
              New Application
            </button>
          </div>
        </div>
      </div>

      {/* ================= 4 KPI STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Businesses"
          value={businesses.length > 0 ? businesses.length : 1}
          subtitle="Registered entities"
          onClick={() => navigate('/businesses')}
        />
        <StatCard
          title="Statutory Approvals"
          value={totalApprovals}
          subtitle={`${highPriority} High Priority`}
          onClick={() => navigate('/approvals')}
        />
        <StatCard
          title="High Priority Clearances"
          value={highPriority}
          subtitle="Mandatory for operation"
          onClick={() => navigate('/approvals')}
        />
        <StatCard
          title="Regulatory Readiness"
          value={readinessPercent > 0 ? `${readinessPercent}%` : 'Pending'}
          subtitle="RAG evidence verified"
          onClick={() => navigate('/search')}
        />
      </div>

      {/* ================= MAIN 2-COL / 1-COL GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Statutory Approvals & Clearance Steps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white border border-[#E5EAE8] shadow-xs overflow-hidden">
            {/* Header */}
            <div className="flex flex-row items-center justify-between p-5 sm:p-6 border-b border-[#E5EAE8]">
              <div>
                <h2 className="text-base font-bold text-[#172126] tracking-tight">
                  Statutory Approvals & Clearance Steps
                </h2>
                <p className="text-xs text-[#66757A] mt-0.5">
                  Ordered by statutory priority for {displayBizName}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/approvals')}
                className="text-xs font-bold text-[#334144] hover:text-[#0A4D46] inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                Full Roadmap <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card Content Area */}
            <div className="p-6">
              {steps.length === 0 ? (
                /* Empty state matching reference image exactly */
                <div className="py-8 sm:py-12 text-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full border-2 border-[#CBD5D3] text-[#66757A] flex items-center justify-center mx-auto text-xl font-bold">
                    ?
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#172126]">
                      No approvals discovered yet for this entity.
                    </h3>
                    <p className="text-xs text-[#66757A] leading-relaxed">
                      Click below to trigger rule evaluation and RAG regulatory evidence discovery.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={discovering}
                      onClick={handleRunDiscovery}
                      className="px-6 py-2.5 rounded-full bg-[#0A4D46] hover:bg-[#073833] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F2A51A]" />
                      {discovering ? 'Evaluating Rules...' : 'Run AI Discovery Now'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Populated table */
                <div className="overflow-x-auto -mx-6 -my-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5EAE8] bg-[#F7FAF8] text-[#66757A]">
                        <th className="py-3 px-6 font-bold">Approval / License</th>
                        <th className="py-3 px-3 font-bold">Priority</th>
                        <th className="py-3 px-3 font-bold">Status</th>
                        <th className="py-3 px-6 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAE8]">
                      {steps.map((step) => {
                        const pStyle = PRIORITY_STYLES[step.priority] || PRIORITY_STYLES.Medium;
                        return (
                          <tr key={step.step} className="hover:bg-[#F7FAF8] transition-colors">
                            <td className="py-3.5 px-6 min-w-[200px]">
                              <div className="flex items-start gap-2.5">
                                <div className="w-6 h-6 rounded-md bg-[#E2ECE8] text-[#0A4D46] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {step.step}
                                </div>
                                <div>
                                  <p className="font-bold text-[#172126] text-xs">{step.approval}</p>
                                  <p className="text-[11px] text-[#66757A]">{step.authority}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${pStyle.dot}`} />
                                {step.priority}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <StatusBadge status={step.status || 'Not Started'} />
                            </td>

                            <td className="py-3.5 px-6 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/applications/new?business_id=${activeBusiness?.id}&approval_id=${
                                      step.approval_id || step.id || step.step
                                    }`
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-[#0A4D46] hover:bg-[#073833] text-white font-bold text-xs cursor-pointer transition-colors"
                              >
                                Apply
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Enterprise Specifications & Quick Actions */}
        <div className="space-y-6">
          {/* ================= ENTERPRISE SPECIFICATIONS CARD ================= */}
          <div className="rounded-2xl bg-white border border-[#E5EAE8] p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#172126] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0A4D46]" />
              Enterprise Specifications
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[#66757A] flex items-center gap-1.5">
                  <span className="text-base leading-none">•</span> Industry:
                </span>
                <span className="font-bold text-[#172126] text-right truncate max-w-[150px]">
                  {displayIndustry}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-[#66757A] flex items-center gap-1.5">
                  <span className="text-base leading-none">•</span> Legal Form:
                </span>
                <span className="font-bold text-[#172126] text-right truncate max-w-[150px]">
                  {displayType}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-[#66757A] flex items-center gap-1.5">
                  <span className="text-base leading-none">•</span> Location:
                </span>
                <span className="font-bold text-[#172126] text-right truncate max-w-[150px]">
                  {displayLocation}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-[#66757A] flex items-center gap-1.5">
                  <span className="text-base leading-none">•</span> Investment:
                </span>
                <span className="font-bold text-[#172126] text-right">
                  {formatCurrency(displayInvestment)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-[#66757A] flex items-center gap-1.5">
                  <span className="text-base leading-none">•</span> Workforce:
                </span>
                <span className="font-bold text-[#172126] text-right">
                  {displayEmployees} Employees
                </span>
              </div>
            </div>
          </div>

          {/* ================= QUICK ACTIONS CARD ================= */}
          <div className="rounded-2xl bg-white border border-[#E5EAE8] p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#172126]">Quick Actions</h2>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/approvals')}
                className="flex-1 px-4 py-2.5 rounded-full bg-[#0A4D46] hover:bg-[#073833] text-white text-xs font-bold shadow-xs cursor-pointer text-center transition-colors truncate"
              >
                Generate Roadmap
              </button>

              <button
                type="button"
                onClick={() => navigate('/documents')}
                className="flex-1 px-4 py-2.5 rounded-full bg-[#0A4D46] hover:bg-[#073833] text-white text-xs font-bold shadow-xs cursor-pointer text-center transition-colors truncate"
              >
                View Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      <BusinessModal
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
      />
    </div>
  );
}
