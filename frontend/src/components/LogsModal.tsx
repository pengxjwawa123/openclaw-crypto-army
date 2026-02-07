import { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { api } from '../api';

interface LogsModalProps {
  isOpen: boolean;
  botId: string;
  botName: string;
  onClose: () => void;
}

export function LogsModal({ isOpen, botId, botName, onClose }: LogsModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getBotLogs(botId, 200);
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, botId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Logs: {botName}</h2>
          <div className="flex gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-gray-900 rounded-md p-4 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs available</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-gray-300 whitespace-pre-wrap break-all">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
