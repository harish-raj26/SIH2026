import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { useNotification } from '../../context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BusinessModal } from '../../components/forms/BusinessModal';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Building2,
  MapPin,
  DollarSign,
  Users,
  Plus,
  CheckCircle2,
  ArrowRight,
  ListChecks,
  Search,
  Check,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export function BusinessesPage() {
  const { businesses, activeBusiness, selectBusiness, loading } = useBusiness();
  const { showSuccess } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSelectBusiness = (biz) => {
    selectBusiness(biz);
    showSuccess(`Active enterprise set to "${biz.name}"`, 'Enterprise Selected');
  };

  const filteredBusinesses = businesses.filter((b) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.name?.toLowerCase().includes(query) ||
      b.industry?.toLowerCase().includes(query) ||
      b.location?.toLowerCase().includes(query) ||
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
            Select an active enterprise entity to manage statutory approvals, clearances, and compliance applications.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
          Register New Entity
        </Button>
      </div>

      {/* Search Bar */}
      {businesses.length > 0 && (
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-[#66757A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by company name, sector, or location..."
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
                        <CardTitle className="text-base text-[#172126] font-semibold">
                          {biz.name}
                        </CardTitle>
                        <p className="text-xs text-[#006B68] font-medium mt-0.5">
                          {biz.industry}
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
                      <span className="truncate">{biz.location || 'Location Not Specified'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-[#66757A] shrink-0" />
                      <span>Investment: {formatCurrency(biz.investment)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#66757A] shrink-0" />
                      <span>Workforce: {biz.employees} Personnel</span>
                    </div>

                    {biz.business_type && (
                      <div className="pt-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#F0F4F4] text-[#4D5C61]">
                          {biz.business_type}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="flex items-center justify-between gap-2 pt-3">
                  {isActive ? (
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      icon={ArrowRight}
                      iconPosition="right"
                      onClick={() => navigate('/approvals')}
                    >
                      View Approvals & Roadmap
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => handleSelectBusiness(biz)}
                    >
                      Set as Active
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <BusinessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
