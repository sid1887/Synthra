import { useRef, useEffect, useState } from 'react';
import { AnalysisResponse } from '../types';
import { exportAnalysis, downloadFile } from '../api';

interface AnalysisResultsProps {
  result: AnalysisResponse;
  preview: string;
}

export default function AnalysisResults({ result, preview }: AnalysisResultsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'simulation' | 'reconstruction'>('overview');
  const [exporting, setExporting] = useState(false);
  const analysisId = result.image?.imageId || result.requestId;
  const detectionSource = result.__metadata?.detectionSource || 'unknown';

  useEffect(() => {
    // Draw annotation overlay on canvas
    if (canvasRef.current && preview) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        // Draw bounding boxes
        result.components.forEach((comp) => {
          const { x, y, w, h } = comp.bbox;
          
          // Color by confidence
          let color = '#22c55e'; // green
          if (comp.confidence < 0.65) color = '#f59e0b'; // amber
          if (comp.confidence < 0.5) color = '#ef4444'; // red

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

  const handleExport = async (format: 'json' | 'txt' | 'md' | 'html' | 'csv') => {
    try {
      setExporting(true);
      const blob = await exportAnalysis(analysisId, format);
      
      let filename = `analysis-${result.requestId}`;
      switch (format) {
        case 'json': filename += '.json'; break;
        case 'txt': filename += '.txt'; break;
        case 'md': filename += '.md'; break;
        case 'html': filename += '.html'; break;
        case 'csv': filename = `components-${result.requestId}.csv`; break;
      }
      
      downloadFile(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-800 bg-red-100';
      case 'warning': return 'text-yellow-800 bg-yellow-100';
      default: return 'text-blue-800 bg-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with Circuit Type */}
      <div className="bg-gradient-to-r from-synthra-600 to-synthra-700 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">{result.circuit.label.replace(/_/g, ' ').toUpperCase()}</h2>
            <p className="text-synthra-100">{result.circuit.description}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded bg-black/20 px-2 py-1 text-xs">
              <span>Detection Source:</span>
              <span className="font-semibold uppercase">{detectionSource}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{(result.circuit.confidence * 100).toFixed(0)}%</div>
            <div className="text-sm text-synthra-100">Confidence</div>
            <div className="mt-2 text-2xl">
              {result.circuit.complexity === 'simple' ? '🟢' : result.circuit.complexity === 'moderate' ? '🟡' : '🔴'}
            </div>
            <div className="text-xs">{result.circuit.complexity}</div>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="bg-synthra-50 border-b border-synthra-200 px-6 py-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-synthra-900">Export Analysis</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="px-3 py-1 text-xs font-medium bg-white text-synthra-600 border border-synthra-300 rounded hover:bg-synthra-50 disabled:opacity-50"
            >
              JSON
            </button>
            <button
              onClick={() => handleExport('txt')}
              disabled={exporting}
              className="px-3 py-1 text-xs font-medium bg-white text-synthra-600 border border-synthra-300 rounded hover:bg-synthra-50 disabled:opacity-50"
            >
              TXT
            </button>
            <button
              onClick={() => handleExport('md')}
              disabled={exporting}
              className="px-3 py-1 text-xs font-medium bg-white text-synthra-600 border border-synthra-300 rounded hover:bg-synthra-50 disabled:opacity-50"
            >
              Markdown
            </button>
            <button
              onClick={() => handleExport('html')}
              disabled={exporting}
              className="px-3 py-1 text-xs font-medium bg-white text-synthra-600 border border-synthra-300 rounded hover:bg-synthra-50 disabled:opacity-50"
            >
              HTML
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="px-3 py-1 text-xs font-medium bg-white text-synthra-600 border border-synthra-300 rounded hover:bg-synthra-50 disabled:opacity-50"
            >
              CSV
            </button>
            {exporting && <span className="text-xs text-synthra-600 px-2">Exporting...</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex">
        {['overview', 'components', 'simulation', 'reconstruction'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 font-medium transition ${
              activeTab === tab
                ? 'border-b-2 border-synthra-600 text-synthra-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab === 'overview' && '📋 Overview'}
            {tab === 'components' && '🔧 Components'}
            {tab === 'simulation' && '⚡ Simulation'}
            {tab === 'reconstruction' && '📐 Schematic'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Image with Annotations */}
            <div>
              <h3 className="font-bold text-lg mb-3">Circuit Image (Annotated)</h3>
              {preview ? (
                <canvas ref={canvasRef} className="w-full rounded-lg border border-gray-200" />
              ) : (
                <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  Original image preview is unavailable for this loaded result.
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">Green: high confidence, Yellow: medium, Red: low</p>
            </div>

            {/* Explanation */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-bold text-synthra-700 mb-2">Student Explanation</h4>
              <p className="text-gray-700">{result.explanation.student}</p>
            </div>

            {detectionSource === 'mock' && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2">Using Fallback Detection Data</h4>
                <p className="text-sm text-amber-800">
                  This result came from mock fallback data, not real vision inference. Check backend AI model configuration.
                </p>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div>
                <h4 className="font-bold text-lg mb-3">⚠️ Warnings & Issues</h4>
                <div className="space-y-2">
                  {result.warnings.map((warn, i) => (
                    <div key={i} className={`p-3 rounded-lg ${severityColor(warn.severity)}`}>
                      <div className="font-bold">{warn.code}</div>
                      <div className="text-sm">{warn.message}</div>
                      <div className="text-xs mt-1">✅ {warn.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div>
                <h4 className="font-bold text-lg mb-3">💡 Recommendations</h4>
                <div className="space-y-3">
                  {result.suggestions.map((sug) => (
                    <div key={sug.id} className="border-l-4 border-synthra-500 bg-synthra-50 p-3 rounded">
                      <div className="font-bold text-synthra-700">{sug.title}</div>
                      <div className="text-sm text-gray-700">{sug.description}</div>
                      <div className="text-xs text-synthra-600 mt-1">🔧 {sug.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guidance */}
            {result.guidance.reasons.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2">📸 Image Quality Notes</h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  {result.guidance.reasons.map((reason, i) => (
                    <li key={i}>• {reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Components Tab */}
        {activeTab === 'components' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.components.map((comp) => (
                <div key={comp.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">{comp.canonicalLabel.toUpperCase()}</div>
                      {comp.value && <div className="text-sm text-gray-600">{comp.value}</div>}
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        comp.confidence >= 0.85 ? 'text-green-600' :
                        comp.confidence >= 0.65 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {(comp.confidence * 100).toFixed(0)}%
                      </div>
                      {comp.role && <div className="text-xs text-gray-500">{comp.role}</div>}
                    </div>
                  </div>

                  {/* Position info */}
                  <div className="text-xs text-gray-500 mb-2">
                    🎯 Position: {comp.bbox.x}, {comp.bbox.y} (w: {comp.bbox.w}, h: {comp.bbox.h})
                  </div>

                  {/* Orientation & Polarity */}
                  <div className="flex gap-2 text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded">{comp.orientation}</span>
                    {comp.polarity !== 'na' && (
                      <span className="bg-gray-100 px-2 py-1 rounded">{comp.polarity}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-gray-700">
              Total detected: <strong>{result.components.length}</strong> components
            </div>
          </div>
        )}

        {/* Simulation Tab */}
        {activeTab === 'simulation' && (
          <div>
            {result.simulation ? (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm font-bold text-green-700">Power Supply: {result.simulation.power_voltage}V</div>
                </div>

                {/*Component sim results */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Component</th>
                        <th className="px-4 py-2 text-right">Voltage (V)</th>
                        <th className="px-4 py-2 text-right">Current (mA)</th>
                        <th className="px-4 py-2 text-right">Power (mW)</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.simulation.components.map((comp, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {result.components.find(c => c.id === comp.componentId)?.canonicalLabel}
                          </td>
                          <td className="px-4 py-2 text-right">{comp.voltage.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">{comp.current.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">{comp.power.toFixed(2)}</td>
                          <td className="px-4 py-2 text-center">
                            {comp.status === 'on' && '🟢'}
                            {comp.status === 'off' && '⚫'}
                            {comp.status === 'limited' && '🟡'}
                            {comp.status === 'unknown' && '❓'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {result.simulation.warnings.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="font-bold text-yellow-800 mb-2">Simulation Notes</div>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {result.simulation.warnings.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                  💡 {result.simulation.notes}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Simulation not available for this circuit type
              </div>
            )}
          </div>
        )}

        {/* Reconstruction Tab */}
        {activeTab === 'reconstruction' && (
          <div>
            {result.reconstruction ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm">
                    <strong className="text-synthra-700">Nodes:</strong> {result.reconstruction.nodes.length} | 
                    <strong className="text-synthra-700 ml-3">Edges:</strong> {result.reconstruction.edges.length} | 
                    <strong className="text-synthra-700 ml-3">Confidence:</strong> {(result.reconstruction.confidence * 100).toFixed(0)}%
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3">Network Nodes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.reconstruction.nodes.map((node) => (
                      <div key={node.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="font-bold">{node.label.toUpperCase()}</div>
                        <div className="text-xs text-gray-600 mt-1">Type: {node.type}</div>
                        {node.componentId && (
                          <div className="text-xs text-gray-600">ID: {node.componentId}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {result.reconstruction.netlist && (
                  <div>
                    <h4 className="font-bold mb-2">Netlist</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs italic">
                      {result.reconstruction.netlist}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Reconstruction data not available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 text-xs text-gray-600 border-t">
        <div className="flex justify-between">
          <span>Request ID: <code className="bg-white px-2 py-1 rounded">{result.requestId}</code></span>
          <span>Analysis ID: <code className="bg-white px-2 py-1 rounded">{analysisId}</code></span>
          <span>Processed in {result.processingTimeMs}ms</span>
          <span>{new Date(result.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
