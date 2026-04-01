import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Zap,
  FolderOpen,
  Save,
  Play,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  Undo,
  Redo,
  Move,
  ZoomIn,
  ZoomOut,
  Grid,
  Box,
  Code,
  FileText,
  AlertCircle
} from 'lucide-react';

import AppHeader from '../components/AppHeader';
import { ComponentPalette } from '../components/ComponentPalette';
import SchematicCanvas from '../components/SchematicCanvas';
import InspectorPanel from '../components/InspectorPanel';
import StatusBar from '../components/StatusBar';
import DetectionModal from '../components/DetectionModal';
import ExportDialog from '../components/ExportDialog';
import SimulationPanel from '../components/SimulationPanel';
import NetlistVerifier from '../components/NetlistVerifier';
import type { DetectedComponent } from '../components/DetectionModal';

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { draftManager } from '../utils/draftManager';
import { apiService } from '../utils/apiClient';

// Types
interface EditorProps {}

interface DetectionResult {
  components?: Array<{
    component_type: string;
    confidence: number;
  }>;
  overall_confidence: number;
}

type InspectorTab = 'properties' | 'code' | 'stats';

// Mock Components Data
const COMPONENT_CATEGORIES = [
  {
    category: 'Passive',
    items: [
      { name: 'Resistor', value: '1kΩ', icon: '⟿' },
      { name: 'Capacitor', value: '10µF', icon: '⊓' },
      { name: 'Inductor', value: '1mH', icon: '≈≈≈' }
    ]
  },
  {
    category: 'Active',
    items: [
      { name: 'BJT NPN', value: '2N2222', icon: '▷|' },
      { name: 'MOSFET N', value: 'IRF540', icon: '▷||' },
      { name: 'Diode', value: '1N4148', icon: '▷|' }
    ]
  },
  {
    category: 'IC',
    items: [
      { name: 'Op-Amp', value: 'LM741', icon: '△' },
      { name: 'Timer', value: 'NE555', icon: '□' },
      { name: 'Regulator', value: '7805', icon: '□' }
    ]
  }
];

