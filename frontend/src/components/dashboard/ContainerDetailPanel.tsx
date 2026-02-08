import { useState } from 'react';
import {
  X,
  Wallet,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Play,
  Square,
  RotateCw,
  Trash2,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Bot } from '../../types';
import { cn } from '../../lib/cn';
import { IconButton } from '../ui/IconButton';
import { Button } from '../ui/Button';
import { formatPercentage } from '../../lib/formatters';

interface ContainerDetailPanelProps {
  bot: Bot | null;
  onClose: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onDelete: () => void;
  onViewLogs: () => void;
}

interface ProcessingTask {
  id: string;
  title: string;
  status: 'completed' | 'processing' | 'pending' | 'error';
  progress?: number;
  timestamp: number;
}

// Mock processing tasks
const mockTasks: ProcessingTask[] = [
  { id: '1', title: 'Initialize container', status: 'completed', progress: 100, timestamp: Date.now() - 300000 },
  { id: '2', title: 'Load trading strategies', status: 'completed', progress: 100, timestamp: Date.now() - 240000 },
  { id: '3', title: 'Connect to blockchain', status: 'processing', progress: 65, timestamp: Date.now() - 120000 },
  { id: '4', title: 'Sync wallet balances', status: 'pending', timestamp: Date.now() },
  { id: '5', title: 'Start trading engine', status: 'pending', timestamp: Date.now() },
];

export function ContainerDetailPanel({
  bot,
  onClose,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onViewLogs,
}: ContainerDetailPanelProps) {
  const [tasks] = useState<ProcessingTask[]>(mockTasks);

  if (!bot) {
    return null;
  }

  const getTaskIcon = (status: ProcessingTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-success" />;
      case 'processing':
        return <Loader2 size={16} className="text-primary animate-spin" />;
      case 'error':
        return <AlertCircle size={16} className="text-danger" />;
      default:
        return <Clock size={16} className="text-text-muted" />;
    }
  };

  return (
    <div className="w-80 h-full bg-bg-elevated border-l border-bg-surface flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-bg-surface flex items-center justify-between flex-shrink-0">
        <h3 className="font-bold text-lg text-text-primary font-display">Container Details</h3>
        <IconButton onClick={onClose} variant="ghost" size="sm" aria-label="Close panel">
          <X size={18} />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Wallet Address */}
        <div className="p-4 border-b border-bg-surface">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="text-primary" size={16} />
            <span className="text-xs font-accent text-text-secondary uppercase tracking-wider">
              Wallet Address
            </span>
          </div>
          <div className="p-3 bg-bg-surface/50 rounded-lg border border-bg-surface">
            <div className="font-mono text-xs text-text-primary break-all">
              {bot.wallet?.address || 'N/A'}
            </div>
          </div>
          {bot.wallet?.derivationPath && (
            <div className="mt-2 text-xs text-text-muted">
              <span className="font-accent">Path:</span> {bot.wallet.derivationPath}
            </div>
          )}
        </div>

        {/* Status & Metrics */}
        <div className="p-4 border-b border-bg-surface space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="text-primary" size={16} />
            <span className="text-xs font-accent text-text-secondary uppercase tracking-wider">
              Performance
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-bg-surface/30 rounded-lg">
            <span className="text-sm text-text-secondary">Status</span>
            <span
              className={cn(
                'text-sm font-semibold capitalize px-2 py-1 rounded',
                bot.status.state === 'running' && 'bg-success/20 text-success',
                bot.status.state === 'stopped' && 'bg-text-muted/20 text-text-muted',
                bot.status.state === 'error' && 'bg-danger/20 text-danger'
              )}
            >
              {bot.status.state}
            </span>
          </div>

          {/* CPU */}
          {bot.status.cpu !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-primary" />
                  <span className="text-text-secondary">CPU</span>
                </div>
                <span className="font-mono font-semibold text-text-primary">
                  {formatPercentage(bot.status.cpu)}
                </span>
              </div>
              <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300"
                  style={{ width: `${Math.min(bot.status.cpu || 0, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Memory */}
          {bot.status.memory !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive size={14} className="text-primary" />
                  <span className="text-text-secondary">Memory</span>
                </div>
                <span className="font-mono font-semibold text-text-primary">
                  {formatPercentage(bot.status.memory)}
                </span>
              </div>
              <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-info to-primary transition-all duration-300"
                  style={{ width: `${Math.min(bot.status.memory || 0, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Uptime */}
          {bot.status.uptime && (
            <div className="flex items-center justify-between p-3 bg-bg-surface/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                <span className="text-sm text-text-secondary">Uptime</span>
              </div>
              <span className="font-mono text-sm font-semibold text-text-primary">
                {bot.status.uptime > 3600
                  ? `${Math.floor(bot.status.uptime / 3600)}h ${Math.floor((bot.status.uptime % 3600) / 60)}m`
                  : bot.status.uptime > 60
                  ? `${Math.floor(bot.status.uptime / 60)}m`
                  : `${Math.floor(bot.status.uptime)}s`}
              </span>
            </div>
          )}
        </div>

        {/* Processing Tasks */}
        <div className="p-4 border-b border-bg-surface">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="text-primary" size={16} />
            <span className="text-xs font-accent text-text-secondary uppercase tracking-wider">
              Processing Tasks
            </span>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-3 bg-bg-surface/30 rounded-lg border border-bg-surface hover:border-bg-hover transition-colors"
              >
                <div className="flex items-start gap-2 mb-2">
                  {getTaskIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">{task.title}</div>
                    <div className="text-xs text-text-muted">
                      {new Date(task.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                {task.status === 'processing' && task.progress !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="h-1 bg-bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-bg-surface bg-bg-base/50 space-y-2 flex-shrink-0">
        <div className="grid grid-cols-3 gap-2">
          {bot.status.state === 'stopped' ? (
            <Button onClick={onStart} variant="success" size="sm" leftIcon={<Play size={16} />}>
              Start
            </Button>
          ) : (
            <Button onClick={onStop} variant="secondary" size="sm" leftIcon={<Square size={16} />}>
              Stop
            </Button>
          )}
          <Button onClick={onRestart} variant="secondary" size="sm" leftIcon={<RotateCw size={16} />}>
            Restart
          </Button>
          <Button onClick={onViewLogs} variant="secondary" size="sm" leftIcon={<FileText size={16} />}>
            Logs
          </Button>
        </div>
        <Button onClick={onDelete} variant="danger" size="sm" fullWidth leftIcon={<Trash2 size={16} />}>
          Delete Container
        </Button>
      </div>
    </div>
  );
}
