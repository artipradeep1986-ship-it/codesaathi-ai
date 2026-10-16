import React from 'react';
import clsx from 'clsx';

export interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  className?: string;
  badge?: string | number;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active = false,
  onClick,
  icon,
  variant = 'outline',
  disabled = false,
  className,
  badge,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all select-none min-h-[40px]',
        active
          ? 'bg-primary text-white shadow-sm hover:bg-primary-dark'
          : variant === 'outline'
          ? 'bg-white border border-border text-text-secondary hover:border-primary hover:text-primary active:bg-primary-50'
          : 'bg-surface-soft text-text hover:bg-slate-200',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {badge !== undefined && (
        <span
          className={clsx(
            'ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold',
            active ? 'bg-white/20 text-white' : 'bg-slate-200 text-text-secondary'
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
