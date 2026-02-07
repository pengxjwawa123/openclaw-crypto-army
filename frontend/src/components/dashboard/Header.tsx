import { Activity, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusDot } from '../ui/StatusDot';
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
    <div className="bg-bg-elevated border-b border-bg-surface gradient-mesh shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <Activity className="text-primary" size={32} strokeWidth={2.5} />
            <h1 className="text-3xl font-bold font-mono text-text-primary tracking-tight">
              OpenClaw Control Center
            </h1>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-4 px-4 py-2 bg-bg-surface/50 rounded-lg border border-bg-hover backdrop-blur-sm">
              <div className="flex flex-col">
                <span className="text-xs font-accent text-text-muted uppercase tracking-wider">
                  Total
                </span>
                <span className="text-xl font-mono font-bold text-text-primary">{totalBots}</span>
              </div>
              <div className="w-px h-8 bg-bg-hover" />
              <div className="flex flex-col">
                <span className="text-xs font-accent text-text-muted uppercase tracking-wider">
                  Running
                </span>
                <span className="text-xl font-mono font-bold text-success">{runningBots}</span>
              </div>
              <div className="w-px h-8 bg-bg-hover" />
              <div className="flex flex-col">
                <span className="text-xs font-accent text-text-muted uppercase tracking-wider">
                  Stopped
                </span>
                <span className="text-xl font-mono font-bold text-text-muted">{stoppedBots}</span>
              </div>
              {errorBots > 0 && (
                <>
                  <div className="w-px h-8 bg-bg-hover" />
                  <div className="flex flex-col">
                    <span className="text-xs font-accent text-text-muted uppercase tracking-wider">
                      Error
                    </span>
                    <span className="text-xl font-mono font-bold text-danger">{errorBots}</span>
                  </div>
                </>
              )}
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-surface/50 rounded-lg border border-bg-hover backdrop-blur-sm">
              <StatusDot
                status={connected ? 'running' : 'error'}
                size="sm"
                showPulse={connected}
              />
              <span className="text-sm font-accent text-text-secondary">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Create Button */}
            <Button
              onClick={onCreateBot}
              variant="primary"
              size="lg"
              leftIcon={<Plus size={22} />}
              className="shadow-glow-md hover:shadow-glow-lg font-bold border-2 border-primary hover:border-primary-light"
            >
              Create Bot
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
