/**
 * WebSocket Hook for Real-Time Collaboration
 * Connects to Synthra Real-Time service and manages room state
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSchematicStore } from '../store/schematicStore';

interface User {
  user_id: string;
  username: string;
}

interface Cursor {
  user_id: string;
  username: string;
  position: { x: number; y: number };
}

interface UseWebSocketReturn {
  isConnected: boolean;
  users: User[];
  cursors: Cursor[];
  sendChange: (change: any) => void;
  sendCursor: (position: { x: number; y: number }) => void;
}

const WS_URL = process.env.REACT_APP_REALTIME_URL || 'ws://localhost:8006';

export const useWebSocket = (
  roomId: string,
  userId: string,
  username: string
): UseWebSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [cursors, setCursors] = useState<Cursor[]>([]);
  
  // Cursor throttling
  const lastCursorSent = useRef<number>(0);
  const CURSOR_THROTTLE_MS = 50; // Send cursor max every 50ms
  
  useEffect(() => {
    // Connect to WebSocket server
    const socket = io(WS_URL, {
      transports: ['websocket'],
      query: {
        room_id: roomId,
        user_id: userId,
        username: username
      },
      path: `/ws/${roomId}`
    });
    
    socketRef.current = socket;
    
    // Connection events
    socket.on('connect', () => {
      console.log('✓ Connected to real-time service');
      setIsConnected(true);
    });
    
    socket.on('disconnect', () => {
      console.log('✗ Disconnected from real-time service');
      setIsConnected(false);
    });
    
    // Room state event - initial sync
    socket.on('room_state', (data: any) => {
      console.log('Received room state:', data);
      const store = useSchematicStore.getState();
      if (data.components) {
        store.setComponents(data.components);
      }
      if (data.wires) {
        store.setWires(data.wires);
      }
    });
    
    // User presence events
    socket.on('user_joined', (data: any) => {
      console.log('User joined:', data.username);
      setUsers(prev => [...prev, { user_id: data.user_id, username: data.username }]);
    });
    
    socket.on('user_left', (data: any) => {
      console.log('User left:', data.username);
      setUsers(prev => prev.filter(u => u.user_id !== data.user_id));
      setCursors(prev => prev.filter(c => c.user_id !== data.user_id));
    });
    
    // Change events
    socket.on('change_applied', (data: any) => {
      console.log('Change applied:', data.change);
      const { operation, data: changeData } = data.change;
      const store = useSchematicStore.getState();
      
      // Apply changes to store based on operation type
      switch (operation) {
        case 'add_component':
          store.addComponent(changeData);
          break;
        case 'move_component':
          store.moveComponent(changeData.id, changeData.position);
          break;
        case 'delete_component':
          store.deleteComponent(changeData.id);
          break;
        case 'update_component':
          store.updateComponent(changeData.id, changeData.updates);
          break;
        case 'add_wire':
          store.addWire(changeData);
          break;
        case 'delete_wire':
          store.deleteWire(changeData.id);
          break;
        default:
          console.warn('Unknown operation:', operation);
      }
    });
    
    // Cursor events
    socket.on('cursor_update', (data: any) => {
      setCursors(prev => {
        const existing = prev.find(c => c.user_id === data.user_id);
        if (existing) {
          return prev.map(c =>
            c.user_id === data.user_id
              ? { ...c, position: data.position }
              : c
          );
        } else {
          return [...prev, {
            user_id: data.user_id,
            username: data.username,
            position: data.position
          }];
        }
      });
    });
    
    // Code generation events
    socket.on('code_update', (data: any) => {
      console.log('Code update:', data.code_type);
      // Dispatch custom event for CodePreview component
      window.dispatchEvent(new CustomEvent('code_update', { detail: data }));
    });
    
    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [roomId, userId, username]);
  
  // Send change to server
  const sendChange = useCallback((change: any) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('message', JSON.stringify({
      type: 'change',
      operation: change.operation,
      data: change.data,
      timestamp: Date.now(),
      vector_clock: {} // TODO: Implement vector clock
    }));
  }, []);
  
  // Send cursor position (throttled)
  const sendCursor = useCallback((position: { x: number; y: number }) => {
    if (!socketRef.current?.connected) return;
    
    const now = Date.now();
    if (now - lastCursorSent.current < CURSOR_THROTTLE_MS) {
      return; // Throttle
    }
    
    lastCursorSent.current = now;
    
    socketRef.current.emit('message', JSON.stringify({
      type: 'cursor',
      position
    }));
  }, []);
  
  return {
    isConnected,
    users,
    cursors,
    sendChange,
    sendCursor
  };
};
