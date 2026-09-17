import React from 'react';
import { Clock, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export function StatusHistoryTimeline({ history = [], loading = false }) {
  if (loading) {
    return (
      <div className="p-6 text-center text-xs text-[#66757A] animate-pulse">
        Fetching authoritative government status history...
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[#66757A] bg-[#F8FAF9] rounded-xl border border-[#E2E8E7]">
        <Clock className="w-6 h-6 mx-auto mb-2 text-[#99A6A8]" />
        <p className="font-semibold text-[#172126]">No Government Transitions Recorded Yet</p>
        <p className="text-[11px] mt-1">
          Authoritative status changes will appear here automatically when synchronized with the department portal or webhook.
        </p>
      </div>
    );
  }

  const getSourceBadge = (source) => {
    const s = (source || '').toUpperCase();
    if (s.includes('WEBHOOK')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
          Government Webhook Push
        </span>
      );
    } else if (s.includes('API')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F6F1] text-[#0C6148] border border-[#C2EAD9]">
          Direct API Sync
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
          Portal Verification
        </span>
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D5DFDC]">
        {history.map((event, idx) => {
          const dateStr = event.created_at
            ? new Date(event.created_at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : 'Recent';

          const isLatest = idx === history.length - 1;

          return (
            <div key={event.id || idx} className="relative group">
              {/* Dot icon */}
              <div
                className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white ${
                  isLatest
                    ? 'border-[#006B68] bg-[#006B68] text-white shadow-xs'
                    : 'border-[#66757A]'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLatest ? 'bg-white' : 'bg-[#66757A]'
                  }`}
                />
              </div>

              {/* Card content */}
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                  isLatest
                    ? 'bg-white border-[#006B68]/30 shadow-xs'
                    : 'bg-[#F8FAF9] border-[#E2E8E7]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#172126] text-sm">
                      {event.government_status}
                    </span>
                    <StatusBadge status={event.normalized_status || event.new_status} />
                  </div>
                  <span className="text-[11px] text-[#66757A] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {dateStr}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E2E8E7]">
                  <div className="text-[11px] text-[#66757A]">
                    {event.remarks || 'Status logged from authoritative government records.'}
                  </div>
                  <div>{getSourceBadge(event.source)}</div>
                </div>

                {event.old_status && event.new_status && event.old_status !== event.new_status && (
                  <div className="text-[10px] text-[#66757A] flex items-center gap-1 pt-0.5">
                    <span>Transition:</span>
                    <span className="font-semibold text-[#172126]">{event.old_status}</span>
                    <ArrowRight className="w-3 h-3 text-[#99A6A8]" />
                    <span className="font-semibold text-[#006B68]">{event.new_status}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
