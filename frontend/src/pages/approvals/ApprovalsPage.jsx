import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { useNotification } from '../../context/NotificationContext';
import { approvalService } from '../../services/approvalService';
import { aiService } from '../../services/aiService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RegulatoryEvidenceCard } from '../../components/ai/RegulatoryEvidenceCard';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ListChecks,
  Sparkles,
  Building2,
  AlertTriangle,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { PRIORITY_STYLES } from '../../utils/constants';

export function ApprovalsPage() {
  const { activeBusiness } = useBusiness();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('discovered');
  const [approvalsData, setApprovalsData] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [aiRoadmapData, setAiRoadmapData] = useState(null);

  const [discovering, setDiscovering] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [loadingAiRoadmap, setLoadingAiRoadmap] = useState(false);

  // Discover Approvals via POST /api/approvals/discover/{business_id}
  const handleDiscover = async () => {
    if (!activeBusiness?.id) return;
    setDiscovering(true);
    try {
      const data = await approvalService.discoverApprovals(activeBusiness.id);
      setApprovalsData(data);
      showSuccess(
        `Discovered ${data.approval_count} statutory approvals for ${activeBusiness.name}`,
        'Discovery Complete'
      );
      loadRoadmap(activeBusiness.id);
    } catch (err) {
      showError(err.message || 'Approval discovery failed', 'Discovery Error');
    } finally {
      setDiscovering(false);
    }
  };

  // Load Statutory Roadmap via GET /api/roadmap/{business_id}
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

  // Load AI Executive Roadmap via GET /api/ai/roadmap/{business_id}
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

  const tabs = [
    {
      id: 'discovered',
      label: 'Discovered Approvals',
      icon: ListChecks,
      badge: approvalsData?.approvals?.length || roadmapData?.roadmap?.length || 0,
    },
    {
      id: 'roadmap',
      label: 'Statutory Roadmap',
      icon: Layers,
      badge: roadmapData?.total_steps || 0,
    },
    {
      id: 'ai-roadmap',
      label: 'Executive AI Plan',
      icon: Sparkles,
      badge: 'Gemini',
    },
  ];

  const displayedApprovals =
    approvalsData?.approvals ||
    (roadmapData?.roadmap?.map((r) => ({
      id: r.approval_id || r.step,
      name: r.approval,
      authority: r.authority,
      category: r.category,
      priority: r.priority,
      status: r.status,
      confidence: r.confidence,
      reason: `Statutory requirement derived for ${activeBusiness.industry}`,
      regulatory_evidence: r.regulatory_evidence,
    })) || []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8E7] shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-[#172126] tracking-tight">
            Approvals & Compliance Roadmap
          </h1>
          <p className="text-xs sm:text-sm text-[#66757A]">
            Active Enterprise:{' '}
            <span className="font-semibold text-[#006B68]">
              {activeBusiness.name}
            </span>{' '}
            ({activeBusiness.industry})
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Discovered Approvals */}
      {activeTab === 'discovered' && (
        <div className="space-y-4">
          {discovering ? (
            <div className="p-8 text-center space-y-3 bg-white rounded-xl border border-[#E2E8E7]">
              <div className="w-10 h-10 rounded-lg bg-[#E6F2F2] text-[#006B68] flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#172126]">
                Scanning Statutory Acts & RAG Regulations...
              </h3>
              <p className="text-xs text-[#66757A] max-w-md mx-auto">
                Evaluating industry criteria, workforce thresholds, and safety rules to derive required permits.
              </p>
            </div>
          ) : displayedApprovals.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No Approvals Discovered Yet"
              description="Click 'Run Approval Discovery' to evaluate statutory rules and identify mandatory approvals for this enterprise."
              actionLabel="Run Approval Discovery"
              actionIcon={Sparkles}
              onAction={handleDiscover}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayedApprovals.map((appr) => {
                const priorityStyle =
                  PRIORITY_STYLES[appr.priority] || PRIORITY_STYLES.Medium;
                return (
                  <Card key={appr.id || appr.name} className="flex flex-col justify-between">
                    <div>
                      <CardHeader className="pb-3 pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
                            >
                              {appr.priority} Priority
                            </span>
                            <CardTitle className="text-base font-semibold pt-0.5">
                              {appr.name}
                            </CardTitle>
                            <p className="text-xs text-[#006B68] font-medium">
                              Authority: {appr.authority}
                            </p>
                          </div>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F0F4F4] text-[#4D5C61]">
                            {appr.category || 'General'}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-2 text-xs">
                        {appr.reason && (
                          <div className="p-3 rounded-lg bg-[#F8FAF9] border border-[#E2E8E7] text-[#172126]">
                            <span className="font-semibold text-[#172126]">
                              Trigger Reason:
                            </span>{' '}
                            <span className="text-[#66757A]">{appr.reason}</span>
                          </div>
                        )}

                        {/* RAG Regulatory Evidence */}
                        <RegulatoryEvidenceCard evidence={appr.regulatory_evidence} />
                      </CardContent>
                    </div>

                    <CardFooter className="flex items-center justify-between gap-2 pt-3">
                      <div className="text-xs text-[#66757A]">
                        Status: <span className="font-medium text-[#172126]">{appr.status || 'Required'}</span>
                      </div>
                      <Button
                        size="xs"
                        variant="primary"
                        icon={ArrowRight}
                        iconPosition="right"
                        onClick={() =>
                          navigate(
                            `/applications/new?business_id=${activeBusiness.id}&approval_id=${appr.id}`
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

      {/* Tab 2: Statutory Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          {loadingRoadmap ? (
            <SkeletonLoader type="table" count={4} />
          ) : !roadmapData?.roadmap || roadmapData.roadmap.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No Statutory Roadmap Steps"
              description="Run Approval Discovery first to generate the sequential clearance roadmap."
              actionLabel="Run Discovery"
              onAction={handleDiscover}
            />
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Statutory Sequence & Priorities</CardTitle>
                <CardDescription>
                  Follow these sequential departmental clearances for statutory operational clearance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {roadmapData.roadmap.map((step) => {
                  const pStyle = PRIORITY_STYLES[step.priority] || PRIORITY_STYLES.Medium;
                  return (
                    <div
                      key={step.step}
                      className="p-4 rounded-lg border border-[#E2E8E7] bg-white hover:bg-[#F8FAF9] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-[#006B68] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                          {step.step}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-[#172126]">
                              {step.approval}
                            </h4>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                              {step.priority} Priority
                            </span>
                          </div>
                          <p className="text-xs text-[#66757A]">
                            Department: <span className="font-medium text-[#172126]">{step.authority}</span> {step.category ? `• Category: ${step.category}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <Button
                          size="xs"
                          variant="primary"
                          icon={ArrowRight}
                          iconPosition="right"
                          onClick={() =>
                            navigate(
                              `/applications/new?business_id=${activeBusiness.id}&approval_id=${step.approval_id}`
                            )
                          }
                        >
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab 3: AI Executive Compliance Plan */}
      {activeTab === 'ai-roadmap' && (
        <div className="space-y-4">
          {!aiRoadmapData ? (
            <div className="p-8 text-center space-y-3 bg-white rounded-xl border border-[#E2E8E7]">
              <div className="w-10 h-10 rounded-lg bg-[#E6F2F2] text-[#006B68] flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#172126]">
                Generate Executive AI Roadmap with Gemini 3.6 Flash
              </h3>
              <p className="text-xs text-[#66757A] max-w-md mx-auto">
                Synthesize statutory evidence into concrete preparation steps, inspection alerts, and prerequisite checklists.
              </p>
              <Button
                variant="primary"
                icon={Sparkles}
                loading={loadingAiRoadmap}
                onClick={loadAiRoadmap}
              >
                {loadingAiRoadmap ? 'Synthesizing with Gemini AI...' : 'Generate Executive AI Roadmap'}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <Card className="bg-[#E6F2F2] border-[#BFE0DF]">
                <CardHeader>
                  <div className="flex items-center gap-2 text-[#006B68] text-xs font-semibold uppercase tracking-wider">
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
                    <Card key={idx} className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-[#006B68] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                            #{item.step || idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-[#172126]">
                              {item.approval}
                            </h4>
                            <p className="text-xs text-[#66757A]">{item.authority}</p>
                          </div>
                        </div>

                        {item.inspection_required && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#FEF6E8] text-[#B87707] border border-[#FDE2B2] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Physical Inspection Required
                          </span>
                        )}
                      </div>

                      {item.why_required && (
                        <p className="text-xs text-[#172126] bg-[#F8FAF9] p-3 rounded-lg border border-[#E2E8E7]">
                          <strong className="text-[#006B68]">Why Required:</strong> {item.why_required}
                        </p>
                      )}

                      {item.preparation_steps && item.preparation_steps.length > 0 && (
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
    </div>
  );
}
