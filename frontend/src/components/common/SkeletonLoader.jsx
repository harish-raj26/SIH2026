import React from 'react';
import { clsx } from 'clsx';

export function SkeletonLoader({ type = 'card', count = 1, className = '' }) {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className={clsx('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {items.map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 animate-shimmer"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-2.5 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={clsx('rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden p-4 space-y-4 animate-shimmer', className)}>
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="space-y-3">
          {items.map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-2 animate-shimmer', className)}>
      {items.map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
      ))}
    </div>
  );
}
