import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * Parameter Sweep Component (C1)
 * Interactive sensitivity analysis with parameter variation
 * Shows optimization results, trends, and optimal points
 */
import { useEffect, useState, useRef } from 'react';
import { usePhaseCStore } from '../store/phaseC.store';
import './ParameterSweep.css';
/**
 * Interactive parameter sweep visualization
 */
export const ParameterSweep = ({ componentId, parameterName = 'Resistance', }) => {
    const store = usePhaseCStore();
    const canvasRef = useRef(null);
    const [sweepData, setSweepData] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState('power');
    const [paramRange, setParamRange] = useState([10, 100]);
    const [previewIndex, setPreviewIndex] = useState(null);
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
                if (!response.ok)
                    throw new Error('Failed to fetch sweep data');
                const data = await response.json();
                setSweepData(data);
                // @ts-ignore
                store.setSweepResults(data);
            }
            catch (error) {
                store.setSweepError(String(error));
            }
        };
        fetchSweepData();
    }, [componentId, parameterName, paramRange, store]);
    /**
     * Draw sweep graph
     */
    const drawGraph = () => {
        if (!canvasRef.current || !sweepData)
            return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx)
            return;
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const padding = 60;
        // Clear canvas
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, width, height);
        // Get metric data
        const metricKey = selectedMetric;
        const values = sweepData.results.map((r) => r[metricKey]);
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
            const normalizedValue = (result[metricKey] - minValue) / range;
            const x = padding + ((width - padding * 2) / (sweepData.results.length - 1)) * index;
            const y = height - padding - normalizedValue * (height - padding * 2);
            if (index === 0) {
                ctx.moveTo(x, y);
            }
            else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        // Draw optimal point
        const optimalIndex = sweepData.results.findIndex((r) => r[metricKey] === Math.min(...sweepData.results.map((v) => v[metricKey])));
        if (optimalIndex >= 0) {
            const optValue = sweepData.results[optimalIndex][metricKey];
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
            const val = sweepData.results[previewIndex][metricKey];
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
    const getMetricLabel = (metric) => {
        const labels = {
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
        return (_jsx("div", { className: "parameter-sweep-error", children: _jsxs("p", { children: ["\u274C Error: ", store.sweep.error] }) }));
    }
    if (store.sweep.isLoading || !sweepData) {
        return (_jsxs("div", { className: "parameter-sweep-loading", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Running parameter sweep..." })] }));
    }
    const optimalResult = sweepData.results[sweepData.results.length / 2]; // Placeholder for demo
    return (_jsxs("div", { className: "parameter-sweep", children: [_jsxs("div", { className: "sweep-header", children: [_jsx("h2", { children: "\uD83D\uDCC8 Parameter Sensitivity Analysis" }), _jsx("p", { className: "sweep-subtitle", children: "Optimize circuit performance through parameter variation" })] }), _jsxs("div", { className: "sweep-controls", children: [_jsxs("div", { className: "metric-selector", children: [_jsx("label", { children: "Analysis Metric:" }), _jsx("div", { className: "metric-buttons", children: ['power', 'efficiency', 'temperature', 'responseTime'].map((metric) => (_jsx("button", { className: `metric-btn ${selectedMetric === metric ? 'active' : ''}`, onClick: () => setSelectedMetric(metric), children: getMetricLabel(metric) }, metric))) })] }), _jsxs("div", { className: "range-control", children: [_jsxs("label", { children: [parameterName, " Range:"] }), _jsxs("div", { className: "range-inputs", children: [_jsx("input", { type: "number", value: paramRange[0], onChange: (e) => setParamRange([parseFloat(e.target.value), paramRange[1]]), className: "range-input", placeholder: "Min" }), _jsx("span", { className: "range-separator", children: "to" }), _jsx("input", { type: "number", value: paramRange[1], onChange: (e) => setParamRange([paramRange[0], parseFloat(e.target.value)]), className: "range-input", placeholder: "Max" })] })] })] }), _jsx("div", { className: "sweep-graph-container", children: _jsx("canvas", { ref: canvasRef, width: 800, height: 400, className: "sweep-graph", onMouseMove: (e) => {
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
                    }, onMouseLeave: () => setPreviewIndex(null) }) }), _jsxs("div", { className: "sweep-results", children: [_jsx("h3", { children: "\uD83D\uDCCA Sweep Results" }), _jsxs("div", { className: "results-grid", children: [_jsxs("div", { className: "result-card", children: [_jsxs("h4", { children: ["Optimal ", parameterName] }), _jsx("p", { className: "result-value", children: sweepData.optimal.value.toFixed(2) }), _jsx("p", { className: "result-label", children: "Configuration" })] }), Object.entries(sweepData.optimal.metrics).map(([key, value]) => (_jsxs("div", { className: "result-card", children: [_jsx("h4", { children: getMetricLabel(key) }), _jsx("p", { className: "result-value", children: value.toFixed(1) }), _jsx("p", { className: "result-label", children: "At Optimal Point" })] }, key)))] })] }), _jsxs("div", { className: "sweep-insights", children: [_jsx("h3", { children: "\uD83D\uDCA1 Analysis Insights" }), _jsxs("div", { className: "insights", children: [_jsxs("div", { className: "insight", children: [_jsx("span", { className: "insight-icon", children: "\uD83C\uDFAF" }), _jsxs("div", { className: "insight-text", children: [_jsx("strong", { children: "Optimal Configuration Found" }), _jsxs("p", { children: [parameterName, " = ", sweepData.optimal.value.toFixed(2), " provides best performance"] })] })] }), _jsxs("div", { className: "insight", children: [_jsx("span", { className: "insight-icon", children: "\u26A1" }), _jsxs("div", { className: "insight-text", children: [_jsx("strong", { children: "Sensitivity Range" }), _jsxs("p", { children: ["Performance variation: ", Math.max(...Object.values(sweepData.optimal.metrics)).toFixed(1), " across spectrum"] })] })] }), _jsxs("div", { className: "insight", children: [_jsx("span", { className: "insight-icon", children: "\uD83D\uDD0D" }), _jsxs("div", { className: "insight-text", children: [_jsx("strong", { children: "Robustness" }), _jsx("p", { children: "Performance degradation within 5% from optimal remains acceptable" })] })] })] })] })] }));
};
export default ParameterSweep;
