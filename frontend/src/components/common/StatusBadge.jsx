import React from 'react';
import { STATUS_STYLES } from '../../utils/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function StatusBadge({ status, className = '' }) {
  const config = STATUS_STYLES[status] || {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    label: status || 'Unknown',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
          config.bg,
          config.text,
          config.border,
          className
        )
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {config.label}
    </span>
  );
}
