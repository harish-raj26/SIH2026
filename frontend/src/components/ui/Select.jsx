import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Select = forwardRef(function Select(
  {
    label,
    options = [],
    helperText,
    error,
    required = false,
    className = '',
    id,
    disabled = false,
    placeholder = 'Select an option',
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium text-[#172126]"
        >
          {label} {required && <span className="text-[#E05252]">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-2xs">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={twMerge(
            clsx(
              'block w-full appearance-none rounded-lg border bg-white px-3.5 py-2 pr-9 text-sm text-[#172126] transition-colors duration-150',
              'focus:border-[#006B68] focus:outline-none focus:ring-2 focus:ring-[#006B68]/15',
              'disabled:bg-[#F8FAF9] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
              error
                ? 'border-[#E05252] focus:border-[#E05252] focus:ring-[#E05252]/15'
                : 'border-[#C5D5D3]',
              className
            )
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="bg-white text-[#9AA5A8]">
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option
                key={val}
                value={val}
                className="bg-white text-[#172126] py-1"
              >
                {lbl}
              </option>
            );
          })}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#66757A]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-xs text-[#E05252] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#66757A]">{helperText}</p>
      ) : null}
    </div>
  );
});
