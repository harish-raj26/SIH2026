import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { Building2, ChevronDown, Plus, Check, ArrowRight } from 'lucide-react';
import { BusinessModal } from '../forms/BusinessModal';
import { clsx } from 'clsx';

export function ActiveBusinessSwitcher() {
  const { businesses, activeBusiness, selectBusiness } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#004F4D] bg-[#004F4D]/70 hover:bg-[#004F4D] text-xs font-medium text-white transition-colors cursor-pointer max-w-[240px]"
        >
          <div className="w-4 h-4 rounded text-[#80BFBD] flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">
            {activeBusiness ? activeBusiness.name : 'Select Business'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#80BFBD] shrink-0 ml-auto" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-80 rounded-xl bg-white shadow-xl border border-[#E2E8E7] z-50 p-2.5 text-[#172126] animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#E2E8E7] mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#66757A]">
                Registered Enterprises
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/businesses');
                }}
                className="text-[11px] font-medium text-[#006B68] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1">
              {businesses.length === 0 ? (
                <div className="p-4 text-center space-y-1">
                  <p className="text-xs text-[#66757A]">
                    No business entities registered yet.
                  </p>
                </div>
              ) : (
                businesses.map((b) => {
                  const isSelected = activeBusiness?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        selectBusiness(b);
                        setIsOpen(false);
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-[#E6F2F2] text-[#006B68] font-semibold'
                          : 'text-[#172126] hover:bg-[#F8FAF9]'
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="truncate font-semibold">{b.name}</p>
                        <p className="text-[11px] text-[#66757A] truncate">
                          {b.industry} • {b.location}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#006B68] shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            <div className="pt-2 mt-1 border-t border-[#E2E8E7]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold text-[#006B68] bg-[#E6F2F2] hover:bg-[#D5ECEB] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Register New Enterprise
              </button>
            </div>
          </div>
        )}
      </div>

      <BusinessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
