import { useState } from 'react';
import { Plus, Server, Circle, Activity } from 'lucide-react';
import { Bot } from '../../types';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { MasterWallet } from './MasterWallet';

interface ContainerSidebarProps {
  bots: Bot[];
  selectedBotId: string | null;
  onSelectBot: (botId: string) => void;
  onCreateBot: () => void;
}

export function ContainerSidebar({ bots, selectedBotId, onSelectBot, onCreateBot }: ContainerSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'running':
        return 'text-success';
      case 'stopped':
        return 'text-text-muted';
      case 'error':
        return 'text-danger';
      default:
        return 'text-warning';
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-16 h-full bg-bg-elevated border-r border-bg-surface flex flex-col items-center py-4 gap-3">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-bg-surface rounded-lg transition-colors"
          aria-label="Expand sidebar"
        >
          <Server size={24} className="text-primary" />
        </button>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {bots.map((bot) => (
            <button
              key={bot.id}
              onClick={() => onSelectBot(bot.id)}
              className={cn(
                'relative p-2 rounded-lg transition-all',
                selectedBotId === bot.id
                  ? 'bg-primary/20 border-2 border-primary'
                  : 'hover:bg-bg-surface border-2 border-transparent'
              )}
              aria-label={bot.name}
            >
              <Circle
                size={8}
                className={cn('absolute top-1 right-1', getStatusColor(bot.status.state))}
                fill="currentColor"
              />
              <Server size={20} className="text-text-primary" />
            </button>
          ))}
        </div>
        <button
          onClick={onCreateBot}
          className="p-2 bg-primary hover:bg-primary-light rounded-lg transition-colors shadow-glow-sm"
          aria-label="Create container"
        >
          <Plus size={20} className="text-bg-base" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 h-full bg-bg-elevated border-r border-bg-surface flex flex-col">
      {/* Header */}
      <div className="flex border-b border-bg-surface p-4 items-center gap-3 flex-shrink-0">
          <Activity className="text-primary" size={28} strokeWidth={2.5} />
          <h1 className="text-xl sm:text-lg font-bold font-mono text-text-primary tracking-tight">
            OpenClaw Crypto Army
          </h1>
        </div>

      {/* Master Wallet */}
      <div className="p-4 border-b border-bg-surface flex-shrink-0">
        <MasterWallet variant="inline" />
      </div>

      <div className="p-4 border-b border-bg-surface">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="text-primary" size={24} />
            <h2 className="font-bold text-lg text-text-primary font-display">Containers</h2>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-bg-surface rounded transition-colors"
            aria-label="Collapse sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-text-muted">
              <path d="M10 12L6 8l4-4" />
            </svg>
          </button>
        </div>
        <Button
          onClick={onCreateBot}
          variant="primary"
          size="md"
          fullWidth
          leftIcon={<Plus size={18} />}
          className="shadow-glow-md hover:shadow-glow-lg font-bold"
        >
          New Container
        </Button>
      </div>

      {/* Container List */}
      <div className="flex-1 overflow-y-auto p-2">
        {bots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Server className="text-text-muted mb-3" size={48} strokeWidth={1.5} />
            <p className="text-text-muted text-sm">No containers yet</p>
            <p className="text-text-secondary text-xs mt-1">Create one to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bots.map((bot) => (
              <button
                key={bot.id}
                onClick={() => onSelectBot(bot.id)}
                className={cn(
                  'w-full p-3 rounded-lg text-left transition-all',
                  'border-2',
                  selectedBotId === bot.id
                    ? 'bg-primary/10 border-primary shadow-glow-sm'
                    : 'bg-bg-surface/30 border-transparent hover:bg-bg-surface hover:border-bg-hover'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Server
                      size={16}
                      className={cn(
                        selectedBotId === bot.id ? 'text-primary' : 'text-text-secondary'
                      )}
                    />
                    <span className="font-semibold text-sm text-text-primary truncate font-mono">
                      {bot.name}
                    </span>
                  </div>
                  <Circle
                    size={8}
                    className={cn(getStatusColor(bot.status.state), 'mt-1')}
                    fill="currentColor"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="capitalize">{bot.status.state}</span>
                  {bot.status.state === 'running' && bot.status.uptime && (
                    <>
                      <span>•</span>
                      <span>
                        {bot.status.uptime > 3600
                          ? `${Math.floor(bot.status.uptime / 3600)}h`
                          : bot.status.uptime > 60
                          ? `${Math.floor(bot.status.uptime / 60)}m`
                          : `${Math.floor(bot.status.uptime)}s`}
                      </span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-bg-surface bg-bg-base/50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-text-muted mb-1">Total</div>
            <div className="text-lg font-bold font-mono text-text-primary">{bots.length}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">Running</div>
            <div className="text-lg font-bold font-mono text-success">
              {bots.filter((b) => b.status.state === 'running').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">Stopped</div>
            <div className="text-lg font-bold font-mono text-text-muted">
              {bots.filter((b) => b.status.state === 'stopped').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
