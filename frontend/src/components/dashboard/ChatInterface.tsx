import { useState, useRef, useEffect } from 'react';
import { Send, Bot as BotIcon, User, Terminal } from 'lucide-react';
import { Bot } from '../../types';
import { cn } from '../../lib/cn';
import { Input } from '../ui/Input';
import { IconButton } from '../ui/IconButton';

interface ChatInterfaceProps {
  bot: Bot | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function ChatInterface({ bot }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset messages when bot changes
  useEffect(() => {
    if (bot) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hello! I'm connected to **${bot.name}**. How can I assist you today?`,
          timestamp: Date.now(),
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [bot?.id]);

  const handleSend = async () => {
    if (!input.trim() || !bot) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const responses = [
        `I'm analyzing your request for **${bot.name}**...`,
        `Based on the container status (${bot.status.state}), here's what I found...`,
        `Let me help you with that. The container is currently ${bot.status.state}.`,
        `I can help you manage this container. What would you like to do?`,
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!bot) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-base">
        <div className="text-center">
          <Terminal className="mx-auto mb-4 text-text-muted" size={64} strokeWidth={1.5} />
          <h3 className="text-xl font-bold text-text-primary mb-2 font-display">
            Select a Container
          </h3>
          <p className="text-text-muted">Choose a container from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-base">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-bg-surface bg-bg-elevated">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
            <Terminal className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-text-primary font-display">{bot.name}</h2>
            <p className="text-sm text-text-muted">
              Chat with container • <span className="capitalize">{bot.status.state}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <BotIcon size={16} className="text-primary" />
              </div>
            )}
            <div
              className={cn(
                'max-w-2xl px-4 py-3 rounded-lg',
                message.role === 'user'
                  ? 'bg-primary text-bg-base'
                  : 'bg-bg-elevated border border-bg-surface text-text-primary'
              )}
            >
              <div
                className={cn(
                  'text-sm leading-relaxed',
                  message.role === 'user' ? 'font-medium' : ''
                )}
                dangerouslySetInnerHTML={{
                  __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                }}
              />
              <div
                className={cn(
                  'text-xs mt-1',
                  message.role === 'user' ? 'text-primary-dark' : 'text-text-muted'
                )}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <User size={16} className="text-bg-base" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <BotIcon size={16} className="text-primary" />
            </div>
            <div className="px-4 py-3 rounded-lg bg-bg-elevated border border-bg-surface">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-bg-surface bg-bg-elevated">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${bot.name}...`}
            className="flex-1"
            disabled={isTyping}
          />
          <IconButton
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            size="lg"
            aria-label="Send message"
            className="bg-primary hover:bg-primary-light text-bg-base shadow-glow-md hover:shadow-glow-lg"
          >
            <Send size={20} />
          </IconButton>
        </div>
        <p className="text-xs text-text-muted mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
