import { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/cn';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  variant = 'default',
  className,
}: StatsCardProps) {
  const variantStyles = {
    default: 'border-bg-hover',
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    danger: 'border-danger/30 bg-danger/5',
  };

  const iconContainerStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };

  return (
    <Card
      variant="elevated"
      padding="md"
      className={cn(variantStyles[variant], 'hover:border-primary/40 transition-all', className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-accent text-text-muted uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-3xl font-mono font-bold text-text-primary mb-1">{value}</p>
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend === 'up' && 'text-success',
                  trend === 'down' && 'text-danger',
                  trend === 'neutral' && 'text-text-muted'
                )}
              >
                {trend === 'up' && '↑'}
                {trend === 'down' && '↓'}
                {trend === 'neutral' && '→'} {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', iconContainerStyles[variant])}>{icon}</div>
      </div>
    </Card>
  );
}
