import React, { useState, useEffect } from 'react';
import { useSchematicStore } from '../store/schematicStore';

interface StatusBarProps {
  cursorX?: number;
  cursorY?: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ cursorX = 0, cursorY = 0 }) => {
  const components = useSchematicStore((state) => state.components);
  const wires = useSchematicStore((state) => state.wires);
  const selectedComponentId = useSchematicStore((state) => state.selectedComponentId);
  const [fps, setFps] = useState(60);
  const [zoom, setZoom] = useState(100);

  // Calculate FPS (simplified)
  useEffect(() => {
    let frameCount = 0;
    let lastTime = Date.now();

    const countFrame = () => {
      frameCount++;
      const now = Date.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(countFrame);
    };

    countFrame();
  }, []);

  const selectedCount = selectedComponentId ? 1 : 0;

  return (
    <footer className="status-bar">
      <div className="status-left">
        <div className="status-item">
          <span className="status-label">Position:</span>
          <span className="status-value">
            {cursorX.toFixed(0)}, {cursorY.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="status-center">
        <div className="status-item">
          <span className="status-label">Components:</span>
          <span className="status-value">{components.length}</span>
        </div>
        <div className="status-separator" />
        <div className="status-item">
          <span className="status-label">Wires:</span>
          <span className="status-value">{wires.length}</span>
        </div>
        <div className="status-separator" />
        <div className="status-item">
          <span className="status-label">Selected:</span>
          <span className="status-value">{selectedCount}</span>
        </div>
      </div>

      <div className="status-right">
        <div className="status-item">
          <span className="status-label">Zoom:</span>
          <span className="status-value">{zoom}%</span>
        </div>
        <div className="status-separator" />
        <div className="status-item">
          <span className="status-label">FPS:</span>
          <span className={`status-value ${fps < 30 ? 'text-red-500' : ''}`}>
            {fps}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
