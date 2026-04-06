/**
 * Phase C: Advanced Layer State Management
 * Zustand store for transient analysis, 3D scenes, AI orchestration, automation
 * Deep state management with comprehensive feature support
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
/**
 * Create Zustand store with middleware
 */
export const usePhaseCStore = create()(devtools(persist((set, get) => ({
    // Transient Analysis State
    transient: {
        frames: [],
        isLoading: false,
        error: null,
        totalDuration: 1000,
        powerVoltage: 5,
        currentFrameIndex: 0,
        isPlaying: false,
        playbackSpeed: 1,
        selectedComponentId: null,
    },
    setTransientFrames: (frames, duration, voltage) => set((state) => {
        state.transient.frames = frames;
        state.transient.totalDuration = duration;
        state.transient.powerVoltage = voltage;
        state.transient.currentFrameIndex = 0;
        state.transient.isPlaying = false;
    }),
    setTransientLoading: (loading) => set((state) => {
        state.transient.isLoading = loading;
    }),
    setTransientError: (error) => set((state) => {
        state.transient.error = error;
    }),
    playTransient: () => set((state) => {
        state.transient.isPlaying = true;
    }),
    pauseTransient: () => set((state) => {
        state.transient.isPlaying = false;
    }),
    setPlaybackFrame: (index) => set((state) => {
        const maxIndex = get().transient.frames.length - 1;
        state.transient.currentFrameIndex = Math.max(0, Math.min(index, maxIndex));
    }),
    setPlaybackSpeed: (speed) => set((state) => {
        state.transient.playbackSpeed = Math.max(0.25, Math.min(4, speed));
    }),
    nextFrame: () => set((state) => {
        const maxIndex = get().transient.frames.length - 1;
        state.transient.currentFrameIndex = Math.min(state.transient.currentFrameIndex + 1, maxIndex);
    }),
    prevFrame: () => set((state) => {
        state.transient.currentFrameIndex = Math.max(state.transient.currentFrameIndex - 1, 0);
    }),
    selectTransientComponent: (componentId) => set((state) => {
        state.transient.selectedComponentId = componentId;
    }),
    // Circuit Comparison State
    comparison: {
        originalId: null,
        modifiedId: null,
        differences: [],
        verdict: '',
        isLoading: false,
        error: null,
    },
    setComparisonData: (originalId, modifiedId, differences, verdict) => set((state) => {
        state.comparison.originalId = originalId;
        state.comparison.modifiedId = modifiedId;
        state.comparison.differences = differences;
        state.comparison.verdict = verdict;
        state.comparison.isLoading = false;
    }),
    setComparisonLoading: (loading) => set((state) => {
        state.comparison.isLoading = loading;
    }),
    setComparisonError: (error) => set((state) => {
        state.comparison.error = error;
    }),
    clearComparison: () => set((state) => {
        state.comparison = {
            originalId: null,
            modifiedId: null,
            differences: [],
            verdict: '',
            isLoading: false,
            error: null,
        };
    }),
    // Parameter Sweep State
    sweep: {
        componentId: null,
        variable: null,
        startValue: 100,
        endValue: 10000,
        results: [],
        optimalPoint: null,
        isLoading: false,
        error: null,
        selectedResultIndex: 0,
    },
    setSweepResults: (componentId, variable, startValue, endValue, results, optimal) => set((state) => {
        state.sweep.componentId = componentId;
        state.sweep.variable = variable;
        state.sweep.startValue = startValue;
        state.sweep.endValue = endValue;
        state.sweep.results = results;
        state.sweep.optimalPoint = optimal;
        state.sweep.isLoading = false;
        state.sweep.selectedResultIndex = 0;
    }),
    setSweepLoading: (loading) => set((state) => {
        state.sweep.isLoading = loading;
    }),
    setSweepError: (error) => set((state) => {
        state.sweep.error = error;
    }),
    selectSweepResult: (index) => set((state) => {
        state.sweep.selectedResultIndex = Math.max(0, Math.min(index, state.sweep.results.length - 1));
    }),
    clearSweep: () => set((state) => {
        state.sweep = {
            componentId: null,
            variable: null,
            startValue: 100,
            endValue: 10000,
            results: [],
            optimalPoint: null,
            isLoading: false,
            error: null,
            selectedResultIndex: 0,
        };
    }),
    // 3D Scene State
    scene3D: {
        sceneId: null,
        components: [],
        edges: [],
        camera: null,
        lighting: null,
        isLoading: false,
        error: null,
        isAutoRotating: true,
        visualizationMode: 'standard',
        selectedComponentId: null,
        zoomLevel: 1,
        showWires: true,
        showLabels: true,
    },
    initializeScene: (sceneData) => set((state) => {
        state.scene3D.sceneId = sceneData.sceneId;
        state.scene3D.components = sceneData.components;
        state.scene3D.edges = sceneData.edges;
        state.scene3D.camera = sceneData.camera;
        state.scene3D.lighting = sceneData.lighting;
        state.scene3D.isLoading = false;
    }),
    setSceneLoading: (loading) => set((state) => {
        state.scene3D.isLoading = loading;
    }),
    setSceneError: (error) => set((state) => {
        state.scene3D.error = error;
    }),
    toggleAutoRotate: () => set((state) => {
        state.scene3D.isAutoRotating = !state.scene3D.isAutoRotating;
    }),
    setVisualizationMode: (mode) => set((state) => {
        state.scene3D.visualizationMode = mode;
    }),
    selectSceneComponent: (componentId) => set((state) => {
        state.scene3D.selectedComponentId = componentId;
    }),
    setZoomLevel: (zoom) => set((state) => {
        state.scene3D.zoomLevel = Math.max(0.1, Math.min(5, zoom));
    }),
    toggleWires: () => set((state) => {
        state.scene3D.showWires = !state.scene3D.showWires;
    }),
    toggleLabels: () => set((state) => {
        state.scene3D.showLabels = !state.scene3D.showLabels;
    }),
    // AI Orchestration State
    aiOrchestration: {
        taskPlan: null,
        planLoading: false,
        explanations: {},
        activeExplanationLevel: 'student',
        error: null,
    },
    setTaskPlan: (plan) => set((state) => {
        state.aiOrchestration.taskPlan = plan;
        state.aiOrchestration.planLoading = false;
    }),
    setTaskPlanLoading: (loading) => set((state) => {
        state.aiOrchestration.planLoading = loading;
    }),
    setExplanations: (explanations) => set((state) => {
        state.aiOrchestration.explanations = explanations;
    }),
    setActiveExplanationLevel: (level) => set((state) => {
        state.aiOrchestration.activeExplanationLevel = level;
    }),
    loadScene3DVisualization: (components) => set((state) => {
        state.scene3D.components = components;
    }),
    setAIError: (error) => set((state) => {
        state.aiOrchestration.error = error;
    }),
    // Automation State
    automation: {
        rules: [],
        preview: null,
        previewLoading: false,
        selectedRuleId: null,
        stats: null,
        recentLogs: [],
        error: null,
    },
    setAutomationRules: (rules) => set((state) => {
        state.automation.rules = rules;
    }),
    setAutomationPreview: (preview) => set((state) => {
        state.automation.preview = preview;
        state.automation.previewLoading = false;
    }),
    setPreviewLoading: (loading) => set((state) => {
        state.automation.previewLoading = loading;
    }),
    selectAutomationRule: (ruleId) => set((state) => {
        state.automation.selectedRuleId = ruleId;
    }),
    setAutomationStats: (stats) => set((state) => {
        state.automation.stats = stats;
    }),
    setAutomationError: (error) => set((state) => {
        state.automation.error = error;
    }),
    clearAutomationPreview: () => set((state) => {
        state.automation.preview = null;
    }),
}), {
    name: 'phase-c-store',
    partialize: (state) => ({
        transient: state.transient,
        comparison: state.comparison,
        sweep: state.sweep,
        scene3D: state.scene3D,
        aiOrchestration: state.aiOrchestration,
        automation: state.automation,
    }),
})));
