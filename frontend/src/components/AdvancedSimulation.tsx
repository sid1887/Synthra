/**
 * Advanced Simulation Component (C1)
 * High-quality transient analysis visualization with smooth animations
 * Includes timeline player, real-time graphs, and component inspection
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { usePhaseCStore } from '../store/phaseC.store';
import './AdvancedSimulation.css';

interface Props {
  analysisId: string;
}

/**
 * High-performance component for transient analysis visualization
 */
export const AdvancedSimulation: React.FC<Props> = ({ analysisId }) => {
  const store = usePhaseCStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Current frame data
  const currentFrame = useMemo(
    () => store.transient.frames[store.transient.currentFrameIndex],
    [store.transient.frames, store.transient.currentFrameIndex]
  );

  /**
   * Initialize transient analysis
   */
  useEffect(() => {
    const initializeAnalysis = async () => {
      try {
        store.setTransientLoading(true);

        const response = await fetch(`/api/advanced-sim/transient/${analysisId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration: 1000, powerVoltage: 5 }),
        });

        if (!response.ok) throw new Error('Failed to fetch transient analysis');

        const data = await response.json();
        store.setTransientFrames(data.frames, 1000, 5);
        setIsInitialized(true);
      } catch (error) {
        store.setTransientError(String(error));
      }
    };

    if (!isInitialized) {
      initializeAnalysis();
    }
  }, [analysisId, isInitialized, store]);

  /**
   * Playback animation loop
   */
  useEffect(() => {
    if (!store.transient.isPlaying || !currentFrame) return;

    const animate = () => {
      const nextIndex = store.transient.currentFrameIndex + 1;
      if (nextIndex < store.transient.frames.length) {
        store.setPlaybackFrame(nextIndex);
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        store.pauseTransient();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [store.transient.isPlaying, store.transient.currentFrameIndex, store]);

  /**
   * Render visualization canvas
   */
  const renderCanvas = () => {
    if (!canvasRef.current || !currentFrame) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Render grid background
    renderGridBackground(ctx, width, height);

    // Render components
    renderComponentStates(ctx, currentFrame, width, height);
  };

  /**
   * Render grid background for better visual reference
   */
  const renderGridBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gridSize = 40
  ) => {
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.1)';
    ctx.lineWidth = 1;

    for (let i = 0; i < width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    for (let i = 0; i < height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
  };

  /**
   * Render component states with visual indicators
   */
  const renderComponentStates = (
    ctx: CanvasRenderingContext2D,
    frame: any,
    width: number,
    height: number
  ) => {
    const components = frame.components;
    const componentWidth = Math.floor((width - 60) / components.length);
    const padding = 30;
    const maxPower = 100; // Normalization for visualization

    components.forEach((comp: any, index: number) => {
      const x = padding + index * componentWidth + componentWidth / 2;
      const barHeight = (comp.power / maxPower) * (height - 100);
      const y = height - 50 - barHeight;

      // Component box
      const boxHeight = barHeight;
      const boxWidth = componentWidth * 0.7;

      // Color based on status/power
      const color = getComponentColor(comp, maxPower);
      ctx.fillStyle = color;
      ctx.fillRect(x - boxWidth / 2, y, boxWidth, boxHeight);

      // Glow effect for high power
      if (comp.power > 50) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x - boxWidth / 2 - 5, y - 5, boxWidth + 10, boxHeight + 10);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // Label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${comp.voltage.toFixed(1)}V`, x, y - 10);

      // Power indicator
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px system-ui';
      ctx.fillText(`${comp.power.toFixed(1)}W`, x, height - 20);
    });

    // Current time indicator
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`t = ${currentFrame.timeMs}ms`, 20, 30);
  };

  /**
   * Get component color based on status and power
   */
  const getComponentColor = (component: any, maxPower: number): string => {
    const powerRatio = component.power / maxPower;

    if (component.status === 'off') return '#475569';
    if (powerRatio < 0.3) return '#3b82f6'; // Blue - low
    if (powerRatio < 0.6) return '#10b981'; // Green - medium
    if (powerRatio < 0.85) return '#f59e0b'; // Amber - high
    return '#ef4444'; // Red - very high
  };

  // Render on every frame update
  useEffect(() => {
    renderCanvas();
  }, [currentFrame]);

  if (store.transient.error) {
    return (
      <div className="advanced-sim-error">
        <p>❌ Error: {store.transient.error}</p>
      </div>
    );
  }

  if (store.transient.isLoading) {
    return (
      <div className="advanced-sim-loading">
        <div className="spinner" />
        <p>Loading transient analysis...</p>
      </div>
    );
  }

  const progress = (store.transient.currentFrameIndex / store.transient.frames.length) * 100;

  return (
    <div className="advanced-simulation">
      {/* Title */}
      <div className="sim-header">
        <h2>🔬 Advanced Transient Analysis</h2>
        <p className="sim-subtitle">Time-domain circuit response with RC charging curves</p>
      </div>

      {/* Canvas Visualization */}
      <div className="sim-canvas-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="sim-canvas"
        />
      </div>

      {/* Controls */}
      <div className="sim-controls">
        {/* Playback Controls */}
        <div className="playback-controls">
          <button
            onClick={() => store.prevFrame()}
            disabled={store.transient.currentFrameIndex === 0}
            className="control-btn prev-btn"
            title="Previous frame"
          >
            ⏮
          </button>

          <button
            onClick={() =>
              store.transient.isPlaying ? store.pauseTransient() : store.playTransient()
            }
            className="control-btn play-btn"
            title={store.transient.isPlaying ? 'Pause' : 'Play'}
          >
            {store.transient.isPlaying ? '⏸' : '▶'}
          </button>

          <button
            onClick={() => store.nextFrame()}
            disabled={store.transient.currentFrameIndex === store.transient.frames.length - 1}
            className="control-btn next-btn"
            title="Next frame"
          >
            ⏭
          </button>

          {/* Speed Control */}
          <div className="speed-control">
            <label>Speed:</label>
            <input
              type="range"
              min="0.25"
              max="4"
              step="0.25"
              value={store.transient.playbackSpeed}
              onChange={(e) => store.setPlaybackSpeed(parseFloat(e.target.value))}
              className="speed-slider"
            />
            <span className="speed-value">{store.transient.playbackSpeed.toFixed(2)}x</span>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="timeline-container">
          <input
            type="range"
            min="0"
            max={store.transient.frames.length - 1}
            value={store.transient.currentFrameIndex}
            onChange={(e) => store.setPlaybackFrame(parseInt(e.target.value))}
            className="timeline-slider"
          />
          <div className="timeline-progress" style={{ width: `${progress}%` }} />
        </div>

        {/* Time Display */}
        <div className="time-display">
          <span>
            {currentFrame?.timeMs || 0}ms / {store.transient.totalDuration}ms
          </span>
          <span className="frame-counter">
            Frame {store.transient.currentFrameIndex + 1} / {store.transient.frames.length}
          </span>
        </div>
      </div>

      {/* Component Data Table */}
      {currentFrame && (
        <div className="component-data">
          <h3>📊 Component States</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Voltage (V)</th>
                <th>Current (mA)</th>
                <th>Power (W)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentFrame.components.map((comp: any) => (
                <tr key={comp.componentId} className="component-row">
                  <td className="component-id">{comp.componentId}</td>
                  <td className="voltage">{comp.voltage.toFixed(3)}</td>
                  <td className="current">{comp.current.toFixed(3)}</td>
                  <td className="power">{comp.power.toFixed(3)}</td>
                  <td className={`status ${comp.status.toLowerCase()}`}>{comp.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Analysis Summary */}
      <div className="analysis-summary">
        <div className="summary-card">
          <h4>Peak Power</h4>
          <p className="summary-value">
            {Math.max(...store.transient.frames.map((f) => Math.max(...f.components.map((c: any) => c.power)))).toFixed(2)}W
          </p>
        </div>
        <div className="summary-card">
          <h4>Peak Voltage</h4>
          <p className="summary-value">
            {Math.max(...store.transient.frames.map((f) => Math.max(...f.components.map((c: any) => c.voltage)))).toFixed(2)}V
          </p>
        </div>
        <div className="summary-card">
          <h4>Peak Current</h4>
          <p className="summary-value">
            {Math.max(...store.transient.frames.map((f) => Math.max(...f.components.map((c: any) => c.current)))).toFixed(2)}mA
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSimulation;
