import React, { useState } from 'react';
import { Code, Settings, BarChart3 } from 'lucide-react';
import Button from './ui/Button';

interface InspectorPanelProps {
  selectedComponentId?: string;
  onPropertyChange?: (id: string, property: string, value: unknown) => void;
}

type InspectorTab = 'properties' | 'code' | 'stats';

const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedComponentId,
  onPropertyChange,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('properties');

  return (
    <div className="inspector-panel">
      {/* Inspector Header */}
      <div className="inspector-header">
        <h3 className="inspector-title">Inspector</h3>
      </div>

      {/* Tab Buttons */}
      <div className="inspector-tabs">
        <Button
          size="sm"
          variant={activeTab === 'properties' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('properties')}
          icon={<Settings size={16} />}
        >
          Properties
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'code' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('code')}
          icon={<Code size={16} />}
        >
          Code
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'stats' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('stats')}
          icon={<BarChart3 size={16} />}
        >
          Stats
        </Button>
      </div>

      {/* Content Area */}
      <div className="inspector-content">
        {!selectedComponentId ? (
          <div className="inspector-empty">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Select a component to view details
            </p>
          </div>
        ) : (
          <>
            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div className="inspector-section">
                <div className="section-group">
                  <h4 className="section-title">Component</h4>
                  <div className="property-item">
                    <label className="property-label">ID</label>
                    <input
                      type="text"
                      value={selectedComponentId}
                      disabled
                      className="property-input"
                    />
                  </div>
                </div>

                <div className="section-group">
                  <h4 className="section-title">Position</h4>
                  <div className="property-row">
                    <div className="property-item flex-1">
                      <label className="property-label">X</label>
                      <input type="number" className="property-input" defaultValue={0} />
                    </div>
                    <div className="property-item flex-1">
                      <label className="property-label">Y</label>
                      <input type="number" className="property-input" defaultValue={0} />
                    </div>
                  </div>
                </div>

                <div className="section-group">
                  <h4 className="section-title">Size</h4>
                  <div className="property-row">
                    <div className="property-item flex-1">
                      <label className="property-label">Width</label>
                      <input type="number" className="property-input" defaultValue={64} />
                    </div>
                    <div className="property-item flex-1">
                      <label className="property-label">Height</label>
                      <input type="number" className="property-input" defaultValue={32} />
                    </div>
                  </div>
                </div>

                <div className="section-group">
                  <h4 className="section-title">Pins</h4>
                  <div className="pins-grid">
                    <div className="pin-item">
                      <span className="pin-name">Pin 1</span>
                      <input
                        type="text"
                        placeholder="Net name"
                        className="property-input"
                      />
                    </div>
                    <div className="pin-item">
                      <span className="pin-name">Pin 2</span>
                      <input
                        type="text"
                        placeholder="Net name"
                        className="property-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Code Tab */}
            {activeTab === 'code' && (
              <div className="inspector-section">
                <div className="code-panel">
                  <pre className="code-content">
{`// HDL Code for ${selectedComponentId}
always @(posedge clk) begin
  // Generated HDL
end`}
                  </pre>
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="inspector-section">
                <div className="section-group">
                  <h4 className="section-title">Schematic Stats</h4>
                  <div className="stat-item">
                    <span className="stat-label">Total Components</span>
                    <span className="stat-value">12</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Wires</span>
                    <span className="stat-value">18</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Selected Pins</span>
                    <span className="stat-value">2</span>
                  </div>
                </div>

                <div className="section-group">
                  <h4 className="section-title">Performance</h4>
                  <div className="stat-item">
                    <span className="stat-label">Render Time</span>
                    <span className="stat-value">2.4ms</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Memory</span>
                    <span className="stat-value">4.2MB</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InspectorPanel;
