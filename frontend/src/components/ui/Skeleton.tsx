import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rectangular', ...props }, ref) => {
    const baseStyles = 'animate-pulse bg-bg-hover';

    const variantStyles = {
      text: 'h-4 rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };

    return (
      <div ref={ref} className={cn(baseStyles, variantStyles[variant], className)} {...props} />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
