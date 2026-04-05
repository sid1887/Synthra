/**
 * useWebSocket - React Hook for WebSocket Communication
 * Real-time data subscriptions and updates
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  send: (message: WebSocketMessage) => void;
  subscribe: (channel: string, callback: (data: any) => void) => () => void;
  unsubscribe: (channel: string) => void;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = `ws://${window.location.hostname}:${window.location.port}/ws`,
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const subscriptionsRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Send initial ping
        ws.send(JSON.stringify({ type: 'ping' }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);

          // Route message to subscribers
          switch (message.type) {
            case 'channel-update':
              handleChannelUpdate(message);
              break;

            case 'data-update':
              handleDataUpdate(message);
              break;

            case 'subscribed':
            case 'unsubscribed':
            case 'connected':
            case 'pong':
              console.log(`[WebSocket] ${message.type}:`, message);
              break;

            default:
              console.log('[WebSocket] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `[WebSocket] Reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        } else {
          console.error('[WebSocket] Max reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      }
    }
  }, [url, reconnectInterval, maxReconnectAttempts]);

  /**
   * Send message to WebSocket server
   */
  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Not connected, cannot send message:', message);
    }
  }, []);

  /**
   * Subscribe to a data channel
   */
  const subscribe = useCallback(
    (channel: string, callback: (data: any) => void) => {
      // Add callback to subscriptions
      if (!subscriptionsRef.current.has(channel)) {
        subscriptionsRef.current.set(channel, new Set());
        // Tell server about subscription
        send({ type: 'subscribe', channel });
      }

      const callbacks = subscriptionsRef.current.get(channel)!;
      callbacks.add(callback);

      // Return unsubscribe function
      return () => {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          subscriptionsRef.current.delete(channel);
          send({ type: 'unsubscribe', channel });
        }
      };
    },
    [send]
  );

  /**
   * Unsubscribe from a data channel
   */
  const unsubscribe = useCallback(
    (channel: string) => {
      subscriptionsRef.current.delete(channel);
      send({ type: 'unsubscribe', channel });
    },
    [send]
  );

  /**
   * Handle channel update messages
   */
  const handleChannelUpdate = (message: WebSocketMessage) => {
    const channel = message.channel as string;
    const callbacks = subscriptionsRef.current.get(channel);

    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          console.error(`[WebSocket] Callback error for channel ${channel}:`, error);
        }
      });
    }
  };

  /**
   * Handle data update messages
   */
  const handleDataUpdate = (message: WebSocketMessage) => {
    const channel = message.channel as string;
    const callbacks = subscriptionsRef.current.get(channel);

    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(message.data);
        } catch (error) {
          console.error(`[WebSocket] Callback error for channel ${channel}:`, error);
        }
      });
    }
  };

  /**
   * Setup and cleanup
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [autoConnect, connect]);

  return {
    send,
    subscribe,
    unsubscribe,
    isConnected,
    lastMessage,
  };
}

/**
 * useWebSocketData - Hook for subscribing to specific data channels
 */
export function useWebSocketData<T = any>(
  channel: string,
  initialValue: T,
  options?: UseWebSocketOptions
): [T, boolean] {
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const { subscribe, isConnected } = useWebSocket(options);

  useEffect(() => {
    if (!isConnected) {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);
    const unsubscribe = subscribe(channel, (newData) => {
      setData(newData);
    });

    return unsubscribe;
  }, [channel, isConnected, subscribe]);

  return [data, isLoading];
}

export type { WebSocketMessage, UseWebSocketOptions, UseWebSocketReturn };
