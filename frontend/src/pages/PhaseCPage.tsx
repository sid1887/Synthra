/**
 * Phase C Main Page
 * Unified interface for all Phase C analysis and visualization features
 * Includes: Advanced Analysis, 3D Visualization, AI Explanations, Automation
 */

import React, { useState } from 'react';
import {
  AdvancedSimulation,
  CircuitComparison,
  ParameterSweep,
  Scene3D,
  AdaptiveExplanation,
  AutomationDashboard,
  usePhaseCStore,
} from '../components';
import './PhaseCPage.css';

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  category: 'analysis' | 'visualization' | 'explanation' | 'automation';
  description: string;
}

const TABS: TabConfig[] = [
  // C1 - Advanced Analysis
  {
    id: 'transient',
    label: 'Transient Analysis',
    icon: '🔬',
    category: 'analysis',
    description: 'Time-domain circuit response with RC charging curves',
  },
  {
    id: 'comparison',
    label: 'Circuit Comparison',
    icon: '⚖️',
    category: 'analysis',
    description: 'Before/after configuration comparison',
  },
  {
    id: 'sweep',
    label: 'Parameter Sweep',
    icon: '📈',
    category: 'analysis',
    description: 'Sensitivity analysis and optimization',
  },

  // C2 - 3D Visualization
  {
    id: 'scene3d',
    label: '3D Visualization',
    icon: '🎨',
    category: 'visualization',
    description: 'Interactive 3D circuit component analysis',
  },

  // C3 - AI Explanations
  {
    id: 'explanation',
    label: 'Explanations',
    icon: '🎓',
    category: 'explanation',
    description: 'Multi-level technical explanations',
  },

  // C4 - Automation
  {
    id: 'automation',
    label: 'Automation',
    icon: '⚙️',
    category: 'automation',
    description: 'Circuit optimization automation',
  },
];

/**
 * Phase C Main Page Component
 */
export const PhaseCPage: React.FC = () => {
  const store = usePhaseCStore();
  const [activeTab, setActiveTab] = useState<string>('transient');
  const [analysisId] = useState('analysis-001');
  const [circuitId] = useState('circuit-001');

  /**
   * Render tab content
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'transient':
        return <AdvancedSimulation analysisId={analysisId} />;
      case 'comparison':
        return <CircuitComparison originalCircuitId={circuitId} modifiedCircuitId={`${circuitId}-mod`} />;
      case 'sweep':
        return <ParameterSweep componentId="R1" parameterName="Resistance" />;
      case 'scene3d':
        return <Scene3D analysisId={analysisId} />;
      case 'explanation':
        return <AdaptiveExplanation analysisId={analysisId} />;
      case 'automation':
        return <AutomationDashboard circuitId={circuitId} />;
      default:
        return null;
    }
  };

  const activeTabConfig = TABS.find((t) => t.id === activeTab);
  const categorizedTabs = {
    analysis: TABS.filter((t) => t.category === 'analysis'),
    visualization: TABS.filter((t) => t.category === 'visualization'),
    explanation: TABS.filter((t) => t.category === 'explanation'),
    automation: TABS.filter((t) => t.category === 'automation'),
  };

  return (
    <div className="phase-c-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>⚡ Phase C - Advanced Circuit Analysis & Optimization</h1>
          <p className="page-subtitle">
            Comprehensive transient analysis, 3D visualization, AI-powered explanations, and automation
          </p>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat">
            <span className="stat-icon">📋</span>
            <div className="stat-info">
              <span className="stat-label">Analysis</span>
              <span className="stat-value">3 Features</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">✓</span>
            <div className="stat-info">
              <span className="stat-label">Status</span>
              <span className="stat-value">Production</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">📦</span>
            <div className="stat-info">
              <span className="stat-label">Components</span>
              <span className="stat-value">6 Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {/* Category Groups */}
        <div className="tab-groups">
          {/* C1 - Analysis */}
          <div className="tab-category">
            <div className="category-title">
              <span className="category-icon">🔬</span>
              <span>C1 - Advanced Analysis</span>
            </div>
            <div className="tab-buttons">
              {categorizedTabs.analysis.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* C2 - Visualization */}
          <div className="tab-category">
            <div className="category-title">
              <span className="category-icon">🎨</span>
              <span>C2 - 3D Visualization</span>
            </div>
            <div className="tab-buttons">
              {categorizedTabs.visualization.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* C3 - Explanations */}
          <div className="tab-category">
            <div className="category-title">
              <span className="category-icon">🎓</span>
              <span>C3 - AI Explanations</span>
            </div>
            <div className="tab-buttons">
              {categorizedTabs.explanation.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* C4 - Automation */}
          <div className="tab-category">
            <div className="category-title">
              <span className="category-icon">⚙️</span>
              <span>C4 - Automation</span>
            </div>
            <div className="tab-buttons">
              {categorizedTabs.automation.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Tab Description */}
      {activeTabConfig && (
        <div className="tab-description">
          <p>
            <strong>{activeTabConfig.icon} {activeTabConfig.label}</strong>
            <span>{activeTabConfig.description}</span>
          </p>
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">{renderTabContent()}</div>

      {/* Store State Debug (Optional - visible in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="state-debug">
          <details>
            <summary>📊 Store State (Dev Only)</summary>
            <pre>{JSON.stringify(store, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default PhaseCPage;
