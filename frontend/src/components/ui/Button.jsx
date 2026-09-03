import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer text-sm';

  const variants = {
    primary:
      'bg-[#006B68] text-white hover:bg-[#004F4D] active:bg-[#003F3D] focus:ring-[#006B68]/30 shadow-2xs',
    secondary:
      'bg-white border border-[#006B68] text-[#006B68] hover:bg-[#F0F7F6] active:bg-[#E2F0EE] focus:ring-[#006B68]/20 shadow-2xs',
    outline:
      'bg-white border border-[#E2E8E7] text-[#172126] hover:bg-[#F8FAF9] hover:border-[#CBD5D3] focus:ring-[#006B68]/20 shadow-2xs',
    ghost:
      'bg-transparent text-[#66757A] hover:bg-[#F0F7F6] hover:text-[#004F4D] focus:ring-[#006B68]/20',
    danger:
      'bg-[#E05252] text-white hover:bg-[#C93D3D] active:bg-[#B33030] focus:ring-[#E05252]/30 shadow-2xs',
    success:
      'bg-[#159A72] text-white hover:bg-[#107B5B] active:bg-[#0C6148] focus:ring-[#159A72]/30 shadow-2xs',
    amber:
      'bg-[#F2A51A] text-white hover:bg-[#D98F0D] active:bg-[#BF7B05] focus:ring-[#F2A51A]/30 shadow-2xs',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    sm: 'px-3 py-1.5 text-xs gap-1.5 font-medium',
    md: 'px-4 py-2 text-sm gap-2 font-medium',
    lg: 'px-5 py-2.5 text-sm gap-2.5 font-semibold',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={twMerge(
        clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}
