import { useEffect, useState } from 'react';
import { Bot } from './types';
import { api } from './api';
import { useWebSocket } from './useWebSocket';
import { CreateBotModal } from './components/CreateBotModal';
import { LogsModal } from './components/LogsModal';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { ContainerSidebar } from './components/dashboard/ContainerSidebar';
import { ChatInterface } from './components/dashboard/ChatInterface';
import { ContainerDetailPanel } from './components/dashboard/ContainerDetailPanel';
import { ImagePullProgress } from './components/ui/ImagePullProgress';

export default function App() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creatingBot, setCreatingBot] = useState(false);
  const [creationStatus, setCreationStatus] = useState<'pulling' | 'creating' | 'success' | 'error'>('pulling');
  const [logsModal, setLogsModal] = useState<{ open: boolean; botId: string; botName: string }>({
    open: false,
    botId: '',
    botName: '',
  });

  const { botStatuses } = useWebSocket('/ws');

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

  const handleSelectBot = (botId: string) => {
    setSelectedBotId(botId);
    setShowDetailPanel(true);
  };

  // Get selected bot object
  const selectedBot = selectedBotId ? bots.find((b) => b.id === selectedBotId) || null : null;

  // Auto-select first bot when bots load
  useEffect(() => {
    if (!loading && bots.length > 0 && !selectedBotId) {
      setSelectedBotId(bots[0].id);
    }
  }, [bots, loading, selectedBotId]);

  if (loading) {
    return (
      <DashboardLayout layout="three-column">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-text-muted">Loading containers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      layout="three-column"
      sidebar={
        <ContainerSidebar
          bots={bots}
          selectedBotId={selectedBotId}
          onSelectBot={handleSelectBot}
          onCreateBot={() => setCreateModalOpen(true)}
        />
      }
      rightPanel={
        showDetailPanel && selectedBot ? (
          <ContainerDetailPanel
            bot={selectedBot}
            onClose={() => setShowDetailPanel(false)}
            onStart={() => handleStartBot(selectedBot.id)}
            onStop={() => handleStopBot(selectedBot.id)}
            onRestart={() => handleRestartBot(selectedBot.id)}
            onDelete={() => {
              handleDeleteBot(selectedBot.id, selectedBot.name);
              setShowDetailPanel(false);
              setSelectedBotId(null);
            }}
            onViewLogs={() => handleViewLogs(selectedBot.id, selectedBot.name)}
          />
        ) : null
      }
    >
      {selectedBot ? (
        <ChatInterface
          botId={selectedBot.id}
          botName={selectedBot.name}
          isRunning={selectedBot.status.state === 'running'}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-text-muted">Select a container to start chatting</p>
          </div>
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

      <ImagePullProgress isVisible={creatingBot} status={creationStatus} />
    </DashboardLayout>
  );
}
