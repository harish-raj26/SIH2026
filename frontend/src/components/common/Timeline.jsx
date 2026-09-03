import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export function Timeline({ steps = [], currentStep = 1 }) {
  return (
    <div className="relative py-3">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-[#E2E8E7] -z-0" />

        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;

          return (
            <div
              key={step.id || idx}
              className="flex flex-col items-center relative z-10"
            >
              <div
                className={clsx(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-colors font-semibold text-xs shadow-2xs',
                  isCompleted && 'bg-[#159A72] text-white',
                  isCurrent && 'bg-[#006B68] text-white ring-4 ring-[#E6F2F2]',
                  isPending && 'bg-white border border-[#E2E8E7] text-[#66757A]'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>

              <div className="text-center mt-2 max-w-[110px]">
                <p
                  className={clsx(
                    'text-xs font-semibold leading-tight',
                    isCurrent && 'text-[#006B68]',
                    isCompleted && 'text-[#159A72]',
                    isPending && 'text-[#66757A]'
                  )}
                >
                  {step.title}
                </p>
                {step.subtitle && (
                  <p className="text-[11px] text-[#66757A] mt-0.5 truncate">
                    {step.subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
