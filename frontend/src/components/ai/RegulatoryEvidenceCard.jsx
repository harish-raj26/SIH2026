import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export function RegulatoryEvidenceCard({ evidence = [] }) {
  const [expanded, setExpanded] = useState(false);

  if (!evidence || evidence.length === 0) return null;

  const displayList = expanded ? evidence : evidence.slice(0, 2);

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between text-xs text-[#66757A]">
        <span className="flex items-center gap-1.5 font-semibold text-[#006B68]">
          <ShieldCheck className="w-3.5 h-3.5" />
          Regulatory Evidence ({evidence.length} sources)
        </span>
        {evidence.length > 2 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] font-medium text-[#66757A] hover:text-[#006B68] cursor-pointer"
          >
            {expanded ? (
              <>
                Show Less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Show All ({evidence.length}) <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayList.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-[#F8FAF9] border border-[#E2E8E7] text-xs space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#172126] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#006B68]" />
                {item.source || 'Regulation Index'}
              </span>
              {item.score !== undefined && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#E6F2F2] text-[#006B68] font-mono font-medium">
                  Score: {typeof item.score === 'number' ? item.score.toFixed(3) : item.score}
                </span>
              )}
            </div>
            <p className="text-[#66757A] text-[11px] leading-relaxed italic bg-white p-2 rounded border border-[#E2E8E7]">
              "{item.text}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
