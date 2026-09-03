import React from 'react';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';

export function EmptyState({
  icon: Icon,
  title = 'No records found',
  description = 'There is currently no data to display.',
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30',
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-xs">
          <Icon className="w-8 h-8" />
        </div>
      )}

      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} icon={actionIcon} size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
