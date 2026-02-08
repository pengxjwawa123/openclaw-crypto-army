import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Loader2,
  MessageSquare,
  Terminal,
  Trash2,
  AlertCircle,
  CheckCircle2,
  User,
  Bot as BotIcon,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/cn';

interface ChatMessage {
  id: string;
  botId: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: number;
  command?: string;
  error?: string;
}

interface ChatInterfaceProps {
  botId: string;
  botName: string;
  isRunning: boolean;
}

export function ChatInterface({ botId, botName, isRunning }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/chat/${botId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to load chat messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [botId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isRunning || sending) return;

    try {
      setSending(true);
      const response = await fetch(`http://localhost:3000/api/chat/${botId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.userMessage, data.botMessage]);
        setInputMessage('');
        inputRef.current?.focus();
      } else {
        const error = await response.json();
        console.error('Failed to send message:', error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear the chat history?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/chat/${botId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-elevated">
      {/* Header */}
      <div className="p-4 border-b border-bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="text-primary" size={16} />
          <span className="text-xs font-accent text-text-secondary uppercase tracking-wider">
            Chat with {botName}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          disabled={messages.length === 0}
          className="h-6 px-2 text-xs"
        >
          <Trash2 size={12} className="mr-1" />
          Clear
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="text-primary animate-spin" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare size={48} className="text-text-muted mb-4" />
            <p className="text-sm text-text-secondary mb-3 font-semibold">Chat with {botName}</p>
            <div className="text-xs text-text-muted max-w-sm space-y-3">
              <div className="bg-bg-surface/50 p-3 rounded-lg border border-bg-surface text-left">
                <p className="font-semibold text-primary mb-2">💬 OpenClaw Commands</p>
                <p className="mb-1">Send natural messages to interact with the bot:</p>
                <ul className="list-disc list-inside space-y-1 text-text-muted">
                  <li><code className="text-primary">status</code> - Check bot status</li>
                  <li><code className="text-primary">balance</code> - Check wallet balance</li>
                  <li><code className="text-primary">help</code> - Get available commands</li>
                  <li>Or any other message/question</li>
                </ul>
              </div>
              <div className="bg-bg-surface/50 p-3 rounded-lg border border-bg-surface text-left">
                <p className="font-semibold text-warning mb-2">⚡ Shell Commands</p>
                <p className="mb-1">Execute shell commands (start with common commands):</p>
                <ul className="list-disc list-inside space-y-1 text-text-muted">
                  <li><code className="text-warning">ls</code> - List files</li>
                  <li><code className="text-warning">pwd</code> - Current directory</li>
                  <li><code className="text-warning">cat file.txt</code> - Read file</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 p-3 rounded-lg',
                  msg.sender === 'user'
                    ? 'bg-primary/10 border border-primary/20 ml-8'
                    : 'bg-bg-surface/50 border border-bg-surface mr-8'
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {msg.sender === 'user' ? (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User size={14} className="text-primary" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                      <BotIcon size={14} className="text-success" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-text-primary">
                      {msg.sender === 'user' ? 'You' : botName}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    {msg.error && (
                      <div className="flex items-center gap-1 text-danger">
                        <AlertCircle size={10} />
                        <span className="text-xs">Error</span>
                      </div>
                    )}
                    {msg.sender === 'bot' && !msg.error && (
                      <CheckCircle2 size={10} className="text-success" />
                    )}
                  </div>
                  <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap break-words">
                    {msg.message}
                  </pre>
                  {msg.error && (
                    <div className="mt-2 p-2 bg-danger/10 border border-danger/20 rounded text-xs text-danger">
                      {msg.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-bg-surface">
        {!isRunning ? (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 text-warning">
              <AlertCircle size={14} />
              <span className="text-xs font-semibold">Container is not running</span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Start the container to send commands
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Chat with bot or run shell command..."
              disabled={sending}
              fullWidth
              className="text-xs"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || sending}
              variant="primary"
              size="md"
              className="px-4"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
