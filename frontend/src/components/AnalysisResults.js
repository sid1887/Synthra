import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useState } from 'react';
import { exportAnalysis, downloadFile } from '../api';
export default function AnalysisResults({ result, preview }) {
    const canvasRef = useRef(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [exporting, setExporting] = useState(false);
    useEffect(() => {
        // Draw annotation overlay on canvas
        if (canvasRef.current && preview) {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                // Draw bounding boxes
                result.components.forEach((comp) => {
                    const { x, y, w, h } = comp.bbox;
                    // Color by confidence
                    let color = '#22c55e'; // green
                    if (comp.confidence < 0.65)
                        color = '#f59e0b'; // amber
                    if (comp.confidence < 0.5)
                        color = '#ef4444'; // red
                    // Draw box
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    // Draw label background
                    const label = `${comp.canonicalLabel} (${(comp.confidence * 100).toFixed(0)}%)`;
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y - 25, ctx.measureText(label).width + 6, 20);
                    // Draw label
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(label, x + 3, y - 8);
                });
            };
            img.src = preview;
        }
    }, [preview, result.components]);
    const handleExport = async (format) => {
        try {
            setExporting(true);
            const blob = await exportAnalysis(result.requestId, format);
            let filename = `analysis-${result.requestId}`;
            switch (format) {
                case 'json':
                    filename += '.json';
                    break;
                case 'txt':
                    filename += '.txt';
                    break;
                case 'md':
                    filename += '.md';
                    break;
                case 'html':
                    filename += '.html';
                    break;
                case 'csv':
                    filename = `components-${result.requestId}.csv`;
                    break;
            }
            downloadFile(blob, filename);
        }
        catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export. Please try again.');
        }
        finally {
            setExporting(false);
        }
    };
    const severityColor = (severity) => {
        switch (severity) {
            case 'error': return 'text-red-800 bg-red-100';
            case 'warning': return 'text-yellow-800 bg-yellow-100';
            default: return 'text-blue-800 bg-blue-100';
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg overflow-hidden", children: [_jsx("div", { className: "bg-gradient-to-r from-synthra-600 to-synthra-700 text-white p-6", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold mb-2", children: result.circuit.label.replace(/_/g, ' ').toUpperCase() }), _jsx("p", { className: "text-synthra-100", children: result.circuit.description })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-3xl font-bold", children: [(result.circuit.confidence * 100).toFixed(0), "%"] }), _jsx("div", { className: "text-sm text-synthra-100", children: "Confidence" }), _jsx("div", { className: "mt-2 text-2xl", children: result.circuit.complexity === 'simple' ? '🟢' : result.circuit.complexity === 'moderate' ? '🟡' : '🔴' }), _jsx("div", { className: "text-xs", children: result.circuit.complexity })] })] }) }), _jsx("div", { className: "bg-synthra-50 border-b border-synthra-200 px-6 py-3", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm font-semibold text-synthra-900", children: "Export Analysis" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => handleExport('json'), disabled: exporting, className: "px-3 py-1 text-xs font-medium bg-white text-synthra-600 border border-synthra-300 rounded hover:bg-synthra-50 disabled:opacity-50", children: "JSON" }), _jsx("button", { onClick: () => handleExport('txt'), disabled: exporting, className: "px-3 py-1 text-xs font-medium bg-white text-synthra-600 border border-synthra-300 rounded hover:bg-synthra-50 disabled:opacity-50", children: "TXT" }), _jsx("button", { onClick: () => handleExport('md'), disabled: exporting, className: "px-3 py-1 text-xs font-medium bg-white text-synthra-600 border border-synthra-300 rounded hover:bg-synthra-50 disabled:opacity-50", children: "Markdown" }), _jsx("button", { onClick: () => handleExport('html'), disabled: exporting, className: "px-3 py-1 text-xs font-medium bg-white text-synthra-600 border border-synthra-300 rounded hover:bg-synthra-50 disabled:opacity-50", children: "HTML" }), _jsx("button", { onClick: () => handleExport('csv'), disabled: exporting, className: "px-3 py-1 text-xs font-medium bg-white text-synthra-600 border border-synthra-300 rounded hover:bg-synthra-50 disabled:opacity-50", children: "CSV" }), exporting && _jsx("span", { className: "text-xs text-synthra-600 px-2", children: "Exporting..." })] })] }) }), _jsx("div", { className: "border-b flex", children: ['overview', 'components', 'simulation', 'reconstruction'].map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab), className: `flex-1 py-3 font-medium transition ${activeTab === tab
                        ? 'border-b-2 border-synthra-600 text-synthra-600'
                        : 'text-gray-600 hover:text-gray-800'}`, children: [tab === 'overview' && '📋 Overview', tab === 'components' && '🔧 Components', tab === 'simulation' && '⚡ Simulation', tab === 'reconstruction' && '📐 Schematic'] }, tab))) }), _jsxs("div", { className: "p-6", children: [activeTab === 'overview' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold text-lg mb-3", children: "Circuit Image (Annotated)" }), _jsx("canvas", { ref: canvasRef, className: "w-full rounded-lg border border-gray-200" }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Green: high confidence, Yellow: medium, Red: low" })] }), _jsxs("div", { className: "bg-blue-50 p-4 rounded-lg border border-blue-200", children: [_jsx("h4", { className: "font-bold text-synthra-700 mb-2", children: "Student Explanation" }), _jsx("p", { className: "text-gray-700", children: result.explanation.student })] }), result.warnings.length > 0 && (_jsxs("div", { children: [_jsx("h4", { className: "font-bold text-lg mb-3", children: "\u26A0\uFE0F Warnings & Issues" }), _jsx("div", { className: "space-y-2", children: result.warnings.map((warn, i) => (_jsxs("div", { className: `p-3 rounded-lg ${severityColor(warn.severity)}`, children: [_jsx("div", { className: "font-bold", children: warn.code }), _jsx("div", { className: "text-sm", children: warn.message }), _jsxs("div", { className: "text-xs mt-1", children: ["\u2705 ", warn.action] })] }, i))) })] })), result.suggestions.length > 0 && (_jsxs("div", { children: [_jsx("h4", { className: "font-bold text-lg mb-3", children: "\uD83D\uDCA1 Recommendations" }), _jsx("div", { className: "space-y-3", children: result.suggestions.map((sug) => (_jsxs("div", { className: "border-l-4 border-synthra-500 bg-synthra-50 p-3 rounded", children: [_jsx("div", { className: "font-bold text-synthra-700", children: sug.title }), _jsx("div", { className: "text-sm text-gray-700", children: sug.description }), _jsxs("div", { className: "text-xs text-synthra-600 mt-1", children: ["\uD83D\uDD27 ", sug.action] })] }, sug.id))) })] })), result.guidance.reasons.length > 0 && (_jsxs("div", { className: "bg-amber-50 p-4 rounded-lg border border-amber-200", children: [_jsx("h4", { className: "font-bold text-amber-900 mb-2", children: "\uD83D\uDCF8 Image Quality Notes" }), _jsx("ul", { className: "text-sm text-amber-800 space-y-1", children: result.guidance.reasons.map((reason, i) => (_jsxs("li", { children: ["\u2022 ", reason] }, i))) })] }))] })), activeTab === 'components' && (_jsxs("div", { children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: result.components.map((comp) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4 hover:shadow-lg transition", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsxs("div", { children: [_jsx("div", { className: "font-bold text-lg", children: comp.canonicalLabel.toUpperCase() }), comp.value && _jsx("div", { className: "text-sm text-gray-600", children: comp.value })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: `text-sm font-bold ${comp.confidence >= 0.85 ? 'text-green-600' :
                                                                comp.confidence >= 0.65 ? 'text-yellow-600' :
                                                                    'text-red-600'}`, children: [(comp.confidence * 100).toFixed(0), "%"] }), comp.role && _jsx("div", { className: "text-xs text-gray-500", children: comp.role })] })] }), _jsxs("div", { className: "text-xs text-gray-500 mb-2", children: ["\uD83C\uDFAF Position: ", comp.bbox.x, ", ", comp.bbox.y, " (w: ", comp.bbox.w, ", h: ", comp.bbox.h, ")"] }), _jsxs("div", { className: "flex gap-2 text-xs", children: [_jsx("span", { className: "bg-gray-100 px-2 py-1 rounded", children: comp.orientation }), comp.polarity !== 'na' && (_jsx("span", { className: "bg-gray-100 px-2 py-1 rounded", children: comp.polarity }))] })] }, comp.id))) }), _jsxs("div", { className: "mt-4 p-4 bg-gray-100 rounded text-sm text-gray-700", children: ["Total detected: ", _jsx("strong", { children: result.components.length }), " components"] })] })), activeTab === 'simulation' && (_jsx("div", { children: result.simulation ? (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "bg-green-50 p-4 rounded-lg border border-green-200", children: _jsxs("div", { className: "text-sm font-bold text-green-700", children: ["Power Supply: ", result.simulation.power_voltage, "V"] }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left", children: "Component" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Voltage (V)" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Current (mA)" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Power (mW)" }), _jsx("th", { className: "px-4 py-2 text-center", children: "Status" })] }) }), _jsx("tbody", { children: result.simulation.components.map((comp, i) => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2", children: result.components.find(c => c.id === comp.componentId)?.canonicalLabel }), _jsx("td", { className: "px-4 py-2 text-right", children: comp.voltage.toFixed(2) }), _jsx("td", { className: "px-4 py-2 text-right", children: comp.current.toFixed(2) }), _jsx("td", { className: "px-4 py-2 text-right", children: comp.power.toFixed(2) }), _jsxs("td", { className: "px-4 py-2 text-center", children: [comp.status === 'on' && '🟢', comp.status === 'off' && '⚫', comp.status === 'limited' && '🟡', comp.status === 'unknown' && '❓'] })] }, i))) })] }) }), result.simulation.warnings.length > 0 && (_jsxs("div", { className: "bg-yellow-50 p-4 rounded-lg border border-yellow-200", children: [_jsx("div", { className: "font-bold text-yellow-800 mb-2", children: "Simulation Notes" }), _jsx("ul", { className: "text-sm text-yellow-800 space-y-1", children: result.simulation.warnings.map((w, i) => (_jsxs("li", { children: ["\u2022 ", w] }, i))) })] })), _jsxs("div", { className: "text-xs text-gray-500 p-3 bg-gray-50 rounded", children: ["\uD83D\uDCA1 ", result.simulation.notes] })] })) : (_jsx("div", { className: "text-center py-8 text-gray-500", children: "Simulation not available for this circuit type" })) })), activeTab === 'reconstruction' && (_jsx("div", { children: result.reconstruction ? (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "bg-blue-50 p-4 rounded-lg border border-blue-200", children: _jsxs("div", { className: "text-sm", children: [_jsx("strong", { className: "text-synthra-700", children: "Nodes:" }), " ", result.reconstruction.nodes.length, " |", _jsx("strong", { className: "text-synthra-700 ml-3", children: "Edges:" }), " ", result.reconstruction.edges.length, " |", _jsx("strong", { className: "text-synthra-700 ml-3", children: "Confidence:" }), " ", (result.reconstruction.confidence * 100).toFixed(0), "%"] }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-bold mb-3", children: "Network Nodes" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: result.reconstruction.nodes.map((node) => (_jsxs("div", { className: "p-3 bg-gray-50 rounded border border-gray-200", children: [_jsx("div", { className: "font-bold", children: node.label.toUpperCase() }), _jsxs("div", { className: "text-xs text-gray-600 mt-1", children: ["Type: ", node.type] }), node.componentId && (_jsxs("div", { className: "text-xs text-gray-600", children: ["ID: ", node.componentId] }))] }, node.id))) })] }), result.reconstruction.netlist && (_jsxs("div", { children: [_jsx("h4", { className: "font-bold mb-2", children: "Netlist" }), _jsx("pre", { className: "bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs italic", children: result.reconstruction.netlist })] }))] })) : (_jsx("div", { className: "text-center py-8 text-gray-500", children: "Reconstruction data not available" })) }))] }), _jsx("div", { className: "bg-gray-50 px-6 py-3 text-xs text-gray-600 border-t", children: _jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { children: ["Request ID: ", _jsx("code", { className: "bg-white px-2 py-1 rounded", children: result.requestId })] }), _jsxs("span", { children: ["Processed in ", result.processingTimeMs, "ms"] }), _jsx("span", { children: new Date(result.timestamp).toLocaleString() })] }) })] }));
}
