import React from 'react';
import { Building2, Edit3, FileText, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ApplicationReviewTable({ fields = [] }) {
  const getSourceBadge = (source) => {
    switch (source) {
      case 'business_profile':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#E8F6F1] text-[#0C6148] border border-[#C2EAD9]">
            <Building2 className="w-3 h-3" />
            Business Profile
          </span>
        );
      case 'uploaded_document':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]">
            <FileText className="w-3 h-3" />
            Document Proof
          </span>
        );
      case 'government_data':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
            <ShieldCheck className="w-3 h-3" />
            Statutory Derived
          </span>
        );
      case 'user_input':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
            <Edit3 className="w-3 h-3" />
            User Input
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E8E7] bg-white shadow-xs">
      <div className="bg-[#F8FAF9] px-4 py-3 border-b border-[#E2E8E7] flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-[#172126] uppercase tracking-wider">
            Statutory Field Declarations & Provenance
          </h3>
          <p className="text-[11px] text-[#66757A]">
            Every populated value carries a verified origin source and compliance status.
          </p>
        </div>
        <span className="text-xs font-semibold text-[#006B68]">
          {fields.filter((f) => f.value || f.field_value).length} / {fields.length} Completed
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E2E8E7] bg-[#FAFCFB] text-[#66757A] font-semibold text-[11px]">
              <th className="py-2.5 px-4">Field Name</th>
              <th className="py-2.5 px-4">Data Type</th>
              <th className="py-2.5 px-4">Data Source</th>
              <th className="py-2.5 px-4 text-right">Declared Value</th>
              <th className="py-2.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8E7]">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[#66757A]">
                  No specific statutory fields required.
                </td>
              </tr>
            ) : (
              fields.map((f) => {
                const val = f.value ?? f.field_value;
                const hasValue = val !== undefined && val !== null && String(val).trim() !== '';
                const hasError = Boolean(f.validation_error);

                return (
                  <tr key={f.id || f.field_name} className="hover:bg-[#F8FAF9] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#172126]">
                      <div className="flex items-center gap-1.5">
                        <span>{f.field_name}</span>
                        {f.required && (
                          <span className="text-[#C93D3D] text-[10px]" title="Statutory mandatory field">
                            *
                          </span>
                        )}
                      </div>
                      {f.source_field_path && (
                        <p className="text-[10px] text-[#66757A] font-mono mt-0.5">
                          Mapped from: {f.source_field_path}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#66757A] capitalize font-mono text-[11px]">
                      {f.field_type || 'text'}
                    </td>
                    <td className="py-3 px-4">
                      {getSourceBadge(f.source)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[#172126] max-w-xs truncate">
                      {hasValue ? (
                        <span className="font-mono">{String(val)}</span>
                      ) : (
                        <span className="text-[#E05252] italic text-[11px]">Missing</span>
                      )}
                      {hasError && (
                        <p className="text-[11px] text-[#C93D3D] mt-0.5 font-normal">
                          {f.validation_error}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasValue && !hasError ? (
                        <span className="inline-flex items-center gap-1 text-[#159A72] text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#E05252] text-[11px] font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {hasError ? 'Invalid' : 'Pending'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
