import { useEffect, useRef, useState } from 'react';
import { BotStatus } from './types';

interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket(url: string) {
  const [botStatuses, setBotStatuses] = useState<Map<string, BotStatus>>(new Map());
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connect = () => {
      // In development, always connect to localhost:3000 for WebSocket
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let wsUrl: string;

      if (url.startsWith('ws')) {
        wsUrl = url;
      } else if (isDev) {
        // Development: connect to backend on port 3000
        wsUrl = `ws://localhost:3000${url}`;
      } else {
        // Production: connect to same host
        wsUrl = `${protocol}//${window.location.host}${url}`;
      }

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'bot:status':
              if (Array.isArray(message.data)) {
                setBotStatuses((prev) => {
                  const next = new Map(prev);
                  message.data.forEach((status: BotStatus) => {
                    next.set(status.id, status);
                  });
                  return next;
                });
              }
              break;

            case 'bot:created':
            case 'bot:removed':
              // Will be handled by status updates
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        wsRef.current = null;

        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Reconnecting...');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        // Suppress error logging during reconnection attempts
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          console.log('WebSocket connection failed, will retry...');
        } else {
          console.error('WebSocket error:', error);
        }
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  return { botStatuses, connected };
}
