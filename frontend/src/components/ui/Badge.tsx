import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  withDot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', withDot = false, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center gap-1.5 font-accent font-medium rounded-full';

    const variantStyles = {
      success: 'bg-success/20 text-success border border-success/30',
      warning: 'bg-warning/20 text-warning border border-warning/30',
      error: 'bg-danger/20 text-danger border border-danger/30',
      info: 'bg-info/20 text-info border border-info/30',
      default: 'bg-bg-hover text-text-secondary border border-bg-surface',
    };

    const sizeStyles = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-3 py-1',
      lg: 'text-base px-4 py-1.5',
    };

    const dotColors = {
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-danger',
      info: 'bg-info',
      default: 'bg-text-muted',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {withDot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
