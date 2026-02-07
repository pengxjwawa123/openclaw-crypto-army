import { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface DashboardLayoutProps {
  header: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardLayout({ header, children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-base grid-pattern relative">
      <div className="noise-bg absolute inset-0" />

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-20">{header}</header>

        {/* Main Content */}
        <main className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
