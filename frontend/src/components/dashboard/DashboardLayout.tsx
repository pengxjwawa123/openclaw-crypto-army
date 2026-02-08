import { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface DashboardLayoutProps {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  sidebar?: ReactNode;
  rightPanel?: ReactNode;
  layout?: 'default' | 'three-column';
}

export function DashboardLayout({
  header,
  children,
  className,
  sidebar,
  rightPanel,
  layout = 'default',
}: DashboardLayoutProps) {
  if (layout === 'three-column') {
    return (
      <div className="min-h-screen h-screen bg-bg-base grid-pattern relative flex overflow-hidden">
        <div className="noise-bg absolute inset-0" />

        {/* Sidebar */}
        {sidebar && <div className="relative z-10">{sidebar}</div>}

        {/* Main Content */}
        <div className="flex-1 relative z-10 flex flex-col overflow-hidden">{children}</div>

        {/* Right Panel */}
        {rightPanel && <div className="relative z-10">{rightPanel}</div>}
      </div>
    );
  }

  // Default layout (original)
  return (
    <div className="min-h-screen bg-bg-base grid-pattern relative">
      <div className="noise-bg absolute inset-0" />

      <div className="relative z-10">
        {/* Header */}
        {header && <header className="sticky top-0 z-20">{header}</header>}

        {/* Main Content */}
        <main className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
