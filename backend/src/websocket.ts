/**
 * WebSocket Setup for Backend
 * Real-time data streaming from backend to frontend
 */

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { Request, Response } from 'express';

interface ClientSocket {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
}

/**
 * Initialize WebSocket Server
 */
export function initializeWebSocketServer(httpServer: HTTPServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, ClientSocket>();

  wss.on('connection', (ws: WebSocket) => {
    const clientId = generateClientId();
    console.log(`[WebSocket] Client connected: ${clientId}`);

    const clientSocket: ClientSocket = {
      id: clientId,
      ws,
      subscriptions: new Set(),
    };

    clients.set(clientId, clientSocket);

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(clientSocket, message, clients);
      } catch (error) {
        console.error(`[WebSocket] Failed to parse message from ${clientId}:`, error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    // Handle disconnections
    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected: ${clientId}`);
      clients.delete(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[WebSocket] Error in client ${clientId}:`, error);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
    }));
  });

  // Return broadcast function and WebSocket server interface
  return {
    wss,
    clients,
    broadcast,
    broadcastToSubscribers,
  };
}

/**
 * Handle incoming WebSocket messages
 */
function handleClientMessage(
  clientSocket: ClientSocket,
  message: any,
  clients: Map<string, ClientSocket>
) {
  switch (message.type) {
    case 'subscribe':
      handleSubscription(clientSocket, message.channel);
      break;

    case 'unsubscribe':
      handleUnsubscription(clientSocket, message.channel);
      break;

    case 'request-update':
      handleUpdateRequest(clientSocket, message.data);
      break;

    case 'ping':
      clientSocket.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;

    default:
      console.log(`[WebSocket] Unknown message type: ${message.type}`);
  }
}

/**
 * Handle subscription to data channels
 */
function handleSubscription(clientSocket: ClientSocket, channel: string) {
  clientSocket.subscriptions.add(channel);
  console.log(`[WebSocket] ${clientSocket.id} subscribed to ${channel}`);

  // Send subscription confirmation
  clientSocket.ws.send(JSON.stringify({
    type: 'subscribed',
    channel,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Handle unsubscription from data channels
 */
function handleUnsubscription(clientSocket: ClientSocket, channel: string) {
  clientSocket.subscriptions.delete(channel);
  console.log(`[WebSocket] ${clientSocket.id} unsubscribed from ${channel}`);

  clientSocket.ws.send(JSON.stringify({
    type: 'unsubscribed',
    channel,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Handle data update requests
 */
function handleUpdateRequest(clientSocket: ClientSocket, data: any) {
  console.log(`[WebSocket] Update request from ${clientSocket.id}:`, data);

  // Send mock update (replace with real data)
  clientSocket.ws.send(JSON.stringify({
    type: 'data-update',
    channel: data.channel || 'simulation',
    data: generateMockData(data.type),
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Broadcast message to all connected clients
 */
function broadcast(message: any) {
  const jsonMessage = JSON.stringify(message);
  // Note: This is a reference - would be called with actual wss instance
  console.log('[WebSocket] Broadcasting to all clients:', message.type);
}

/**
 * Broadcast to subscribers of a specific channel
 */
function broadcastToSubscribers(
  channel: string,
  message: any,
  clients: Map<string, ClientSocket>
) {
  const jsonMessage = JSON.stringify({
    type: 'channel-update',
    channel,
    ...message,
    timestamp: new Date().toISOString(),
  });

  let count = 0;
  clients.forEach((client) => {
    if (client.subscriptions.has(channel)) {
      client.ws.send(jsonMessage);
      count++;
    }
  });

  console.log(`[WebSocket] Sent update to ${count} subscribers of ${channel}`);
}

/**
 * Generate mock data for different types
 */
function generateMockData(type: string): any {
  switch (type) {
    case 'transient':
      return {
        timestamp: Date.now(),
        voltage: Math.random() * 5 + 2,
        current: Math.random() * 2,
        power: (Math.random() * 5 + 2) * (Math.random() * 2),
      };

    case 'temperature':
      return {
        timestamp: Date.now(),
        componentTemps: {
          R1: 45 + Math.random() * 10,
          R2: 50 + Math.random() * 15,
          C1: 35 + Math.random() * 5,
        },
      };

    case 'analysis-progress':
      return {
        progress: Math.random() * 100,
        status: ['initializing', 'running', 'completed'][Math.floor(Math.random() * 3)],
        estimatedTime: Math.floor(Math.random() * 60),
      };

    default:
      return { value: Math.random() * 100 };
  }
}

/**
 * Generate unique client ID
 */
function generateClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export type { ClientSocket };