const Editor: React.FC<EditorProps> = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();

  // State Management
  const [fileName, setFileName] = useState('Untitled Circuit');
  const [isModified, setIsModified] = useState(false);
  const [loading, setLoading] = useState(!!roomId);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<InspectorTab>('properties');

  // Modal State
  const [showDetectionModal, setShowDetectionModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSimulationPanel, setShowSimulationPanel] = useState(false);
  const [showNetlistVerifier, setShowNetlistVerifier] = useState(false);

  // Detection Result
  const [result, setResult] = useState<DetectionResult | null>(null);

  // Undo/Redo
  const { undo, redo, clearHistory } = useUndoRedo();

  // Load circuit on mount
  useEffect(() => {
    if (roomId) {
      loadCircuit(roomId);
    } else {
      recoverFromDraft();
    }
  }, [roomId]);

  // Circuit Loading
  const loadCircuit = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.loadProject(id);
      setFileName(response.data.name || `Circuit ${id.slice(0, 8)}`);
      setIsModified(false);
      
      // Load detection result if available
      if (response.data.detectionResult) {
        setResult(response.data.detectionResult);
      }
    } catch (err) {
      console.error('Failed to load circuit:', err);
      setError('Failed to load circuit. It may not exist or you may not have permission to access it.');
    } finally {
      setLoading(false);
    }
  };

  const recoverFromDraft = () => {
    const drafts = draftManager.getAllDrafts();
    if (drafts.length > 0) {
      setFileName(drafts[0].name);
    }
  };

  // File Operations
  const handleNew = useCallback(() => {
    if (isModified && !window.confirm('Discard unsaved changes?')) return;
    
    clearHistory();
    setFileName('Untitled Circuit');
    setIsModified(false);
    setResult(null);
  }, [isModified, clearHistory]);

  const handleOpen = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        setFileName(file.name.replace('.json', ''));
        setIsModified(false);
        
        if (data.detectionResult) {
          setResult(data.detectionResult);
        }
      } catch (err) {
        console.error('Failed to open file:', err);
        alert('Failed to open file. Please ensure it is a valid circuit file.');
      }
    };
    
    input.click();
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await apiService.saveProject({
        name: fileName,
        schematic: {},
        components: result?.components || [],
        wires: [],
      });
      
      setIsModified(false);
      draftManager.saveDraft(fileName, {});
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save circuit. Please try again.');
    }
  }, [fileName, result]);

  const handleExport = useCallback((format: string) => {
    console.log('Export as:', format);
    setShowExportDialog(false);
    // Implement export logic here
  }, []);

  const handleSimulate = useCallback((params: any) => {
    console.log('Run simulation with:', params);
    // Implement simulation logic here
  }, []);

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onNew: handleNew,
    onOpen: handleOpen,
    onSave: handleSave,
    onExport: () => setShowExportDialog(true),
    onSimulate: () => setShowSimulationPanel(true),
  });

  // Component Change Handler
  const handleComponentsChange = useCallback(() => {
    setIsModified(true);
  }, []);

  const handleDetectionAccept = useCallback((components: any) => {
    console.log('Accepted components:', components);
    setShowDetectionModal(false);
    setResult(components);
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <Link to="/" className="header-logo">
              <Zap className="logo-icon" />
              <span>Synthra</span>
            </Link>
          </div>
        </header>
        <div className="loading-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
            Loading circuit...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <Link to="/" className="header-logo">
              <Zap className="logo-icon" />
              <span>Synthra</span>
            </Link>
          </div>
        </header>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 'var(--space-8)'
        }}>
          <div style={{ 
            maxWidth: '500px', 
            textAlign: 'center',
            padding: 'var(--space-8)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)'
          }}>
            <AlertCircle 
              size={48} 
              style={{ 
                color: 'var(--color-error)', 
                margin: '0 auto var(--space-4)' 
              }} 
            />
            <h2 style={{ 
              fontSize: 'var(--font-size-2xl)', 
              marginBottom: 'var(--space-3)',
              color: 'var(--color-text-primary)'
            }}>
              Error Loading Circuit
            </h2>
            <p style={{ 
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-6)'
            }}>
              {error}
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Editor UI
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <Link to="/" className="header-logo">
            <Zap className="logo-icon" />
            <span>Synthra</span>
          </Link>
        </div>
        
        <div className="header-center">
          <span>{roomId ? `Circuit ${roomId.slice(0, 8)}` : fileName}</span>
          {isModified && (
            <div className="unsaved-indicator" title="Unsaved changes" />
          )}
        </div>
        
        <div className="header-right">
          <button className="btn btn-icon" onClick={handleNew} title="New (Ctrl+N)">
            <FolderOpen size={18} />
          </button>
          <button className="btn btn-icon" onClick={handleSave} title="Save (Ctrl+S)">
            <Save size={18} />
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowSimulationPanel(true)}
            title="Run Simulation (Ctrl+R)"
          >
            <Play size={18} />
            <span>Simulate</span>
          </button>
          <button 
            className="btn btn-icon" 
            onClick={() => setShowExportDialog(true)}
            title="Export"
          >
            <Download size={18} />
          </button>
          <button className="btn btn-icon" title="Settings">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Editor Layout */}
      <div className="editor-layout">
        {/* Left Palette */}
        <div 
          className="palette-panel"
          style={{ 
            width: isPaletteCollapsed ? '48px' : 'var(--palette-width)',
            transition: 'width var(--transition-base)',
            position: 'relative'
          }}
        >
          {!isPaletteCollapsed && (
            <>
              <div className="palette-header">
                <input
                  type="search"
                  className="palette-search"
                  placeholder="Search components..."
                />
              </div>
              
              <div className="palette-content">
                <div className="component-category">
                  <div className="category-header">Recently Used</div>
                  <div style={{ 
                    padding: 'var(--space-3)', 
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--font-size-xs)',
                    textAlign: 'center'
                  }}>
                    No recent components
                  </div>
                </div>

                {COMPONENT_CATEGORIES.map((category, idx) => (
                  <div key={idx} className="component-category">
                    <div className="category-header">{category.category}</div>
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="component-item" draggable>
                        <div className="component-icon">{item.icon}</div>
                        <div className="component-info">
                          <div className="component-name">{item.name}</div>
                          <div className="component-value">{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
          
          <button
            className="btn btn-icon"
            style={{
              position: 'absolute',
              top: 'var(--space-3)',
              right: 'var(--space-2)',
              zIndex: 10
            }}
            onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
            title={isPaletteCollapsed ? 'Expand palette' : 'Collapse palette'}
          >
            {isPaletteCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Canvas */}
        <div className="canvas-container">
          {/* Canvas Toolbar */}
          <div className="canvas-toolbar">
            <button className="btn btn-icon" onClick={undo} title="Undo (Ctrl+Z)">
              <Undo size={16} />
            </button>
            <button className="btn btn-icon" onClick={redo} title="Redo (Ctrl+Shift+Z)">
              <Redo size={16} />
            </button>
            <div style={{ 
              width: '1px', 
              height: '24px', 
              background: 'var(--color-border)',
              margin: '0 var(--space-2)'
            }} />
            <button className="btn btn-icon" title="Pan (Space)">
              <Move size={16} />
            </button>
            <button className="btn btn-icon" title="Zoom In (+)">
              <ZoomIn size={16} />
            </button>
            <button className="btn btn-icon" title="Zoom Out (-)">
              <ZoomOut size={16} />
            </button>
            <div style={{ 
              width: '1px', 
              height: '24px', 
              background: 'var(--color-border)',
              margin: '0 var(--space-2)'
            }} />
            <button className="btn btn-icon" title="Toggle Grid (G)">
              <Grid size={16} />
            </button>
          </div>

          {/* Canvas SVG */}
          <svg className="canvas-svg">
            {result ? (
              <g transform="translate(100, 100)">
                <text 
                  x="0" 
                  y="0" 
                  style={{ 
                    fill: 'var(--color-text-primary)', 
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 600
                  }}
                >
                  Detected Components: {result.components?.length || 0}
                </text>
                <text 
                  x="0" 
                  y="24" 
                  style={{ 
                    fill: 'var(--color-text-secondary)', 
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  Confidence: {(result.overall_confidence * 100).toFixed(1)}%
                </text>
              </g>
            ) : (
              <g transform="translate(400, 300)">
                <text 
                  x="0" 
                  y="0" 
                  textAnchor="middle" 
                  style={{ 
                    fill: 'var(--color-text-muted)', 
                    fontSize: 'var(--font-size-lg)'
                  }}
                >
                  Drag components from the palette to start
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Right Inspector */}
        <div 
          className="inspector-panel"
          style={{ 
            width: isInspectorCollapsed ? '48px' : 'var(--inspector-width)',
            transition: 'width var(--transition-base)',
            position: 'relative'
          }}
        >
          {!isInspectorCollapsed && (
            <>
              <div className="inspector-tabs">
                <button
                  className={`inspector-tab ${activeTab === 'properties' ? 'active' : ''}`}
                  onClick={() => setActiveTab('properties')}
                >
                  <Box size={16} style={{ margin: '0 auto' }} />
                  <span style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
                    Properties
                  </span>
                </button>
                <button
                  className={`inspector-tab ${activeTab === 'code' ? 'active' : ''}`}
                  onClick={() => setActiveTab('code')}
                >
                  <Code size={16} style={{ margin: '0 auto' }} />
                  <span style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
                    Code
                  </span>
                </button>
                <button
                  className={`inspector-tab ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  <FileText size={16} style={{ margin: '0 auto' }} />
                  <span style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
                    Stats
                  </span>
                </button>
              </div>

              <div className="inspector-content">
                {activeTab === 'properties' && (
                  <>
                    {result?.components && result.components.length > 0 ? (
                      <div className="property-group">
                        <div className="property-group-title">Detected Components</div>
                        {result.components.map((comp: any, idx: number) => (
                          <div key={idx} style={{ 
                            background: 'var(--color-bg-main)', 
                            padding: 'var(--space-3)', 
                            marginBottom: 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)'
                          }}>
                            <div style={{ 
                              fontWeight: 500,
                              marginBottom: 'var(--space-1)',
                              fontSize: 'var(--font-size-sm)'
                            }}>
                              {comp.component_type}
                            </div>
                            <div style={{ 
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-text-secondary)'
                            }}>
                              Confidence: {(comp.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ 
                        padding: 'var(--space-4)',
                        textAlign: 'center',
                        color: 'var(--color-text-muted)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        No components selected
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'code' && (
                  <div className="property-group">
                    <div className="property-group-title">Netlist</div>
                    <textarea
                      className="property-input"
                      rows={10}
                      placeholder="No netlist generated"
                      style={{ fontFamily: 'var(--font-family-mono)', resize: 'vertical' }}
                    />
                    <button className="btn" style={{ width: '100%', marginTop: 'var(--space-3)' }}>
                      Generate HDL
                    </button>
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div className="property-group">
                    <div className="property-group-title">Circuit Statistics</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: 'var(--space-2) 0',
                        borderBottom: '1px solid var(--color-border)'
                      }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Components:</span>
                        <span style={{ fontWeight: 500 }}>{result?.components?.length || 0}</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: 'var(--space-2) 0',
                        borderBottom: '1px solid var(--color-border)'
                      }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Connections:</span>
                        <span style={{ fontWeight: 500 }}>0</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: 'var(--space-2) 0',
                        borderBottom: '1px solid var(--color-border)'
                      }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Nodes:</span>
                        <span style={{ fontWeight: 500 }}>0</span>
                      </div>
                      {result && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          padding: 'var(--space-2) 0',
                          borderBottom: '1px solid var(--color-border)'
                        }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Confidence:</span>
                          <span style={{ fontWeight: 500 }}>{(result.overall_confidence * 100).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            className="btn btn-icon"
            style={{
              position: 'absolute',
              top: 'var(--space-3)',
              left: 'var(--space-2)',
              zIndex: 10
            }}
            onClick={() => setIsInspectorCollapsed(!isInspectorCollapsed)}
            title={isInspectorCollapsed ? 'Expand inspector' : 'Collapse inspector'}
          >
            {isInspectorCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span>Zoom: 100%</span>
        </div>
        <div className="status-item">
          <span>Grid: 20px</span>
        </div>
        <div className="status-item">
          <span>Cursor: (0, 0)</span>
        </div>
        <div className="status-item" style={{ marginLeft: 'auto' }}>
          <span style={{ color: 'var(--color-success)' }}>● Ready</span>
        </div>
      </div>

      {/* Modals & Panels */}
      {showDetectionModal && (
        <DetectionModal
          open={showDetectionModal}
          onOpenChange={(open) => setShowDetectionModal(open)}
          components={(result?.components || []).map((comp: any, idx: number) => ({
            id: `comp-${idx}`,
            name: comp.component_type,
            type: comp.component_type,
            confidence: comp.confidence,
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            position: { x: idx * 120, y: 0 }
          }))}
          onAccept={handleDetectionAccept}
        />
      )}

      {showExportDialog && (
        <ExportDialog
          open={showExportDialog}
          onOpenChange={(open) => setShowExportDialog(open)}
          onExport={handleExport}
        />
      )}

      {showSimulationPanel && (
        <SimulationPanel
          onStart={handleSimulate}
        />
      )}

      {showNetlistVerifier && (
        <NetlistVerifier
          issues={[
            { id: '1', type: 'error', message: 'Floating pin detected', affectedComponents: ['R1'] },
            { id: '2', type: 'warning', message: 'Unused component', affectedComponents: ['C1'] },
          ]}
          totalComponents={result?.components?.length || 0}
          totalWires={0}
        />
      )}
    </div>
  );
};

export default Editor;