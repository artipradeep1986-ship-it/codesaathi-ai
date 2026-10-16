import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
  color?: 'primary' | 'white' | 'muted';
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  label,
  color = 'primary',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-primary',
    white: 'text-white',
    muted: 'text-text-muted',
  };

  return (
    <div className={clsx('inline-flex flex-col items-center justify-center gap-2', className)}>
      <Loader2
        className={clsx('animate-spin', sizeClasses[size], colorClasses[color])}
      />
      {label && <span className="text-sm font-medium text-text-secondary">{label}</span>}
    </div>
  );
};
