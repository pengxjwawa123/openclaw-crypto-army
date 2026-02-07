import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'primary';
}

const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', variant = 'default', ...props }, ref) => {
    const orientationStyles = {
      horizontal: 'h-px w-full',
      vertical: 'w-px h-full',
    };

    const variantStyles = {
      default: 'bg-bg-surface',
      primary: 'bg-primary/20',
    };

    return (
      <div
        ref={ref}
        className={cn(orientationStyles[orientation], variantStyles[variant], className)}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';

export { Separator };
