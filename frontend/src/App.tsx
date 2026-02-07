import { useEffect, useState } from 'react';
import { Plus, Activity } from 'lucide-react';
import { Bot } from './types';
import { api } from './api';
import { useWebSocket } from './useWebSocket';
import { BotCard } from './components/BotCard';
import { CreateBotModal } from './components/CreateBotModal';
import { LogsModal } from './components/LogsModal';

export default function App() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [logsModal, setLogsModal] = useState<{ open: boolean; botId: string; botName: string }>({
    open: false,
    botId: '',
    botName: '',
  });

  const { botStatuses, connected } = useWebSocket('/ws');

  const loadBots = async () => {
    try {
      const data = await api.getBots();
      setBots(data);
    } catch (error) {
      console.error('Failed to load bots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBots();
  }, []);

  // Update bot statuses from WebSocket
  useEffect(() => {
    if (botStatuses.size > 0) {
      setBots((prevBots) =>
        prevBots.map((bot) => {
          const status = botStatuses.get(bot.id);
          return status ? { ...bot, status } : bot;
        })
      );
    }
  }, [botStatuses]);

  const handleCreateBot = async (data: { name: string; image: string; env: Record<string, string> }) => {
    try {
      await api.createBot(data);
      await loadBots();
    } catch (error) {
      console.error('Failed to create bot:', error);
      alert('Failed to create bot');
    }
  };

  const handleStartBot = async (id: string) => {
    try {
      await api.startBot(id);
    } catch (error) {
      console.error('Failed to start bot:', error);
      alert('Failed to start bot');
    }
  };

  const handleStopBot = async (id: string) => {
    try {
      await api.stopBot(id);
    } catch (error) {
      console.error('Failed to stop bot:', error);
      alert('Failed to stop bot');
    }
  };

  const handleRestartBot = async (id: string) => {
    try {
      await api.restartBot(id);
    } catch (error) {
      console.error('Failed to restart bot:', error);
      alert('Failed to restart bot');
    }
  };

  const handleDeleteBot = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await api.deleteBot(id);
      await loadBots();
    } catch (error) {
      console.error('Failed to delete bot:', error);
      alert('Failed to delete bot');
    }
  };

  const handleViewLogs = (id: string, name: string) => {
    setLogsModal({ open: true, botId: id, botName: name });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="text-blue-500" size={32} />
              <h1 className="text-3xl font-bold text-white">OpenClaw Control Center</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-400">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={20} />
                Create Bot
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {bots.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">No bots created yet</p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={20} />
              Create Your First Bot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                onStart={() => handleStartBot(bot.id)}
                onStop={() => handleStopBot(bot.id)}
                onRestart={() => handleRestartBot(bot.id)}
                onDelete={() => handleDeleteBot(bot.id, bot.name)}
                onViewLogs={() => handleViewLogs(bot.id, bot.name)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateBotModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateBot}
      />

      <LogsModal
        isOpen={logsModal.open}
        botId={logsModal.botId}
        botName={logsModal.botName}
        onClose={() => setLogsModal({ open: false, botId: '', botName: '' })}
      />
    </div>
  );
}
