import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'soft' | 'outline';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  header,
  footer,
  interactive = false,
  className,
  onClick,
  ...props
}) => {
  const variantClasses = {
    default: 'bg-white border border-border/60 shadow-card',
    soft: 'bg-surface-soft border border-border/30',
    outline: 'bg-white border-2 border-border',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-card p-4 transition-all duration-150',
        variantClasses[variant],
        interactive && 'cursor-pointer hover:shadow-card-hover hover:border-primary/40 active:scale-[0.99]',
        className
      )}
      {...props}
    >
      {header && <div className="mb-3 pb-2 border-b border-border/40">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="mt-4 pt-3 border-t border-border/40">{footer}</div>}
    </div>
  );
};
