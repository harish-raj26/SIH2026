import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { useNotification } from '../../context/NotificationContext';
import { approvalService } from '../../services/approvalService';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BusinessModal } from '../../components/forms/BusinessModal';
import { Modal } from '../../components/ui/Modal';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Building2,
  MapPin,
  IndianRupee,
  Users,
  Plus,
  ArrowRight,
  Search,
  Check,
  Factory,
  Globe2,
  Flame,
  ShieldCheck,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export function BusinessesPage() {
  const {
    businesses,
    activeBusiness,
    selectBusiness,
    loading,
    deleteBusiness,
    clearAllBusinesses,
  } = useBusiness();
  const { showSuccess, showError } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleConfirmDelete = async () => {
    if (!businessToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBusiness(businessToDelete.id, businessToDelete.name);
      setBusinessToDelete(null);
    } catch (err) {
      // toast already handled by context
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearAll = async () => {
    setIsDeleting(true);
    try {
      await clearAllBusinesses();
      setIsClearAllModalOpen(false);
    } catch (err) {
      // toast already handled by context
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectBusiness = (biz) => {
    selectBusiness(biz);
    showSuccess(`Active enterprise set to "${biz.name}"`, 'Enterprise Selected');
  };

  const handleDownloadBusinessApprovals = async (e, biz) => {
    e.stopPropagation();
    setDownloadingId(biz.id);
    try {
      let data = await approvalService.getRoadmap(biz.id);
      let list = data?.roadmap || [];
      if (!list || list.length === 0) {
        const disc = await approvalService.discoverApprovals(biz.id);
        list = disc?.approvals || [];
      }

      if (!list || list.length === 0) {
        showError(`No approvals found for ${biz.name}. Run discovery first.`, 'Export Notice');
        setDownloadingId(null);
        return;
      }

      const headers = [
        'Step',
        'Approval / License Name',
        'Status',
        'Authority / Department',
        'Priority',
        'Lifecycle Stage',
        'Category',
        'Applicability Reason',
        'Processing Timeline',
        'Validity Period',
        'Indicative Fees',
        'Documents Required',
        'Official Portal URL'
      ];

      const rows = list.map((s, idx) => {
        const docs = Array.isArray(s.documents_required)
          ? s.documents_required.join('; ')
          : (s.documents_required || '');

        return [
          `"${idx + 1}"`,
          `"${(s.approval || s.approval_name || s.name || '').replace(/"/g, '""')}"`,
          `"${(s.status || s.approval_status || 'REQUIRED').replace(/"/g, '""')}"`,
          `"${(s.authority || '').replace(/"/g, '""')}"`,
          `"${(s.priority || 'Medium').replace(/"/g, '""')}"`,
          `"${(s.stage || 'Pre-Operation').replace(/"/g, '""')}"`,
          `"${(s.category || 'Regulatory').replace(/"/g, '""')}"`,
          `"${(s.reason || '').replace(/"/g, '""')}"`,
          `"${(s.timeline || '').replace(/"/g, '""')}"`,
          `"${(s.validity || '').replace(/"/g, '""')}"`,
          `"${(s.fees || '').replace(/"/g, '""')}"`,
          `"${docs.replace(/"/g, '""')}"`,
          `"${(s.application_url || s.source_url || '').replace(/"/g, '""')}"`
        ].join(',');
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      const sanitizedBizName = (biz.name || 'Enterprise').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${sanitizedBizName}_Need_Approval_List.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess(`Downloaded ${list.length} approvals for ${biz.name}.`, 'Download Complete');
    } catch (err) {
      console.error('Error downloading business approvals:', err);
      showError('Could not download approvals list. Please try again.', 'Download Error');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredBusinesses = businesses.filter((b) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.name?.toLowerCase().includes(query) ||
      b.industry?.toLowerCase().includes(query) ||
      b.sub_sector?.toLowerCase().includes(query) ||
      b.location?.toLowerCase().includes(query) ||
      b.state?.toLowerCase().includes(query) ||
      b.district?.toLowerCase().includes(query) ||
      b.business_type?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-white border border-[#C5D5D3] shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-[#172126] tracking-tight">
            Enterprise Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#66757A]">
            Select or register an enterprise entity to dynamically evaluate statutory approvals, clearances, and compliance roadmaps.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {businesses.length > 0 && (
            <Button
              variant="outline"
              icon={Trash2}
              onClick={() => setIsClearAllModalOpen(true)}
              className="border-[#E05252]/40 text-[#C93D3D] hover:bg-[#FCEEEE] hover:border-[#E05252]"
            >
              Clear All
            </Button>
          )}
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            Register New Enterprise
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {businesses.length > 0 && (
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-[#66757A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by enterprise name, sector, sub-sector, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs sm:text-sm border border-[#C5D5D3] bg-white text-[#172126] placeholder-[#9AA5A8] focus:outline-none focus:border-[#006B68] focus:ring-2 focus:ring-[#006B68]/15"
          />
        </div>
      )}

      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Enterprises Registered"
          description="Register your first business entity to begin discovering statutory approvals and compliance roadmaps."
          actionLabel="Register Enterprise"
          actionIcon={Plus}
          onAction={() => setIsModalOpen(true)}
        />
      ) : filteredBusinesses.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Matching Enterprises"
          description={`No registered enterprise matches "${searchQuery}".`}
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBusinesses.map((biz) => {
            const isActive = activeBusiness?.id === biz.id;
            return (
              <Card
                key={biz.id}
                className={`relative flex flex-col justify-between transition-colors ${
                  isActive ? 'border-[#006B68] ring-1 ring-[#006B68]' : 'hover:border-[#CBD5D3]'
                }`}
              >
                {isActive && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded text-[10px] font-bold bg-[#006B68] text-white flex items-center gap-1 shadow-2xs">
                    <Check className="w-3 h-3" />
                    Active Enterprise
                  </div>
                )}

                <div>
                  <CardHeader className="pb-3 pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base text-[#172126] font-bold">
                          {biz.name}
                        </CardTitle>
                        <p className="text-xs text-[#006B68] font-semibold mt-0.5">
                          {biz.industry} {biz.sub_sector ? `• ${biz.sub_sector}` : ''}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-[#E6F2F2] text-[#006B68] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 text-xs text-[#66757A] pt-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#66757A] shrink-0" />
                      <span className="truncate">{biz.location || `${biz.district || 'Coimbatore'}, ${biz.state || 'Tamil Nadu'}`}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-3.5 h-3.5 text-[#66757A] shrink-0" />
                      <span>Investment: {formatCurrency(biz.investment)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#66757A] shrink-0" />
                      <span>Workforce: {biz.employees} Personnel</span>
                    </div>

                    {/* Characteristic Badges */}
                    <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                      {biz.pollution_category && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          biz.pollution_category === 'Red' ? 'bg-[#FCEEEE] text-[#C93D3D] border border-[#F8CDCD]' :
                          biz.pollution_category === 'Orange' ? 'bg-[#FEF6E8] text-[#B87707] border border-[#FDE2B2]' :
                          biz.pollution_category === 'Green' ? 'bg-[#E8F6F1] text-[#159A72] border border-[#C2EAD9]' :
                          'bg-[#F0F4F4] text-[#4D5C61] border border-[#DDE4E4]'
                        }`}>
                          {biz.pollution_category} Pollution Category
                        </span>
                      )}

                      {biz.factory && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F2F2] text-[#006B68] border border-[#BFE0DF]">
                          <Factory className="w-3 h-3" />
                          Factory / Plant
                        </span>
                      )}

                      {biz.import_export && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBF3FF] text-[#1D63CB] border border-[#C5DBF8]">
                          <Globe2 className="w-3 h-3" />
                          Import/Export
                        </span>
                      )}

                      {biz.boiler && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF6E8] text-[#B87707] border border-[#FDE2B2]">
                          <Flame className="w-3 h-3" />
                          Boiler
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="flex items-center justify-between gap-2 pt-3">
                  <div className="flex items-center gap-2 w-full">
                    {isActive ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        icon={ArrowRight}
                        iconPosition="right"
                        onClick={() => navigate('/approvals')}
                      >
                        View Approvals
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSelectBusiness(biz)}
                      >
                        Set as Active
                      </Button>
                    )}

                    <button
                      type="button"
                      title="Download Need Approval List (.csv)"
                      disabled={downloadingId === biz.id}
                      onClick={(e) => handleDownloadBusinessApprovals(e, biz)}
                      className="p-2 rounded-lg border border-[#CBD5D3] hover:border-[#006B68] hover:bg-[#F0F7F5] text-[#4D5C61] hover:text-[#006B68] cursor-pointer transition-colors shrink-0"
                    >
                      <Download className={`w-4 h-4 ${downloadingId === biz.id ? 'animate-spin text-[#006B68]' : ''}`} />
                    </button>

                    <button
                      type="button"
                      title={`Delete "${biz.name}"`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setBusinessToDelete(biz);
                      }}
                      className="p-2 rounded-lg border border-[#CBD5D3] hover:border-[#E05252] hover:bg-[#FCEEEE] text-[#66757A] hover:text-[#C93D3D] cursor-pointer transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!businessToDelete}
        onClose={() => !isDeleting && setBusinessToDelete(null)}
        title="Delete Enterprise Entity"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#FCEEEE] border border-[#F8CDCD] text-[#C93D3D]">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#C93D3D]" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-sm text-[#172126]">
                Delete "{businessToDelete?.name}"?
              </p>
              <p className="text-[#66757A]">
                This will permanently remove this enterprise and cascade-delete all its discovered approvals, application drafts, submitted documents, and status history logs.
              </p>
              <p className="text-[#C93D3D] font-medium pt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E7]">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setBusinessToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={isDeleting}
              icon={Trash2}
              onClick={handleConfirmDelete}
            >
              Delete Enterprise
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={isClearAllModalOpen}
        onClose={() => !isDeleting && setIsClearAllModalOpen(false)}
        title="Clear All Enterprise Entities"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#FCEEEE] border border-[#F8CDCD] text-[#C93D3D]">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#C93D3D]" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-sm text-[#172126]">
                Clear All {businesses.length} Enterprises?
              </p>
              <p className="text-[#66757A]">
                This will wipe out all registered businesses and cascade delete all associated application filings, statutory requirements, inspection tasks, and uploaded documents.
              </p>
              <p className="text-[#C93D3D] font-medium pt-1">
                This will restore the database to an empty directory state.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E7]">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsClearAllModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={isDeleting}
              icon={Trash2}
              onClick={handleConfirmClearAll}
            >
              Clear All Enterprises
            </Button>
          </div>
        </div>
      </Modal>

      <BusinessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
