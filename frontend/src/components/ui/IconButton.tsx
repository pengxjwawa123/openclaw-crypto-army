import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-base disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      default: 'bg-bg-hover text-text-primary hover:bg-bg-surface active:scale-95',
      ghost: 'bg-transparent text-text-primary hover:bg-bg-hover active:scale-95',
      danger: 'bg-transparent text-danger hover:bg-danger/10 active:scale-95',
    };

    const sizeStyles = {
      sm: 'w-7 h-7 text-sm',
      md: 'w-9 h-9 text-base',
      lg: 'w-11 h-11 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton };
