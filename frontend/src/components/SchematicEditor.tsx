/**
 * Synthra Schematic Editor - Main Canvas Component
 * Advanced Konva.js-based circuit editor with real-time collaboration
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useSchematicStore } from '../store/schematicStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { ComponentPalette } from './ComponentPalette';
import { CodePreview } from './CodePreview';
import { Toolbar } from './Toolbar';
import { UserCursors } from './UserCursors';

interface SchematicEditorProps {
  roomId: string;
  userId: string;
  username: string;
}

export const SchematicEditor: React.FC<SchematicEditorProps> = ({
  roomId,
  userId,
  username
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [tool, setTool] = useState<'select' | 'wire' | 'pan'>('select');
  const [isPanning, setIsPanning] = useState(false);
  const [wireStart, setWireStart] = useState<{ x: number; y: number } | null>(null);
  
  // Zustand store for schematic state
  const {
    components,
    wires,
    selectedComponentId,
    addComponent,
    moveComponent,
    deleteComponent,
    addWire,
    deleteWire,
    selectComponent,
    setComponents,
    setWires
  } = useSchematicStore();
  
  // WebSocket for real-time collaboration
  const {
    isConnected,
    users,
    cursors,
    sendChange,
    sendCursor
  } = useWebSocket(roomId, userId, username);
  
  // Handle stage resize
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        setStageSize({
          width: container.offsetWidth,
          height: container.offsetHeight
        });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Component drag handlers
  const handleComponentDragStart = useCallback((id: string) => {
    selectComponent(id);
  }, [selectComponent]);
  
  const handleComponentDragEnd = useCallback((id: string, e: any) => {
    const component = components.find(c => c.id === id);
    if (!component) return;
    
    const newPosition = {
      x: e.target.x(),
      y: e.target.y()
    };
    
    moveComponent(id, newPosition);
    
    // Broadcast change to other users
    sendChange({
      operation: 'move_component',
      data: {
        id,
        position: newPosition,
        timestamp: Date.now()
      }
    });
  }, [components, moveComponent, sendChange]);
  
  // Wire drawing
  const handleStageClick = useCallback((e: any) => {
    if (tool !== 'wire') return;
    
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    if (!wireStart) {
      // Start wire
      setWireStart(pointerPosition);
    } else {
      // End wire
      const newWire = {
        id: `wire_${Date.now()}`,
        from: wireStart,
        to: pointerPosition,
        points: [wireStart.x, wireStart.y, pointerPosition.x, pointerPosition.y]
      };
      
      addWire(newWire);
      
      // Broadcast to other users
      sendChange({
        operation: 'add_wire',
        data: newWire
      });
      
      setWireStart(null);
    }
  }, [tool, wireStart, addWire, sendChange]);
  
  // Mouse move for cursor tracking
  const handleMouseMove = useCallback((e: any) => {
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    // Send cursor position to other users (throttled in useWebSocket)
    sendCursor(pointerPosition);
  }, [sendCursor]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected component
      if (e.key === 'Delete' && selectedComponentId) {
        deleteComponent(selectedComponentId);
        sendChange({
          operation: 'delete_component',
          data: { id: selectedComponentId }
        });
      }
      
      // Tool shortcuts
      if (e.key === 'v') setTool('select');
      if (e.key === 'w') setTool('wire');
      if (e.key === ' ') setTool('pan');
      
      // Undo/Redo
      if (e.ctrlKey && e.key === 'z') {
        // TODO: Implement undo
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, deleteComponent, sendChange]);
  
  // Render component on canvas
  const renderComponent = (comp: any) => {
    return (
      <Group
        key={comp.id}
        id={comp.id}
        x={comp.position.x}
        y={comp.position.y}
        draggable={tool === 'select'}
        onDragStart={() => handleComponentDragStart(comp.id)}
        onDragEnd={(e) => handleComponentDragEnd(comp.id, e)}
        onClick={() => selectComponent(comp.id)}
      >
        {/* Component body */}
        <Rect
          width={comp.width || 60}
          height={comp.height || 40}
          fill={comp.id === selectedComponentId ? '#e0f2fe' : '#ffffff'}
          stroke={comp.id === selectedComponentId ? '#0284c7' : '#94a3b8'}
          strokeWidth={2}
          cornerRadius={4}
          shadowColor="black"
          shadowBlur={comp.id === selectedComponentId ? 10 : 5}
          shadowOpacity={0.1}
        />
        
        {/* Component label */}
        <Text
          text={comp.type}
          fontSize={12}
          fontFamily="monospace"
          fill="#1e293b"
          width={comp.width || 60}
          align="center"
          y={8}
        />
        
        {/* Component value */}
        {comp.value && (
          <Text
            text={comp.value}
            fontSize={10}
            fontFamily="monospace"
            fill="#64748b"
            width={comp.width || 60}
            align="center"
            y={24}
          />
        )}
        
        {/* Connection pins */}
        {comp.pins?.map((pin: any, idx: number) => (
          <Circle
            key={`pin-${idx}`}
            x={pin.x}
            y={pin.y}
            radius={4}
            fill="#ef4444"
            stroke="#dc2626"
            strokeWidth={1}
          />
        ))}
      </Group>
    );
  };
  
  // Render wire on canvas
  const renderWire = (wire: any) => {
    return (
      <Line
        key={wire.id}
        points={wire.points}
        stroke="#475569"
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
        onClick={() => {
          if (tool === 'select') {
            // TODO: Wire selection
          }
        }}
      />
    );
  };
  
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar - Component Palette */}
      <div className="w-64 bg-white border-r border-slate-200 shadow-sm">
        <ComponentPalette
          onComponentSelect={(componentType) => {
            // Add component to canvas
            const newComponent = {
              id: `comp_${Date.now()}`,
              type: componentType,
              position: { x: 100, y: 100 },
              width: 60,
              height: 40,
              pins: [
                { x: 0, y: 20 },
                { x: 60, y: 20 }
              ],
              timestamp: Date.now()
            };
            
            addComponent(newComponent);
            sendChange({
              operation: 'add_component',
              data: newComponent
            });
          }}
        />
      </div>
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <Toolbar
          currentTool={tool}
          onToolChange={setTool}
          isConnected={isConnected}
          userCount={users.length}
          onSave={() => {
            // TODO: Save schematic
            console.log('Saving schematic...');
          }}
          onExport={() => {
            // TODO: Export schematic
            console.log('Exporting...');
          }}
        />
        
        {/* Canvas */}
        <div id="canvas-container" className="flex-1 relative bg-slate-100">
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onClick={handleStageClick}
            onMouseMove={handleMouseMove}
            draggable={tool === 'pan'}
          >
            {/* Grid layer */}
            <Layer>
              {/* Draw grid */}
              {Array.from({ length: Math.ceil(stageSize.width / 20) }).map((_, i) => (
                <Line
                  key={`v-${i}`}
                  points={[i * 20, 0, i * 20, stageSize.height]}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
              ))}
              {Array.from({ length: Math.ceil(stageSize.height / 20) }).map((_, i) => (
                <Line
                  key={`h-${i}`}
                  points={[0, i * 20, stageSize.width, i * 20]}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
              ))}
            </Layer>
            
            {/* Wires layer */}
            <Layer>
              {wires.map(renderWire)}
              
              {/* Wire being drawn */}
              {wireStart && tool === 'wire' && (
                <Line
                  points={[wireStart.x, wireStart.y, wireStart.x, wireStart.y]}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dash={[5, 5]}
                />
              )}
            </Layer>
            
            {/* Components layer */}
            <Layer>
              {components.map(renderComponent)}
            </Layer>
            
            {/* Cursors layer - other users */}
            <Layer>
              <UserCursors cursors={cursors} currentUserId={userId} />
            </Layer>
          </Stage>
          
          {/* Connection status indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-slate-600">
              {isConnected ? `${users.length} users` : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar - Code Preview */}
      <div className="w-96 bg-white border-l border-slate-200 shadow-sm">
        <CodePreview roomId={roomId} />
      </div>
    </div>
  );
};
