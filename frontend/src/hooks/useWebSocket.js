/**
 * useWebSocket - React Hook for WebSocket Communication
 * Real-time data subscriptions and updates
 */
import { useEffect, useRef, useCallback, useState } from 'react';
export function useWebSocket(options = {}) {
    const { url = `ws://${window.location.hostname}:${window.location.port}/ws`, autoConnect = true, reconnectInterval = 3000, maxReconnectAttempts = 5, } = options;
    const wsRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const subscriptionsRef = useRef(new Map());
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
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
                }
                catch (error) {
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
                    console.log(`[WebSocket] Reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
                    reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
                }
                else {
                    console.error('[WebSocket] Max reconnection attempts reached');
                }
            };
            ws.onerror = (error) => {
                console.error('[WebSocket] Error:', error);
            };
            wsRef.current = ws;
        }
        catch (error) {
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
    const send = useCallback((message) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
        else {
            console.warn('[WebSocket] Not connected, cannot send message:', message);
        }
    }, []);
    /**
     * Subscribe to a data channel
     */
    const subscribe = useCallback((channel, callback) => {
        // Add callback to subscriptions
        if (!subscriptionsRef.current.has(channel)) {
            subscriptionsRef.current.set(channel, new Set());
            // Tell server about subscription
            send({ type: 'subscribe', channel });
        }
        const callbacks = subscriptionsRef.current.get(channel);
        callbacks.add(callback);
        // Return unsubscribe function
        return () => {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                subscriptionsRef.current.delete(channel);
                send({ type: 'unsubscribe', channel });
            }
        };
    }, [send]);
    /**
     * Unsubscribe from a data channel
     */
    const unsubscribe = useCallback((channel) => {
        subscriptionsRef.current.delete(channel);
        send({ type: 'unsubscribe', channel });
    }, [send]);
    /**
     * Handle channel update messages
     */
    const handleChannelUpdate = (message) => {
        const channel = message.channel;
        const callbacks = subscriptionsRef.current.get(channel);
        if (callbacks) {
            callbacks.forEach((callback) => {
                try {
                    callback(message);
                }
                catch (error) {
                    console.error(`[WebSocket] Callback error for channel ${channel}:`, error);
                }
            });
        }
    };
    /**
     * Handle data update messages
     */
    const handleDataUpdate = (message) => {
        const channel = message.channel;
        const callbacks = subscriptionsRef.current.get(channel);
        if (callbacks) {
            callbacks.forEach((callback) => {
                try {
                    callback(message.data);
                }
                catch (error) {
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
export function useWebSocketData(channel, initialValue, options) {
    const [data, setData] = useState(initialValue);
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
