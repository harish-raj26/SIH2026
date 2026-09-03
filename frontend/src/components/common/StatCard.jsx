import React from 'react';
import { clsx } from 'clsx';

export function StatCard({
  title,
  value,
  subtitle,
  loading = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-5 rounded-2xl bg-white border-[1.5px] border-[#0A4D46] shadow-xs flex flex-col justify-between transition-colors',
        onClick && 'cursor-pointer hover:bg-[#F9FCFB]'
      )}
    >
      <p className="text-sm font-bold text-[#172126] tracking-tight">
        {title}
      </p>

      <div className="pt-2 pb-1">
        {loading ? (
          <div className="h-8 w-16 bg-[#E5EAE8] rounded animate-pulse" />
        ) : (
          <h4 className="text-2xl sm:text-3xl font-extrabold text-[#172126] tracking-tight">
            {value}
          </h4>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-[#66757A] font-medium truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
