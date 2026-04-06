import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * Advanced Simulation Component (C1)
 * High-quality transient analysis visualization with smooth animations
 * Includes timeline player, real-time graphs, and component inspection
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { usePhaseCStore } from '../store/phaseC.store';
import './AdvancedSimulation.css';
/**
 * High-performance component for transient analysis visualization
 */
export const AdvancedSimulation = ({ analysisId }) => {
    const store = usePhaseCStore();
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);
    // Current frame data
    const currentFrame = useMemo(() => store.transient.frames[store.transient.currentFrameIndex], [store.transient.frames, store.transient.currentFrameIndex]);
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
                if (!response.ok)
                    throw new Error('Failed to fetch transient analysis');
                const data = await response.json();
                store.setTransientFrames(data.frames, 1000, 5);
                setIsInitialized(true);
            }
            catch (error) {
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
        if (!store.transient.isPlaying || !currentFrame)
            return;
        const animate = () => {
            const nextIndex = store.transient.currentFrameIndex + 1;
            if (nextIndex < store.transient.frames.length) {
                store.setPlaybackFrame(nextIndex);
                animationFrameRef.current = requestAnimationFrame(animate);
            }
            else {
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
        if (!canvasRef.current || !currentFrame)
            return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx)
            return;
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
    const renderGridBackground = (ctx, width, height, gridSize = 40) => {
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
    const renderComponentStates = (ctx, frame, width, height) => {
        const components = frame.components;
        const componentWidth = Math.floor((width - 60) / components.length);
        const padding = 30;
        const maxPower = 100; // Normalization for visualization
        components.forEach((comp, index) => {
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
    const getComponentColor = (component, maxPower) => {
        const powerRatio = component.power / maxPower;
        if (component.status === 'off')
            return '#475569';
        if (powerRatio < 0.3)
            return '#3b82f6'; // Blue - low
        if (powerRatio < 0.6)
            return '#10b981'; // Green - medium
        if (powerRatio < 0.85)
            return '#f59e0b'; // Amber - high
        return '#ef4444'; // Red - very high
    };
    // Render on every frame update
    useEffect(() => {
        renderCanvas();
    }, [currentFrame]);
    if (store.transient.error) {
        return (_jsx("div", { className: "advanced-sim-error", children: _jsxs("p", { children: ["\u274C Error: ", store.transient.error] }) }));
    }
    if (store.transient.isLoading) {
        return (_jsxs("div", { className: "advanced-sim-loading", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading transient analysis..." })] }));
    }
    const progress = (store.transient.currentFrameIndex / store.transient.frames.length) * 100;
    return (_jsxs("div", { className: "advanced-simulation", children: [_jsxs("div", { className: "sim-header", children: [_jsx("h2", { children: "\uD83D\uDD2C Advanced Transient Analysis" }), _jsx("p", { className: "sim-subtitle", children: "Time-domain circuit response with RC charging curves" })] }), _jsx("div", { className: "sim-canvas-container", children: _jsx("canvas", { ref: canvasRef, width: 800, height: 400, className: "sim-canvas" }) }), _jsxs("div", { className: "sim-controls", children: [_jsxs("div", { className: "playback-controls", children: [_jsx("button", { onClick: () => store.prevFrame(), disabled: store.transient.currentFrameIndex === 0, className: "control-btn prev-btn", title: "Previous frame", children: "\u23EE" }), _jsx("button", { onClick: () => store.transient.isPlaying ? store.pauseTransient() : store.playTransient(), className: "control-btn play-btn", title: store.transient.isPlaying ? 'Pause' : 'Play', children: store.transient.isPlaying ? '⏸' : '▶' }), _jsx("button", { onClick: () => store.nextFrame(), disabled: store.transient.currentFrameIndex === store.transient.frames.length - 1, className: "control-btn next-btn", title: "Next frame", children: "\u23ED" }), _jsxs("div", { className: "speed-control", children: [_jsx("label", { children: "Speed:" }), _jsx("input", { type: "range", min: "0.25", max: "4", step: "0.25", value: store.transient.playbackSpeed, onChange: (e) => store.setPlaybackSpeed(parseFloat(e.target.value)), className: "speed-slider" }), _jsxs("span", { className: "speed-value", children: [store.transient.playbackSpeed.toFixed(2), "x"] })] })] }), _jsxs("div", { className: "timeline-container", children: [_jsx("input", { type: "range", min: "0", max: store.transient.frames.length - 1, value: store.transient.currentFrameIndex, onChange: (e) => store.setPlaybackFrame(parseInt(e.target.value)), className: "timeline-slider" }), _jsx("div", { className: "timeline-progress", style: { width: `${progress}%` } })] }), _jsxs("div", { className: "time-display", children: [_jsxs("span", { children: [currentFrame?.timeMs || 0, "ms / ", store.transient.totalDuration, "ms"] }), _jsxs("span", { className: "frame-counter", children: ["Frame ", store.transient.currentFrameIndex + 1, " / ", store.transient.frames.length] })] })] }), currentFrame && (_jsxs("div", { className: "component-data", children: [_jsx("h3", { children: "\uD83D\uDCCA Component States" }), _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Component" }), _jsx("th", { children: "Voltage (V)" }), _jsx("th", { children: "Current (mA)" }), _jsx("th", { children: "Power (W)" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: currentFrame.components.map((comp) => (_jsxs("tr", { className: "component-row", children: [_jsx("td", { className: "component-id", children: comp.componentId }), _jsx("td", { className: "voltage", children: comp.voltage.toFixed(3) }), _jsx("td", { className: "current", children: comp.current.toFixed(3) }), _jsx("td", { className: "power", children: comp.power.toFixed(3) }), _jsx("td", { className: `status ${comp.status.toLowerCase()}`, children: comp.status })] }, comp.componentId))) })] })] })), _jsxs("div", { className: "analysis-summary", children: [_jsxs("div", { className: "summary-card", children: [_jsx("h4", { children: "Peak Power" }), _jsxs("p", { className: "summary-value", children: [Math.max(...store.transient.frames.map((f) => Math.max(...f.components.map((c) => c.power)))).toFixed(2), "W"] })] }), _jsxs("div", { className: "summary-card", children: [_jsx("h4", { children: "Peak Voltage" }), _jsxs("p", { className: "summary-value", children: [Math.max(...store.transient.frames.map((f) => Math.max(...f.components.map((c) => c.voltage)))).toFixed(2), "V"] })] }), _jsxs("div", { className: "summary-card", children: [_jsx("h4", { children: "Peak Current" }), _jsxs("p", { className: "summary-value", children: [Math.max(...store.transient.frames.map((f) => Math.max(...f.components.map((c) => c.current)))).toFixed(2), "mA"] })] })] })] }));
};
export default AdvancedSimulation;
