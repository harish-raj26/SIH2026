import React from 'react';
import { clsx } from 'clsx';

export function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={clsx('flex items-center space-x-1 p-1 bg-[#F0F4F4] rounded-lg border border-[#E2E8E7]', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer',
              isActive
                ? 'bg-white text-[#006B68] font-semibold shadow-2xs'
                : 'text-[#66757A] hover:text-[#172126] hover:bg-white/50'
            )}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                  isActive
                    ? 'bg-[#E6F2F2] text-[#006B68]'
                    : 'bg-[#E2E8E7] text-[#66757A]'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
