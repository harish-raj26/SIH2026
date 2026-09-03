import React from 'react';
import { clsx } from 'clsx';

export function ProgressBar({
  value = 0,
  max = 100,
  showLabel = true,
  label,
  size = 'md',
  color = 'teal',
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorVariants = {
    teal: 'bg-[#006B68]',
    emerald: 'bg-[#159A72]',
    amber: 'bg-[#F2A51A]',
    rose: 'bg-[#E05252]',
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={clsx('w-full space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-[#66757A]">
          <span className="font-medium text-[#172126]">
            {label || 'Progress'}
          </span>
          <span className="font-semibold text-[#172126]">
            {percentage}%
          </span>
        </div>
      )}

      <div className={clsx('w-full bg-[#E2E8E7] rounded-full overflow-hidden', heights[size])}>
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300 ease-out',
            colorVariants[color] || colorVariants.teal
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
