import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Phase C Main Page
 * Unified interface for all Phase C analysis and visualization features
 * Includes: Advanced Analysis, 3D Visualization, AI Explanations, Automation
 */
import { useState } from 'react';
import { AdvancedSimulation, CircuitComparison, ParameterSweep, Scene3D, AdaptiveExplanation, AutomationDashboard, usePhaseCStore, } from '../components';
import './PhaseCPage.css';
const TABS = [
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
export const PhaseCPage = () => {
    const store = usePhaseCStore();
    const [activeTab, setActiveTab] = useState('transient');
    const [analysisId] = useState('analysis-001');
    const [circuitId] = useState('circuit-001');
    /**
     * Render tab content
     */
    const renderTabContent = () => {
        switch (activeTab) {
            case 'transient':
                return _jsx(AdvancedSimulation, { analysisId: analysisId });
            case 'comparison':
                return _jsx(CircuitComparison, { originalCircuitId: circuitId, modifiedCircuitId: `${circuitId}-mod` });
            case 'sweep':
                return _jsx(ParameterSweep, { componentId: "R1", parameterName: "Resistance" });
            case 'scene3d':
                return _jsx(Scene3D, { analysisId: analysisId });
            case 'explanation':
                return _jsx(AdaptiveExplanation, { analysisId: analysisId });
            case 'automation':
                return _jsx(AutomationDashboard, { circuitId: circuitId });
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
    return (_jsxs("div", { className: "phase-c-page", children: [_jsxs("div", { className: "page-header", children: [_jsxs("div", { className: "header-content", children: [_jsx("h1", { children: "\u26A1 Phase C - Advanced Circuit Analysis & Optimization" }), _jsx("p", { className: "page-subtitle", children: "Comprehensive transient analysis, 3D visualization, AI-powered explanations, and automation" })] }), _jsxs("div", { className: "quick-stats", children: [_jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-icon", children: "\uD83D\uDCCB" }), _jsxs("div", { className: "stat-info", children: [_jsx("span", { className: "stat-label", children: "Analysis" }), _jsx("span", { className: "stat-value", children: "3 Features" })] })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-icon", children: "\u2713" }), _jsxs("div", { className: "stat-info", children: [_jsx("span", { className: "stat-label", children: "Status" }), _jsx("span", { className: "stat-value", children: "Production" })] })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-icon", children: "\uD83D\uDCE6" }), _jsxs("div", { className: "stat-info", children: [_jsx("span", { className: "stat-label", children: "Components" }), _jsx("span", { className: "stat-value", children: "6 Total" })] })] })] })] }), _jsx("div", { className: "tab-navigation", children: _jsxs("div", { className: "tab-groups", children: [_jsxs("div", { className: "tab-category", children: [_jsxs("div", { className: "category-title", children: [_jsx("span", { className: "category-icon", children: "\uD83D\uDD2C" }), _jsx("span", { children: "C1 - Advanced Analysis" })] }), _jsx("div", { className: "tab-buttons", children: categorizedTabs.analysis.map((tab) => (_jsxs("button", { className: `tab-btn ${activeTab === tab.id ? 'active' : ''}`, onClick: () => setActiveTab(tab.id), title: tab.description, children: [_jsx("span", { className: "tab-icon", children: tab.icon }), _jsx("span", { className: "tab-label", children: tab.label })] }, tab.id))) })] }), _jsxs("div", { className: "tab-category", children: [_jsxs("div", { className: "category-title", children: [_jsx("span", { className: "category-icon", children: "\uD83C\uDFA8" }), _jsx("span", { children: "C2 - 3D Visualization" })] }), _jsx("div", { className: "tab-buttons", children: categorizedTabs.visualization.map((tab) => (_jsxs("button", { className: `tab-btn ${activeTab === tab.id ? 'active' : ''}`, onClick: () => setActiveTab(tab.id), title: tab.description, children: [_jsx("span", { className: "tab-icon", children: tab.icon }), _jsx("span", { className: "tab-label", children: tab.label })] }, tab.id))) })] }), _jsxs("div", { className: "tab-category", children: [_jsxs("div", { className: "category-title", children: [_jsx("span", { className: "category-icon", children: "\uD83C\uDF93" }), _jsx("span", { children: "C3 - AI Explanations" })] }), _jsx("div", { className: "tab-buttons", children: categorizedTabs.explanation.map((tab) => (_jsxs("button", { className: `tab-btn ${activeTab === tab.id ? 'active' : ''}`, onClick: () => setActiveTab(tab.id), title: tab.description, children: [_jsx("span", { className: "tab-icon", children: tab.icon }), _jsx("span", { className: "tab-label", children: tab.label })] }, tab.id))) })] }), _jsxs("div", { className: "tab-category", children: [_jsxs("div", { className: "category-title", children: [_jsx("span", { className: "category-icon", children: "\u2699\uFE0F" }), _jsx("span", { children: "C4 - Automation" })] }), _jsx("div", { className: "tab-buttons", children: categorizedTabs.automation.map((tab) => (_jsxs("button", { className: `tab-btn ${activeTab === tab.id ? 'active' : ''}`, onClick: () => setActiveTab(tab.id), title: tab.description, children: [_jsx("span", { className: "tab-icon", children: tab.icon }), _jsx("span", { className: "tab-label", children: tab.label })] }, tab.id))) })] })] }) }), activeTabConfig && (_jsx("div", { className: "tab-description", children: _jsxs("p", { children: [_jsxs("strong", { children: [activeTabConfig.icon, " ", activeTabConfig.label] }), _jsx("span", { children: activeTabConfig.description })] }) })), _jsx("div", { className: "tab-content", children: renderTabContent() }), process.env.NODE_ENV === 'development' && (_jsx("div", { className: "state-debug", children: _jsxs("details", { children: [_jsx("summary", { children: "\uD83D\uDCCA Store State (Dev Only)" }), _jsx("pre", { children: JSON.stringify(store, null, 2) })] }) }))] }));
};
export default PhaseCPage;
