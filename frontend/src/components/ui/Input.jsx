import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    required = false,
    className = '',
    id,
    disabled = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-[#172126]"
        >
          {label} {required && <span className="text-[#E05252]">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-2xs">
        {LeftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#66757A]">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={twMerge(
            clsx(
              'block w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-[#172126] placeholder-[#9AA5A8] transition-colors duration-150',
              'focus:border-[#006B68] focus:outline-none focus:ring-2 focus:ring-[#006B68]/15',
              'disabled:bg-[#F8FAF9] disabled:opacity-60 disabled:cursor-not-allowed',
              error
                ? 'border-[#E05252] focus:border-[#E05252] focus:ring-[#E05252]/15'
                : 'border-[#C5D5D3]',
              LeftIcon && 'pl-9',
              RightIcon && 'pr-9',
              className
            )
          )}
          {...props}
        />

        {RightIcon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#66757A]">
            <RightIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-[#E05252] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#66757A]">{helperText}</p>
      ) : null}
    </div>
  );
});
