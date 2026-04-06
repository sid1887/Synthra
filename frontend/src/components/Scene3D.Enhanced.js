import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Scene3D Component - Enhanced with Three.js 3D Rendering
 * Visualizes circuit components in 3D space with interactive controls
 */
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment } from '@react-three/drei';
import { usePhaseCStore } from '../store/phaseC.store';
import './Scene3D.css';
/**
 * Resistor Component - 3D cylindrical shape
 */
const Resistor = ({ pos, color, label }) => {
    const meshRef = useRef(null);
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
        }
    });
    return (_jsxs("group", { position: pos, children: [_jsxs("mesh", { ref: meshRef, children: [_jsx("cylinderGeometry", { args: [0.3, 0.3, 1.5, 16] }), _jsx("meshStandardMaterial", { color: color, metalness: 0.6, roughness: 0.4 })] }), _jsx("text", { position: [0, 1.2, 0], fontSize: 0.4, anchorX: "center", anchorY: "bottom", color: "white", children: label })] }));
};
/**
 * Capacitor Component - 3D plate shape
 */
const Capacitor = ({ pos, color, label }) => {
    const meshRef = useRef(null);
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.z += 0.003;
        }
    });
    return (_jsxs("group", { position: pos, children: [_jsxs("mesh", { ref: meshRef, position: [-0.4, 0, 0], children: [_jsx("boxGeometry", { args: [0.2, 1, 0.8] }), _jsx("meshStandardMaterial", { color: color, metalness: 0.7, roughness: 0.3 })] }), _jsxs("mesh", { position: [0.4, 0, 0], children: [_jsx("boxGeometry", { args: [0.2, 1, 0.8] }), _jsx("meshStandardMaterial", { color: color, metalness: 0.7, roughness: 0.3 })] }), _jsx("text", { position: [0, 1.2, 0], fontSize: 0.4, anchorX: "center", anchorY: "bottom", color: "white", children: label })] }));
};
/**
 * Inductor Component - 3D coil shape
 */
const Inductor = ({ pos, color, label }) => {
    const meshRef = useRef(null);
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.008;
        }
    });
    return (_jsxs("group", { ref: meshRef, position: pos, children: [[0, 1, 2, 3].map((i) => (_jsxs("mesh", { position: [0, i * 0.3, 0], children: [_jsx("torusGeometry", { args: [0.4, 0.1, 8, 16] }), _jsx("meshStandardMaterial", { color: color, metalness: 0.5, roughness: 0.5 })] }, i))), _jsx("text", { position: [0, 1.5, 0], fontSize: 0.4, anchorX: "center", anchorY: "bottom", color: "white", children: label })] }));
};
/**
 * Power Source Component - 3D sphere
 */
const PowerSource = ({ pos, color, label }) => {
    const meshRef = useRef(null);
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
        }
    });
    return (_jsxs("group", { position: pos, children: [_jsxs("mesh", { ref: meshRef, children: [_jsx("icosahedronGeometry", { args: [0.6, 4] }), _jsx("meshStandardMaterial", { color: color, metalness: 0.8, roughness: 0.2, wireframe: false, emissive: color, emissiveIntensity: 0.3 })] }), _jsx("pointLight", { position: [0, 0, 0], intensity: 0.8, color: color }), _jsx("text", { position: [0, 1.1, 0], fontSize: 0.4, anchorX: "center", anchorY: "bottom", color: "white", children: label })] }));
};
/**
 * Connection Wire - 3D line between components
 */
