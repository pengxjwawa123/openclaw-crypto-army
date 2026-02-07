import { Activity, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusDot } from '../ui/StatusDot';
import { MasterWallet } from './MasterWallet';
import { cn } from '../../lib/cn';

export interface HeaderProps {
  connected: boolean;
  totalBots: number;
  runningBots: number;
  stoppedBots: number;
  errorBots: number;
  onCreateBot: () => void;
}

export function Header({
  connected,
  totalBots,
  runningBots,
  stoppedBots,
  errorBots,
  onCreateBot,
}: HeaderProps) {
  return (
    <header className="bg-bg-elevated border-b border-bg-surface gradient-mesh shadow-lg sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto p-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Activity className="text-primary" size={28} strokeWidth={2.5} />
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-text-primary tracking-tight">
              OpenClaw Crypto Army
            </h1>
          </div>

          {/* Right: Stats, Wallet, Status, and Action */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Stats - Compact */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-bg-surface/30 rounded-md">
              <StatItem label="Total" value={totalBots} color="text-text-primary" />
              <div className="w-px h-5 bg-bg-hover" />
              <StatItem label="Running" value={runningBots} color="text-success" />
              <div className="w-px h-5 bg-bg-hover" />
              <StatItem label="Stopped" value={stoppedBots} color="text-text-muted" />
              {errorBots > 0 && (
                <>
                  <div className="w-px h-5 bg-bg-hover" />
                  <StatItem label="Error" value={errorBots} color="text-danger" />
                </>
              )}
            </div>

            {/* Master Wallet */}
            <MasterWallet />

            {/* Connection Status */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-bg-surface/30 rounded-md">
              <StatusDot
                status={connected ? 'running' : 'error'}
                size="sm"
                showPulse={connected}
              />
              <span className="text-xs font-accent text-text-secondary">
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Create Button */}
            <Button
              onClick={onCreateBot}
              variant="primary"
              size="md"
              leftIcon={<Plus size={18} />}
              className="shadow-glow-sm hover:shadow-glow-md font-semibold"
            >
              <span className="hidden sm:inline">Create Bot</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Helper component for cleaner stat items
function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-accent text-text-muted uppercase tracking-wider leading-none">
        {label}
      </span>
      <span className={cn('text-base font-mono font-bold leading-none', color)}>{value}</span>
    </div>
  );
}
