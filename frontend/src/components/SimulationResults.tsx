/**
 * Simulation Results Component
 * Displays SPICE simulation results (DC, transient, AC analysis)
 */

import React, { useState, useEffect } from 'react';
import { usePhaseCStore } from '../store/phaseC.store';

interface SimulationData {
  type: 'dc' | 'transient' | 'ac';
  success: boolean;
  nodeVoltages: Record<string, number>;
  componentCurrents: Record<string, number>;
  powerDissipation: Record<string, number>;
  convergence?: {
    iterations: number;
    error: number;
    timestamp: number;
  };
  warnings: string[];
  errors: string[];
}

interface SimulationResultsProps {
  data: SimulationData;
  circuitName?: string;
}

export const SimulationResults: React.FC<SimulationResultsProps> = ({ data, circuitName = 'Circuit' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'voltages' | 'currents' | 'power' | 'convergence'>('overview');
  const [sortBy, setSortBy] = useState<'name' | 'value'>('name');
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

  const formatValue = (value: number, unit: string = ''): string => {
    const abs = Math.abs(value);
    if (abs >= 1000000) return `${(value / 1000000).toFixed(3)}M${unit}`;
    if (abs >= 1000) return `${(value / 1000).toFixed(3)}k${unit}`;
    if (abs < 0.001) return `${(value * 1000000).toFixed(3)}µ${unit}`;
    if (abs < 0.01) return `${(value * 1000).toFixed(3)}m${unit}`;
    return `${value.toFixed(4)}${unit}`;
  };

  const getVoltageColor = (voltage: number): string => {
    const abs = Math.abs(voltage);
    if (abs > 100) return 'text-red-600';
    if (abs > 50) return 'text-orange-600';
    if (abs > 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCurrentColor = (current: number): string => {
    const abs = Math.abs(current);
    if (abs > 1) return 'text-red-600';
    if (abs > 0.1) return 'text-orange-600';
    if (abs > 0.01) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getPowerColor = (power: number): string => {
    if (power > 100) return 'text-red-600';
    if (power > 10) return 'text-orange-600';
    if (power > 1) return 'text-yellow-600';
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

  return (
    <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">⚡ Simulation Results</h2>
        <p className="text-blue-100">
          {circuitName} - {data.type.toUpperCase()} Analysis
          {!data.success && <span className="ml-2 text-red-300 font-semibold">❌ FAILED</span>}
          {data.success && <span className="ml-2 text-green-300 font-semibold">✅ SUCCESS</span>}
        </p>
      </div>

      {/* Alerts */}
      {data.errors.length > 0 && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500">
          {data.errors.map((err, i) => (
            <p key={i} className="text-red-700 text-sm mb-1">
              ❌ {err}
            </p>
          ))}
        </div>
      )}

      {data.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500">
          {data.warnings.map((warn, i) => (
            <p key={i} className="text-yellow-700 text-sm mb-1">
              ⚠️ {warn}
            </p>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex overflow-x-auto">
          {['overview', 'voltages', 'currents', 'power', 'convergence'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-medium text-sm transition whitespace-nowrap ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">📊 Analysis Type</h4>
                <p className="text-lg font-bold text-blue-600">{data.type.toUpperCase()}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">🔌 Nodes</h4>
                <p className="text-lg font-bold text-green-600">{Object.keys(data.nodeVoltages || {}).length}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">⚡ Total Power</h4>
                <p className={`text-lg font-bold ${getPowerColor(totalPower)}`}>{formatValue(totalPower, 'W')}</p>
              </div>
            </div>

            {data.convergence && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Solver Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Iterations:</span>
                    <p className="font-bold text-gray-900">{data.convergence.iterations}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Error:</span>
                    <p className="font-bold text-gray-900">{data.convergence.error.toExponential(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voltages Tab */}
        {activeTab === 'voltages' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h4 className="font-semibold text-gray-900">Node Voltages</h4>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
              >
                <option value="name">Sort by Name</option>
                <option value="value">Sort by Value</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Node</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-900">Voltage</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVoltages.map(([node, voltage]) => (
                    <tr key={node} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-900">{node}</td>
                      <td className={`px-4 py-2 text-right font-mono font-bold ${getVoltageColor(voltage)}`}>
                        {formatValue(voltage, 'V')}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {Math.abs(voltage) > 100 ? '⚠️ HIGH' : '✓ OK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Currents Tab */}
        {activeTab === 'currents' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h4 className="font-semibold text-gray-900">Component Currents</h4>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
              >
                <option value="name">Sort by Name</option>
                <option value="value">Sort by Value</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Component</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-900">Current</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCurrents.map(([comp, current]) => (
                    <tr key={comp} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-900">{comp}</td>
                      <td className={`px-4 py-2 text-right font-mono font-bold ${getCurrentColor(current)}`}>
                        {formatValue(current, 'A')}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {Math.abs(current) > 1 ? '⚠️ HIGH' : '✓ OK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Power Tab */}
        {activeTab === 'power' && (
          <div>
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900">Power Dissipation</h4>
              <p className="text-sm text-gray-600 mt-1">
                Total: <span className={getPowerColor(totalPower)}>{formatValue(totalPower, 'W')}</span>
              </p>
            </div>
            <div className="space-y-2">
              {sortedPower.map(([comp, power]) => (
                <div key={comp} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-mono text-gray-900">{comp}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getPowerColor(power).replace('text-', 'bg-')}`}
                        style={{ width: `${Math.min(100, (power / (totalPower / 1.5)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className={`font-mono font-bold ${getPowerColor(power)}`}>
                      {formatValue(power, 'W')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Convergence Tab */}
        {activeTab === 'convergence' && (
          <div>
            {data.convergence ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-300">
                  <h4 className="font-semibold text-blue-900 mb-4">🔄 Solver Statistics</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-blue-700">Iterations to Convergence</p>
                      <p className="text-3xl font-bold text-blue-600">{data.convergence.iterations}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Final Error</p>
                      <p className="font-mono text-blue-600">{data.convergence.error.toExponential(4)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Solution Time</p>
                      <p className="font-bold text-blue-600">{new Date(data.convergence.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-300">
                  <h4 className="font-semibold text-green-900 mb-4">✅ Convergence Quality</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-green-700">Status</p>
                      <p className="text-lg font-bold text-green-600">
                        {data.convergence.error < 1e-6 ? '🎯 Excellent' : '✓ Good'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Error Magnitude</p>
                      <p className="font-mono text-green-600">{Math.log10(data.convergence.error).toFixed(2)} (log scale)</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No convergence data available</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Run at {new Date().toLocaleTimeString()}
        </p>
        <button
          onClick={() => {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `simulation-${Date.now()}.json`;
            a.click();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          📥 Export JSON
        </button>
      </div>
    </div>
  );
};

export default SimulationResults;
