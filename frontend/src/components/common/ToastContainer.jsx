import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export function ToastContainer() {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 dark:border-emerald-500/20',
    error: 'border-rose-500/30 dark:border-rose-500/20',
    warning: 'border-amber-500/30 dark:border-amber-500/20',
    info: 'border-indigo-500/30 dark:border-indigo-500/20',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-5',
            borders[toast.type] || borders.info
          )}
        >
          {icons[toast.type] || icons.info}

          <div className="flex-1 min-w-0">
            {toast.title && (
              <h5 className="text-xs font-bold text-slate-900 dark:text-white font-display">
                {toast.title}
              </h5>
            )}
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
