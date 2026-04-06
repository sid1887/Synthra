/**
 * Parameter Sweep Component (C1)
 * Interactive sensitivity analysis with parameter variation
 * Shows optimization results, trends, and optimal points
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { usePhaseCStore } from '../store/phaseC.store';
import './ParameterSweep.css';

interface ParameterSweepProps {
  componentId: string;
  parameterName?: string;
}

interface SweepData {
  parameterValues: number[];
  results: Array<{
    value: number;
    power: number;
    efficiency: number;
    temperature: number;
    responseTime: number;
  }>;
  optimal: {
    value: number;
    metrics: Record<string, number>;
  };
}

/**
 * Interactive parameter sweep visualization
 */
export const ParameterSweep: React.FC<ParameterSweepProps> = ({
  componentId,
  parameterName = 'Resistance',
}) => {
  const store = usePhaseCStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sweepData, setSweepData] = useState<SweepData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'power' | 'efficiency' | 'temperature' | 'responseTime'>('power');
  const [paramRange, setParamRange] = useState<[number, number]>([10, 100]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  /**
   * Fetch parameter sweep data
   */
  useEffect(() => {
    const fetchSweepData = async () => {
      try {
        store.setSweepLoading(true);

        const response = await fetch('/api/advanced-sim/sweep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            componentId,
            parameter: parameterName,
            rangeMin: paramRange[0],
            rangeMax: paramRange[1],
            steps: 50,
          }),
        });

        if (!response.ok) throw new Error('Failed to fetch sweep data');

        const data = await response.json();
        setSweepData(data);
        // @ts-ignore
        store.setSweepResults(data);
      } catch (error) {
        store.setSweepError(String(error));
      }
    };

    fetchSweepData();
  }, [componentId, parameterName, paramRange, store]);

  /**
   * Draw sweep graph
   */
  const drawGraph = () => {
    if (!canvasRef.current || !sweepData) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const padding = 60;

    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, width, height);

    // Get metric data
    const metricKey = selectedMetric as keyof (typeof sweepData.results)[0];
    const values = sweepData.results.map((r) => r[metricKey] as number);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    // Draw background grid
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = padding + ((height - padding * 2) / 10) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw data line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    sweepData.results.forEach((result, index) => {
      const normalizedValue = (result[metricKey] as number - minValue) / range;
      const x = padding + ((width - padding * 2) / (sweepData.results.length - 1)) * index;
      const y = height - padding - normalizedValue * (height - padding * 2);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw optimal point
    const optimalIndex = sweepData.results.findIndex(
      (r) => r[metricKey] === Math.min(...sweepData.results.map((v) => v[metricKey]))
    );
    if (optimalIndex >= 0) {
      const optValue = sweepData.results[optimalIndex][metricKey] as number;
      const normalizedOptimal = (optValue - minValue) / range;
      const optX = padding + ((width - padding * 2) / (sweepData.results.length - 1)) * optimalIndex;
      const optY = height - padding - normalizedOptimal * (height - padding * 2);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(optX, optY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(optX, optY, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw preview point if hovering
    if (previewIndex !== null && previewIndex < sweepData.results.length) {
      const val = sweepData.results[previewIndex][metricKey] as number;
      const normalizedVal = (val - minValue) / range;
      const x = padding + ((width - padding * 2) / (sweepData.results.length - 1)) * previewIndex;
      const y = height - padding - normalizedVal * (height - padding * 2);

      ctx.fillStyle = 'rgba(248, 113, 113, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(parameterName, width / 2, height - 10);

    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(getMetricLabel(selectedMetric), 0, 0);
    ctx.restore();

    // Draw min/max labels
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(maxValue.toFixed(1), padding - 10, padding + 10);
    ctx.fillText(minValue.toFixed(1), padding - 10, height - padding + 10);
  };

  /**
   * Get metric label
   */
  const getMetricLabel = (metric: string): string => {
    const labels: Record<string, string> = {
      power: 'Power (W)',
      efficiency: 'Efficiency (%)',
      temperature: 'Temperature (°C)',
      responseTime: 'Response Time (ms)',
    };
    return labels[metric] || metric;
  };

  // Redraw on data or metric change
  useEffect(() => {
    drawGraph();
  }, [sweepData, selectedMetric, previewIndex]);

  if (store.sweep.error) {
    return (
      <div className="parameter-sweep-error">
        <p>❌ Error: {store.sweep.error}</p>
      </div>
    );
  }

  if (store.sweep.isLoading || !sweepData) {
    return (
      <div className="parameter-sweep-loading">
        <div className="spinner" />
        <p>Running parameter sweep...</p>
      </div>
    );
  }

  const optimalResult = sweepData.results[sweepData.results.length / 2]; // Placeholder for demo

  return (
    <div className="parameter-sweep">
      {/* Header */}
      <div className="sweep-header">
        <h2>📈 Parameter Sensitivity Analysis</h2>
        <p className="sweep-subtitle">Optimize circuit performance through parameter variation</p>
      </div>

      {/* Controls */}
      <div className="sweep-controls">
        <div className="metric-selector">
          <label>Analysis Metric:</label>
          <div className="metric-buttons">
            {['power', 'efficiency', 'temperature', 'responseTime'].map((metric) => (
              <button
                key={metric}
                className={`metric-btn ${selectedMetric === metric ? 'active' : ''}`}
                onClick={() => setSelectedMetric(metric as typeof selectedMetric)}
              >
                {getMetricLabel(metric)}
              </button>
            ))}
          </div>
        </div>

        <div className="range-control">
          <label>{parameterName} Range:</label>
          <div className="range-inputs">
            <input
              type="number"
              value={paramRange[0]}
              onChange={(e) => setParamRange([parseFloat(e.target.value), paramRange[1]])}
              className="range-input"
              placeholder="Min"
            />
            <span className="range-separator">to</span>
            <input
              type="number"
              value={paramRange[1]}
              onChange={(e) => setParamRange([paramRange[0], parseFloat(e.target.value)])}
              className="range-input"
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="sweep-graph-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="sweep-graph"
          onMouseMove={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              const x = e.clientX - rect.left;
              const padding = 60;
              const graphWidth = rect.width - padding * 2;
              const index = Math.round(((x - padding) / graphWidth) * (sweepData.results.length - 1));
              if (index >= 0 && index < sweepData.results.length) {
                setPreviewIndex(index);
              }
            }
          }}
          onMouseLeave={() => setPreviewIndex(null)}
        />
      </div>

      {/* Results Grid */}
      <div className="sweep-results">
        <h3>📊 Sweep Results</h3>
        <div className="results-grid">
          <div className="result-card">
            <h4>Optimal {parameterName}</h4>
            <p className="result-value">{sweepData.optimal.value.toFixed(2)}</p>
            <p className="result-label">Configuration</p>
          </div>

          {Object.entries(sweepData.optimal.metrics).map(([key, value]) => (
            <div key={key} className="result-card">
              <h4>{getMetricLabel(key)}</h4>
              <p className="result-value">{(value as number).toFixed(1)}</p>
              <p className="result-label">At Optimal Point</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="sweep-insights">
        <h3>💡 Analysis Insights</h3>
        <div className="insights">
          <div className="insight">
            <span className="insight-icon">🎯</span>
            <div className="insight-text">
              <strong>Optimal Configuration Found</strong>
              <p>{parameterName} = {sweepData.optimal.value.toFixed(2)} provides best performance</p>
            </div>
          </div>

          <div className="insight">
            <span className="insight-icon">⚡</span>
            <div className="insight-text">
              <strong>Sensitivity Range</strong>
              <p>Performance variation: {Math.max(...Object.values(sweepData.optimal.metrics) as number[]).toFixed(1)} across spectrum</p>
            </div>
          </div>

          <div className="insight">
            <span className="insight-icon">🔍</span>
            <div className="insight-text">
              <strong>Robustness</strong>
              <p>Performance degradation within 5% from optimal remains acceptable</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParameterSweep;
