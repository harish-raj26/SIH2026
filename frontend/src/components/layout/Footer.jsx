import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#E2E8E7] bg-white py-5 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#66757A]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#006B68]" />
          <span className="font-semibold text-[#172126]">
            BizClear AI Platform
          </span>
          <span>• Intelligent Regulatory Compliance Architecture</span>
        </div>

        <div className="flex items-center gap-4 text-[#66757A]">
          <span>FastAPI + Google Gemini + RAG</span>
          <span>•</span>
          <span>© {new Date().getFullYear()} BizClear AI. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
