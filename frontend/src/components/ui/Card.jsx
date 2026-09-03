import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          'bg-white border border-[#C5D5D3] rounded-xl shadow-xs transition-colors duration-150',
          hover && 'hover:border-[#006B68] hover:shadow-sm cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={twMerge(
        clsx('px-5 py-4 border-b border-[#C5D5D3]', className)
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3
      className={twMerge(
        clsx('text-sm sm:text-base font-semibold text-[#172126]', className)
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p
      className={twMerge(
        clsx('text-xs text-[#66757A] mt-0.5 leading-normal', className)
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={twMerge(clsx('p-5', className))} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={twMerge(
        clsx('px-5 py-3.5 bg-[#F8FAF9] border-t border-[#C5D5D3] rounded-b-xl', className)
      )}
      {...props}
    >
      {children}
    </div>
  );
}