const Wire = ({ start, end, color }) => {
    const lineRef = useRef(null);
    return (_jsxs("line", { children: [_jsx("bufferGeometry", { ref: lineRef, children: _jsx("bufferAttribute", { attach: "attributes-position", count: 2, array: new Float32Array([...start, ...end]), itemSize: 3 }) }), _jsx("lineBasicMaterial", { color: color, linewidth: 2 })] }));
};
const Scene3DContent = ({ mode, components }) => {
    const meshRef = useRef(null);
    // Color mapping by mode
    const getModeColor = (index) => {
        const colors = {
            power: ['#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#0066ff'],
            temperature: ['#0066ff', '#00ccff', '#00ff66', '#ffff00', '#ff0000'],
            confidence: ['#666666', '#999999', '#cccccc', '#ffffff', '#ff00ff'],
            flow: ['#00ff00', '#00ffff', '#0099ff', '#0066ff', '#003366'],
        };
        return colors[mode][index % 5];
    };
    return (_jsxs(_Fragment, { children: [_jsx("ambientLight", { intensity: 0.8 }), _jsx("directionalLight", { position: [10, 10, 5], intensity: 1, castShadow: true }), _jsx("pointLight", { position: [-10, 10, 10], intensity: 0.5, color: "#0066ff" }), _jsx(Environment, { preset: "city", intensity: 0.5 }), _jsx(Grid, { args: [10, 10], cellSize: 0.5, cellColor: "#444", sectionSize: 2, sectionColor: "#888", fadeDistance: 40, fadeStrength: 1 }), _jsx("group", { ref: meshRef, children: components.map((comp, idx) => {
                    const color = getModeColor(idx);
                    switch (comp.type) {
                        case 'resistor':
                            return _jsx(Resistor, { pos: comp.position, color: color, label: comp.label }, comp.id);
                        case 'capacitor':
                            return _jsx(Capacitor, { pos: comp.position, color: color, label: comp.label }, comp.id);
                        case 'inductor':
                            return _jsx(Inductor, { pos: comp.position, color: color, label: comp.label }, comp.id);
                        case 'power':
                            return _jsx(PowerSource, { pos: comp.position, color: color, label: comp.label }, comp.id);
                        default:
                            return null;
                    }
                }) }), components.length > 1 &&
                components.slice(0, -1).map((comp, idx) => (_jsx(Wire, { start: comp.position, end: components[idx + 1].position, color: getModeColor(idx) }, `wire-${idx}`)))] }));
};
export const Scene3D = ({ analysisId }) => {
    const [mode, setMode] = useState('power');
    // @ts-ignore
    const { loadScene3DVisualization } = usePhaseCStore();
    // Mock components for demo (replace with real API data)
    const components = [
        { id: 'v1', type: 'power', position: [-4, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#ff0000', label: 'V1' },
        { id: 'r1', type: 'resistor', position: [-2, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#ff6600', label: 'R1' },
        { id: 'c1', type: 'capacitor', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#ffcc00', label: 'C1' },
        { id: 'l1', type: 'inductor', position: [2, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#00ff00', label: 'L1' },
        { id: 'r2', type: 'resistor', position: [4, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#0066ff', label: 'R2' },
    ];
    return (_jsxs("div", { className: "scene3d-container", children: [_jsxs("div", { className: "scene3d-header", children: [_jsx("h2", { children: "3D Circuit Visualization" }), _jsx("div", { className: "scene3d-controls", children: _jsxs("select", { value: mode, onChange: (e) => setMode(e.target.value), className: "mode-selector", children: [_jsx("option", { value: "power", children: "Power Distribution" }), _jsx("option", { value: "temperature", children: "Temperature Map" }), _jsx("option", { value: "confidence", children: "Confidence Level" }), _jsx("option", { value: "flow", children: "Signal Flow" })] }) })] }), _jsx("div", { className: "canvas-container", children: _jsxs(Canvas, { children: [_jsx(PerspectiveCamera, { makeDefault: true, position: [0, 8, 12], fov: 50 }), _jsx(Scene3DContent, { mode: mode, components: components }), _jsx(OrbitControls, { enableDamping: true, dampingFactor: 0.05, minDistance: 5, maxDistance: 50 })] }) }), _jsxs("div", { className: "scene3d-stats", children: [_jsxs("div", { className: "stat", children: [_jsx("span", { className: "label", children: "Components:" }), _jsx("span", { className: "value", children: components.length })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { className: "label", children: "Connections:" }), _jsx("span", { className: "value", children: components.length - 1 })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { className: "label", children: "Visualization Mode:" }), _jsx("span", { className: "value", children: mode })] })] }), _jsxs("div", { className: "scene3d-legend", children: [_jsx("h3", { children: "Legend" }), _jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "legend-icon", style: { backgroundColor: '#ff0000' } }), _jsx("span", { children: "Power Source" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "legend-icon", style: { backgroundColor: '#ff6600' } }), _jsx("span", { children: "Resistor" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "legend-icon", style: { backgroundColor: '#ffcc00' } }), _jsx("span", { children: "Capacitor" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "legend-icon", style: { backgroundColor: '#00ff00' } }), _jsx("span", { children: "Inductor" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "legend-icon", style: { backgroundColor: '#0066ff' } }), _jsx("span", { children: "Component" })] })] }), _jsx("div", { className: "scene3d-instructions", children: _jsxs("p", { children: [_jsx("strong", { children: "Controls:" }), " Left-click drag to rotate \u2022 Scroll to zoom \u2022 Right-click drag to pan"] }) })] }));
};
export default Scene3D;
