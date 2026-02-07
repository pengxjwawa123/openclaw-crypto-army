import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../api';
import { Modal } from './ui/Modal';
import { IconButton } from './ui/IconButton';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Logs: ${botName}`}
      size="lg"
    >
      <div className="flex justify-end mb-4">
        <IconButton
          onClick={fetchLogs}
          disabled={loading}
          variant="default"
          size="md"
          aria-label="Refresh logs"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </IconButton>
      </div>

      <div className="bg-bg-base/80 rounded-lg p-4 max-h-[60vh] overflow-y-auto font-mono text-sm border border-primary/10">
        {logs.length === 0 ? (
          <p className="text-text-muted">No logs available</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-text-secondary whitespace-pre-wrap break-all hover:text-text-primary transition-colors">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
