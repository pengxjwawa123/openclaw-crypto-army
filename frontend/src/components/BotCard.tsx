import { Play, Square, RotateCw, Trash2, FileText, Activity } from 'lucide-react';
import { Bot } from '../types';

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

  const getStateColor = () => {
    switch (status.state) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      case 'creating':
      case 'removing':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatUptime = (ms?: number) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${getStateColor()}`} />
            <h3 className="text-xl font-semibold text-white">{bot.name}</h3>
          </div>
          <p className="text-sm text-gray-400 font-mono">{bot.image}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-400">Status</p>
          <p className="text-white font-medium capitalize">{status.state}</p>
        </div>
        <div>
          <p className="text-gray-400">Uptime</p>
          <p className="text-white font-medium">{formatUptime(status.uptime)}</p>
        </div>
        {isRunning && (
          <>
            <div>
              <p className="text-gray-400">CPU</p>
              <p className="text-white font-medium">{status.cpu?.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-400">Memory</p>
              <p className="text-white font-medium">{status.memory?.toFixed(1)}%</p>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        {isStopped && (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm font-medium"
          >
            <Play size={16} />
            Start
          </button>
        )}

        {isRunning && (
          <>
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium"
            >
              <Square size={16} />
              Stop
            </button>
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
            >
              <RotateCw size={16} />
              Restart
            </button>
          </>
        )}

        <button
          onClick={onViewLogs}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm font-medium"
        >
          <FileText size={16} />
          Logs
        </button>

        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-red-600 text-white rounded-md transition-colors text-sm font-medium ml-auto"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
