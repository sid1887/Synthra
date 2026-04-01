import React, { useRef, useEffect, useState } from 'react';
import { Undo2, Redo2, ZoomIn, ZoomOut, Grid3x3 } from 'lucide-react';
import Button from './ui/Button';

interface CanvasProps {
  onComponentDrop?: (x: number, y: number, componentData: unknown) => void;
  onCanvasClick?: (x: number, y: number) => void;
}

const SchematicCanvas: React.FC<CanvasProps> = ({
  onComponentDrop,
  onCanvasClick,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(16);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.max(0.1, Math.min(3, prev * delta)));
    }
  };

  // Handle panning with middle mouse button
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle mouse button
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle drag and drop for components
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    const componentData = e.dataTransfer.getData('component');
    if (componentData) {
      try {
        const component = JSON.parse(componentData);
        onComponentDrop?.(x, y, component);
      } catch (error) {
        console.error('Failed to parse dropped component:', error);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      onCanvasClick?.(x, y);
    }
  };

  return (
    <div className="canvas-container">
      {/* Toolbar */}
      <div className="canvas-toolbar">
        <div className="toolbar-group">
          <Button
            size="icon"
            variant="ghost"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={18} />
          </Button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <Button
            size="icon"
            variant="ghost"
            title="Zoom In (Ctrl++)"
            onClick={() => setZoom((prev) => Math.min(3, prev + 0.1))}
          >
            <ZoomIn size={18} />
          </Button>
          <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
          <Button
            size="icon"
            variant="ghost"
            title="Zoom Out (Ctrl+-)"
            onClick={() => setZoom((prev) => Math.max(0.1, prev - 0.1))}
          >
            <ZoomOut size={18} />
          </Button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <Button
            size="icon"
            variant={showGrid ? 'primary' : 'ghost'}
            title="Toggle Grid"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3x3 size={18} />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="canvas-area"
        style={{
          backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundImage: showGrid
            ? `linear-gradient(0deg, transparent ${gridSize * zoom - 1}px, var(--color-border) ${gridSize * zoom - 1}px), linear-gradient(90deg, transparent ${gridSize * zoom - 1}px, var(--color-border) ${gridSize * zoom - 1}px)`
            : 'none',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
      >
        {/* SVG for drawing schematics */}
        <svg
          className="canvas-svg"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Grid lines (optional, rendered via SVG) */}
          <defs>
            <pattern
              id="grid"
              width={gridSize}
              height={gridSize}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>

          {/* Components and wires rendered here */}
          <g className="components-group" />
          <g className="wires-group" />
        </svg>

        {/* Placeholder */}
        <div className="canvas-placeholder">
          <p>Drag components here to create your schematic</p>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            Use mouse wheel + Ctrl to zoom, middle mouse to pan
          </span>
        </div>
      </div>
    </div>
  );
};

export default SchematicCanvas;
