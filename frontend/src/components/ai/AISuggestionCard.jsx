import React from 'react';
import { Sparkles, Check, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export function AISuggestionCard({
  suggestion,
  onAccept,
  onRegenerate,
  accepting = false,
  regenerating = false,
}) {
  if (!suggestion) return null;

  return (
    <div className="p-3.5 rounded-lg bg-[#E6F2F2] border border-[#BFE0DF] space-y-2 mt-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#006B68]">
          <Sparkles className="w-3.5 h-3.5 text-[#006B68]" />
          Gemini AI Autofill Suggestion
        </span>
      </div>

      <p className="text-xs text-[#172126] bg-white p-2.5 rounded-md border border-[#BFE0DF] font-medium leading-relaxed">
        {suggestion}
      </p>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onRegenerate && (
          <Button
            size="xs"
            variant="outline"
            icon={RefreshCw}
            loading={regenerating}
            onClick={onRegenerate}
          >
            Regenerate
          </Button>
        )}
        <Button
          size="xs"
          variant="primary"
          icon={Check}
          loading={accepting}
          onClick={onAccept}
        >
          Accept Suggestion
        </Button>
      </div>
    </div>
  );
}
