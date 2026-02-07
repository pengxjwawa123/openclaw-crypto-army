import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface StatusDotProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: 'running' | 'stopped' | 'error' | 'pending' | 'paused';
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ className, status, size = 'md', showPulse = true, ...props }, ref) => {
    const sizeStyles = {
      sm: 'w-2 h-2',
      md: 'w-3 h-3',
      lg: 'w-4 h-4',
    };

    const statusStyles = {
      running: 'bg-[#00ff9d]',
      stopped: 'bg-[#9ca3af]',
      error: 'bg-[#ff0055]',
      pending: 'bg-[#ffd000]',
      paused: 'bg-[#8b5cf6]',
    };

    const pulseAnimation = {
      running: showPulse && 'animate-pulse-glow',
      stopped: false,
      error: showPulse && 'animate-pulse-glow',
      pending: showPulse && 'animate-spin-slow',
      paused: false,
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-block rounded-full',
          sizeStyles[size],
          statusStyles[status],
          pulseAnimation[status],
          className
        )}
        aria-label={status}
        {...props}
      />
    );
  }
);

StatusDot.displayName = 'StatusDot';

export { StatusDot };
