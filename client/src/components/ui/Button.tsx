import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-btn transition-colors duration-150 min-h-[48px] min-w-[48px] focus:outline-none focus:ring-2 focus:ring-offset-2 select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-6 py-3.5 text-lg',
  };

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark focus:ring-primary shadow-sm',
    secondary: 'bg-surface-soft text-text border border-border hover:bg-primary-50 active:bg-primary-50 focus:ring-primary',
    ghost: 'bg-transparent text-primary hover:bg-primary-50 active:bg-primary-50 focus:ring-primary',
    danger: 'bg-error text-white hover:bg-red-700 active:bg-red-800 focus:ring-error shadow-sm',
  };

  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2 shrink-0" />
      ) : icon && iconPosition === 'left' ? (
        <span className="mr-2 inline-flex items-center shrink-0">{icon}</span>
      ) : null}

      <span>{children}</span>

      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2 inline-flex items-center shrink-0">{icon}</span>
      )}
    </button>
  );
};
