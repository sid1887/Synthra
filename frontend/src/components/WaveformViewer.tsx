import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Download } from 'lucide-react';
import Button from './ui/Button';

export interface WaveformSignal {
  id: string;
  name: string;
  values: number[];
  color: string;
  visible: boolean;
}

interface WaveformViewerProps {
  signals?: WaveformSignal[];
  timeRange?: { start: number; end: number };
  onSignalVisibilityChange?: (signalId: string, visible: boolean) => void;
  onExport?: (format: 'csv' | 'json' | 'png') => void;
}

const WaveformViewer: React.FC<WaveformViewerProps> = ({
  signals = [],
  timeRange = { start: 0, end: 100 },
  onSignalVisibilityChange,
  onExport,
}) => {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [cursor1, setCursor1] = useState(20);
  const [cursor2, setCursor2] = useState(80);

  const visibleSignals = signals.filter((s) => s.visible);
  const signalHeight = 60;
  const totalHeight = visibleSignals.length * signalHeight;

  return (
    <div className="waveform-viewer">
      {/* Toolbar */}
      <div className="waveform-toolbar">
        <div className="toolbar-group">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
          >
            <ZoomOut size={16} />
          </Button>
          <span className="zoom-text">{Math.round(zoom * 100)}%</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setZoom((prev) => Math.min(3, prev + 0.1))}
          >
            <ZoomIn size={16} />
          </Button>
        </div>

        <div className="toolbar-group">
          <Button
            size="sm"
            variant="ghost"
            icon={<Download size={16} />}
            onClick={() => onExport?.('csv')}
          >
            CSV
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onExport?.('png')}
          >
            PNG
          </Button>
        </div>
      </div>

      <div className="waveform-container">
        {/* Signal List */}
        <div className="waveform-signals">
          <div className="signals-header">Signals</div>
          {signals.map((signal) => (
            <div
              key={signal.id}
              className={`signal-item ${signal.visible ? 'visible' : 'hidden'}`}
              onClick={() =>
                onSignalVisibilityChange?.(signal.id, !signal.visible)
              }
            >
              <input
                type="checkbox"
                checked={signal.visible}
                onChange={(e) =>
                  onSignalVisibilityChange?.(signal.id, e.target.checked)
                }
              />
              <span
                className="signal-color"
                style={{ backgroundColor: signal.color }}
              />
              <span className="signal-name">{signal.name}</span>
            </div>
          ))}
        </div>

        {/* Waveform Canvas */}
        <div className="waveform-canvas-wrapper">
          <svg
            className="waveform-canvas"
            style={{
              transform: `scaleX(${zoom}) translateX(${panX}px)`,
              transformOrigin: '0 0',
              height: `${totalHeight}px`,
            }}
          >
            {/* Grid */}
            <defs>
              <pattern
                id="waveform-grid"
                width={100 / zoom}
                height={20}
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1={100 / zoom}
                  y1="0"
                  x2={100 / zoom}
                  y2="20"
                  stroke="var(--color-border)"
                  strokeWidth="0.5"
                />
                <line
                  x1="0"
                  y1="20"
                  x2={100 / zoom}
                  y2="20"
                  stroke="var(--color-border)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>

            <rect
              width="1000"
              height={totalHeight}
              fill="url(#waveform-grid)"
            />

            {/* Waveforms */}
            {visibleSignals.map((signal, idx) => (
              <g key={signal.id} transform={`translate(0, ${idx * signalHeight})`}>
                {/* Signal waveform line */}
                <polyline
                  points={signal.values
                    .map(
                      (val, i) =>
                        `${(i / signal.values.length) * 1000},${
                          30 - (val / 10) * 25
                        }`
                    )
                    .join(' ')}
                  fill="none"
                  stroke={signal.color}
                  strokeWidth="2"
                />

                {/* Signal label */}
                <text
                  x="5"
                  y="15"
                  fontSize="12"
                  fill="var(--color-text-secondary)"
                >
                  {signal.name}
                </text>
              </g>
            ))}

            {/* Cursor 1 */}
            <line
              x1={cursor1 * (1000 / (timeRange.end - timeRange.start))}
              y1="0"
              x2={cursor1 * (1000 / (timeRange.end - timeRange.start))}
              y2={totalHeight}
              stroke="var(--color-primary)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />

            {/* Cursor 2 */}
            <line
              x1={cursor2 * (1000 / (timeRange.end - timeRange.start))}
              y1="0"
              x2={cursor2 * (1000 / (timeRange.end - timeRange.start))}
              y2={totalHeight}
              stroke="var(--color-warning)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          </svg>
        </div>

        {/* Time Axis */}
        <div className="waveform-timeline">
          <div className="timeline-label">
            {timeRange.start} ms to {timeRange.end} ms
          </div>
        </div>

        {/* Measurements */}
        <div className="waveform-measurements">
          <div className="measurement-item">
            <span className="measurement-label">Cursor A:</span>
            <span className="measurement-value">{cursor1.toFixed(2)} ms</span>
          </div>
          <div className="measurement-item">
            <span className="measurement-label">Cursor B:</span>
            <span className="measurement-value">{cursor2.toFixed(2)} ms</span>
          </div>
          <div className="measurement-item">
            <span className="measurement-label">Δt:</span>
            <span className="measurement-value">
              {Math.abs(cursor2 - cursor1).toFixed(2)} ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveformViewer;
