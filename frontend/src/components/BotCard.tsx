import { useState } from 'react';
import { Play, Square, RotateCw, Trash2, FileText, Copy, Check } from 'lucide-react';
import { Bot } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { StatusDot } from './ui/StatusDot';
import { IconButton } from './ui/IconButton';
import { formatUptime, formatPercentage } from '../lib/formatters';

interface BotCardProps {
  bot: Bot;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onDelete: () => void;
  onViewLogs: () => void;
}

export function BotCard({ bot, onStart, onStop, onRestart, onDelete, onViewLogs }: BotCardProps) {
  const { status } = bot;
  const isRunning = status.state === 'running';
  const isStopped = status.state === 'stopped';
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (bot.wallet?.address) {
      navigator.clipboard.writeText(bot.wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusDotState = (): 'running' | 'stopped' | 'error' | 'pending' | 'paused' => {
    switch (status.state) {
      case 'running':
        return 'running';
      case 'stopped':
        return 'stopped';
      case 'error':
        return 'error';
      case 'paused':
        return 'paused';
      case 'creating':
      case 'removing':
        return 'pending';
      default:
        return 'stopped';
    }
  };

  const getBadgeVariant = (): 'success' | 'warning' | 'error' | 'default' => {
    switch (status.state) {
      case 'running':
        return 'success';
      case 'error':
        return 'error';
      case 'creating':
      case 'removing':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card variant="interactive" padding="md" className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <StatusDot status={getStatusDotState()} size="md" />
            <h3 className="text-xl font-bold font-mono text-text-primary truncate">
              {bot.name}
            </h3>
          </div>
          <p className="text-sm text-text-muted font-mono truncate mb-1">{bot.image}</p>
          {bot.wallet?.address && (
            <div className="flex items-center gap-2 group">
              <p className="text-xs text-primary font-mono truncate">
                {bot.wallet.address.slice(0, 6)}...{bot.wallet.address.slice(-4)}
              </p>
              <button
                onClick={copyAddress}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy address"
              >
                {copied ? (
                  <Check size={14} className="text-success" />
                ) : (
                  <Copy size={14} className="text-text-muted hover:text-primary" />
                )}
              </button>
            </div>
          )}
        </div>
        <Badge variant={getBadgeVariant()} size="sm" withDot>
          {status.state}
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
        <div className="bg-bg-hover/50 rounded-lg p-3 border border-bg-surface">
          <p className="text-xs font-accent text-text-muted uppercase tracking-wider mb-1">
            Uptime
          </p>
          <p className="text-lg font-mono font-bold text-text-primary">
            {formatUptime(status.uptime ? status.uptime / 1000 : 0)}
          </p>
        </div>

        {isRunning && status.cpu !== undefined ? (
          <div className="bg-bg-hover/50 rounded-lg p-3 border border-bg-surface">
            <p className="text-xs font-accent text-text-muted uppercase tracking-wider mb-1">CPU</p>
            <p className="text-lg font-mono font-bold text-primary">
              {formatPercentage(status.cpu)}
            </p>
          </div>
        ) : (
          <div className="bg-bg-hover/50 rounded-lg p-3 border border-bg-surface opacity-50">
            <p className="text-xs font-accent text-text-muted uppercase tracking-wider mb-1">CPU</p>
            <p className="text-lg font-mono font-bold text-text-muted">—</p>
          </div>
        )}

        {isRunning && status.memory !== undefined ? (
          <div className="bg-bg-hover/50 rounded-lg p-3 border border-bg-surface col-span-2">
            <p className="text-xs font-accent text-text-muted uppercase tracking-wider mb-1">
              Memory
            </p>
            <p className="text-lg font-mono font-bold text-info">
              {formatPercentage(status.memory)}
            </p>
          </div>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {isStopped && (
          <Button onClick={onStart} variant="success" size="sm" leftIcon={<Play size={16} />}>
            Start
          </Button>
        )}

        {isRunning && (
          <>
            <Button onClick={onStop} variant="danger" size="sm" leftIcon={<Square size={16} />}>
              Stop
            </Button>
            <Button onClick={onRestart} variant="primary" size="sm" leftIcon={<RotateCw size={16} />}>
              Restart
            </Button>
          </>
        )}

        <Button onClick={onViewLogs} variant="secondary" size="sm" leftIcon={<FileText size={16} />}>
          Logs
        </Button>

        <IconButton
          onClick={onDelete}
          variant="danger"
          size="sm"
          className="ml-auto"
          aria-label="Delete bot"
        >
          <Trash2 size={16} />
        </IconButton>
      </div>
    </Card>
  );
}
