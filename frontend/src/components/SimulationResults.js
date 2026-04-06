import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Simulation Results Component
 * Displays SPICE simulation results (DC, transient, AC analysis)
 */
import { useState, useEffect } from 'react';
import { usePhaseCStore } from '../store/phaseC.store';
export const SimulationResults = ({ data, circuitName = 'Circuit' }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [sortBy, setSortBy] = useState('name');
    // @ts-ignore
    const store = usePhaseCStore();
    useEffect(() => {
        // Store results in global state if needed
        if (data.success) {
            // @ts-ignore
            store.addSimulationResult?.({
                id: Date.now().toString(),
                circuitName,
                data,
            });
        }
    }, [data]);
    const formatValue = (value, unit = '') => {
        const abs = Math.abs(value);
        if (abs >= 1000000)
            return `${(value / 1000000).toFixed(3)}M${unit}`;
        if (abs >= 1000)
            return `${(value / 1000).toFixed(3)}k${unit}`;
        if (abs < 0.001)
            return `${(value * 1000000).toFixed(3)}µ${unit}`;
        if (abs < 0.01)
            return `${(value * 1000).toFixed(3)}m${unit}`;
        return `${value.toFixed(4)}${unit}`;
    };
    const getVoltageColor = (voltage) => {
        const abs = Math.abs(voltage);
        if (abs > 100)
            return 'text-red-600';
        if (abs > 50)
            return 'text-orange-600';
        if (abs > 10)
            return 'text-yellow-600';
        return 'text-green-600';
    };
    const getCurrentColor = (current) => {
        const abs = Math.abs(current);
        if (abs > 1)
            return 'text-red-600';
        if (abs > 0.1)
            return 'text-orange-600';
        if (abs > 0.01)
            return 'text-yellow-600';
        return 'text-blue-600';
    };
    const getPowerColor = (power) => {
        if (power > 100)
            return 'text-red-600';
        if (power > 10)
            return 'text-orange-600';
        if (power > 1)
            return 'text-yellow-600';
        return 'text-green-600';
    };
    const sortedVoltages = Object.entries(data.nodeVoltages || {})
        .sort(([a], [b]) => (sortBy === 'name' ? a.localeCompare(b) : 0))
        .sort(([, a], [, b]) => (sortBy === 'value' ? Math.abs(b) - Math.abs(a) : 0));
    const sortedCurrents = Object.entries(data.componentCurrents || {})
        .sort(([a], [b]) => (sortBy === 'name' ? a.localeCompare(b) : 0))
        .sort(([, a], [, b]) => (sortBy === 'value' ? Math.abs(b) - Math.abs(a) : 0));
    const sortedPower = Object.entries(data.powerDissipation || {})
        .sort(([a], [b]) => (sortBy === 'name' ? a.localeCompare(b) : 0))
        .sort(([, a], [, b]) => (sortBy === 'value' ? b - a : 0));
    const totalPower = Object.values(data.powerDissipation || {}).reduce((a, b) => a + b, 0);
    return (_jsxs("div", { className: "w-full bg-white rounded-lg shadow-lg overflow-hidden", children: [_jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "\u26A1 Simulation Results" }), _jsxs("p", { className: "text-blue-100", children: [circuitName, " - ", data.type.toUpperCase(), " Analysis", !data.success && _jsx("span", { className: "ml-2 text-red-300 font-semibold", children: "\u274C FAILED" }), data.success && _jsx("span", { className: "ml-2 text-green-300 font-semibold", children: "\u2705 SUCCESS" })] })] }), data.errors.length > 0 && (_jsx("div", { className: "p-4 bg-red-50 border-l-4 border-red-500", children: data.errors.map((err, i) => (_jsxs("p", { className: "text-red-700 text-sm mb-1", children: ["\u274C ", err] }, i))) })), data.warnings.length > 0 && (_jsx("div", { className: "p-4 bg-yellow-50 border-l-4 border-yellow-500", children: data.warnings.map((warn, i) => (_jsxs("p", { className: "text-yellow-700 text-sm mb-1", children: ["\u26A0\uFE0F ", warn] }, i))) })), _jsx("div", { className: "border-b border-gray-200 bg-gray-50", children: _jsx("div", { className: "flex overflow-x-auto", children: ['overview', 'voltages', 'currents', 'power', 'convergence'].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), className: `px-6 py-3 font-medium text-sm transition whitespace-nowrap ${activeTab === tab
                            ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                            : 'text-gray-600 hover:text-gray-800'}`, children: tab.charAt(0).toUpperCase() + tab.slice(1) }, tab))) }) }), _jsxs("div", { className: "p-6", children: [activeTab === 'overview' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-blue-50 rounded-lg p-4 border border-blue-200", children: [_jsx("h4", { className: "font-semibold text-blue-900 mb-2", children: "\uD83D\uDCCA Analysis Type" }), _jsx("p", { className: "text-lg font-bold text-blue-600", children: data.type.toUpperCase() })] }), _jsxs("div", { className: "bg-green-50 rounded-lg p-4 border border-green-200", children: [_jsx("h4", { className: "font-semibold text-green-900 mb-2", children: "\uD83D\uDD0C Nodes" }), _jsx("p", { className: "text-lg font-bold text-green-600", children: Object.keys(data.nodeVoltages || {}).length })] }), _jsxs("div", { className: "bg-purple-50 rounded-lg p-4 border border-purple-200", children: [_jsx("h4", { className: "font-semibold text-purple-900 mb-2", children: "\u26A1 Total Power" }), _jsx("p", { className: `text-lg font-bold ${getPowerColor(totalPower)}`, children: formatValue(totalPower, 'W') })] })] }), data.convergence && (_jsxs("div", { className: "bg-gray-50 rounded-lg p-4 border border-gray-200", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-3", children: "Solver Information" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Iterations:" }), _jsx("p", { className: "font-bold text-gray-900", children: data.convergence.iterations })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Error:" }), _jsx("p", { className: "font-bold text-gray-900", children: data.convergence.error.toExponential(2) })] })] })] }))] })), activeTab === 'voltages' && (_jsxs("div", { children: [_jsxs("div", { className: "mb-4 flex justify-between items-center", children: [_jsx("h4", { className: "font-semibold text-gray-900", children: "Node Voltages" }), _jsxs("select", { value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "px-3 py-1 text-sm border border-gray-300 rounded-lg", children: [_jsx("option", { value: "name", children: "Sort by Name" }), _jsx("option", { value: "value", children: "Sort by Value" })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100 border-b border-gray-300", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left font-semibold text-gray-900", children: "Node" }), _jsx("th", { className: "px-4 py-2 text-right font-semibold text-gray-900", children: "Voltage" }), _jsx("th", { className: "px-4 py-2 text-center font-semibold text-gray-900", children: "Status" })] }) }), _jsx("tbody", { children: sortedVoltages.map(([node, voltage]) => (_jsxs("tr", { className: "border-b border-gray-200 hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2 font-mono text-gray-900", children: node }), _jsx("td", { className: `px-4 py-2 text-right font-mono font-bold ${getVoltageColor(voltage)}`, children: formatValue(voltage, 'V') }), _jsx("td", { className: "px-4 py-2 text-center", children: Math.abs(voltage) > 100 ? '⚠️ HIGH' : '✓ OK' })] }, node))) })] }) })] })), activeTab === 'currents' && (_jsxs("div", { children: [_jsxs("div", { className: "mb-4 flex justify-between items-center", children: [_jsx("h4", { className: "font-semibold text-gray-900", children: "Component Currents" }), _jsxs("select", { value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "px-3 py-1 text-sm border border-gray-300 rounded-lg", children: [_jsx("option", { value: "name", children: "Sort by Name" }), _jsx("option", { value: "value", children: "Sort by Value" })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100 border-b border-gray-300", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left font-semibold text-gray-900", children: "Component" }), _jsx("th", { className: "px-4 py-2 text-right font-semibold text-gray-900", children: "Current" }), _jsx("th", { className: "px-4 py-2 text-center font-semibold text-gray-900", children: "Status" })] }) }), _jsx("tbody", { children: sortedCurrents.map(([comp, current]) => (_jsxs("tr", { className: "border-b border-gray-200 hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2 font-mono text-gray-900", children: comp }), _jsx("td", { className: `px-4 py-2 text-right font-mono font-bold ${getCurrentColor(current)}`, children: formatValue(current, 'A') }), _jsx("td", { className: "px-4 py-2 text-center", children: Math.abs(current) > 1 ? '⚠️ HIGH' : '✓ OK' })] }, comp))) })] }) })] })), activeTab === 'power' && (_jsxs("div", { children: [_jsxs("div", { className: "mb-4", children: [_jsx("h4", { className: "font-semibold text-gray-900", children: "Power Dissipation" }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Total: ", _jsx("span", { className: getPowerColor(totalPower), children: formatValue(totalPower, 'W') })] })] }), _jsx("div", { className: "space-y-2", children: sortedPower.map(([comp, power]) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsx("span", { className: "font-mono text-gray-900", children: comp }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-32 h-2 bg-gray-200 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all ${getPowerColor(power).replace('text-', 'bg-')}`, style: { width: `${Math.min(100, (power / (totalPower / 1.5)) * 100)}%` } }) }), _jsx("span", { className: `font-mono font-bold ${getPowerColor(power)}`, children: formatValue(power, 'W') })] })] }, comp))) })] })), activeTab === 'convergence' && (_jsx("div", { children: data.convergence ? (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-300", children: [_jsx("h4", { className: "font-semibold text-blue-900 mb-4", children: "\uD83D\uDD04 Solver Statistics" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-blue-700", children: "Iterations to Convergence" }), _jsx("p", { className: "text-3xl font-bold text-blue-600", children: data.convergence.iterations })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-blue-700", children: "Final Error" }), _jsx("p", { className: "font-mono text-blue-600", children: data.convergence.error.toExponential(4) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-blue-700", children: "Solution Time" }), _jsx("p", { className: "font-bold text-blue-600", children: new Date(data.convergence.timestamp).toLocaleString() })] })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-300", children: [_jsx("h4", { className: "font-semibold text-green-900 mb-4", children: "\u2705 Convergence Quality" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-green-700", children: "Status" }), _jsx("p", { className: "text-lg font-bold text-green-600", children: data.convergence.error < 1e-6 ? '🎯 Excellent' : '✓ Good' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-green-700", children: "Error Magnitude" }), _jsxs("p", { className: "font-mono text-green-600", children: [Math.log10(data.convergence.error).toFixed(2), " (log scale)"] })] })] })] })] })) : (_jsx("p", { className: "text-gray-600 text-center py-8", children: "No convergence data available" })) }))] }), _jsxs("div", { className: "border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Run at ", new Date().toLocaleTimeString()] }), _jsx("button", { onClick: () => {
                            const json = JSON.stringify(data, null, 2);
                            const blob = new Blob([json], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `simulation-${Date.now()}.json`;
                            a.click();
                        }, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium", children: "\uD83D\uDCE5 Export JSON" })] })] }));
};
export default SimulationResults;
