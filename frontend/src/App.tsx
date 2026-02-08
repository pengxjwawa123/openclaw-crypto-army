import { useEffect, useState, useMemo } from 'react';
import { Bot } from './types';
import { api } from './api';
import { useWebSocket } from './useWebSocket';
import { BotCard } from './components/BotCard';
import { CreateBotModal } from './components/CreateBotModal';
import { LogsModal } from './components/LogsModal';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { Header } from './components/dashboard/Header';
import { EmptyState } from './components/dashboard/EmptyState';
import { Skeleton } from './components/ui/Skeleton';
import { ImagePullProgress } from './components/ui/ImagePullProgress';

export default function App() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creatingBot, setCreatingBot] = useState(false);
  const [creationStatus, setCreationStatus] = useState<'pulling' | 'creating' | 'success' | 'error'>('pulling');
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

  // Calculate stats
  const stats = useMemo(() => {
    const total = bots.length;
    const running = bots.filter((b) => b.status.state === 'running').length;
    const stopped = bots.filter((b) => b.status.state === 'stopped').length;
    const error = bots.filter((b) => b.status.state === 'error').length;
    return { total, running, stopped, error };
  }, [bots]);

  const handleCreateBot = async (data: { name: string; image: string; env: Record<string, string> }) => {
    try {
      // Close modal and show loading progress
      setCreateModalOpen(false);
      setCreatingBot(true);
      setCreationStatus('pulling');

      // Simulate image pulling phase (first 60% of time)
      const pullTimer = setTimeout(() => {
        setCreationStatus('creating');
      }, 3000);

      // Create the bot
      await api.createBot(data);
      clearTimeout(pullTimer);

      // Show success state
      setCreationStatus('success');

      // Reload bots and hide progress after a short delay
      await loadBots();
      setTimeout(() => {
        setCreatingBot(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to create bot:', error);
      setCreationStatus('error');
      setTimeout(() => {
        setCreatingBot(false);
        alert('Failed to create bot');
      }, 2000);
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
      <DashboardLayout
        header={
          <Header
            connected={false}
            totalBots={0}
            runningBots={0}
            stoppedBots={0}
            errorBots={0}
            onCreateBot={() => {}}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      header={
        <Header
          connected={connected}
          totalBots={stats.total}
          runningBots={stats.running}
          stoppedBots={stats.stopped}
          errorBots={stats.error}
          onCreateBot={() => setCreateModalOpen(true)}
        />
      }
    >
      {bots.length === 0 ? (
        <EmptyState onCreateBot={() => setCreateModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot, index) => (
            <div
              key={bot.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
            >
              <BotCard
                bot={bot}
                onStart={() => handleStartBot(bot.id)}
                onStop={() => handleStopBot(bot.id)}
                onRestart={() => handleRestartBot(bot.id)}
                onDelete={() => handleDeleteBot(bot.id, bot.name)}
                onViewLogs={() => handleViewLogs(bot.id, bot.name)}
              />
            </div>
          ))}
        </div>
      )}

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

      <ImagePullProgress
        isVisible={creatingBot}
        status={creationStatus}
      />
    </DashboardLayout>
  );
}
