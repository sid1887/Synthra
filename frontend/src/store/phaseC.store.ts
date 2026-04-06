/**
 * Phase C: Advanced Layer State Management
 * Zustand store for transient analysis, 3D scenes, AI orchestration, automation
 * Deep state management with comprehensive feature support
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type SetState = any;

/**
 * Transient Analysis State
 */
export interface TransientResponse {
  timeMs: number;
  components: Array<{
    componentId: string;
    voltage: number;
    current: number;
    power: number;
    status: string;
  }>;
}

export interface TransientAnalysisState {
  frames: TransientResponse[];
  isLoading: boolean;
  error: string | null;
  totalDuration: number;
  powerVoltage: number;
  currentFrameIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  selectedComponentId: string | null;
}

/**
 * Circuit Comparison State
 */
export interface CircuitDifference {
  componentId: string;
  originalValue: string;
  modifiedValue: string;
  voltageChange: number;
  currentChange: number;
  powerChange: number;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComparisonState {
  originalId: string | null;
  modifiedId: string | null;
  differences: CircuitDifference[];
  verdict: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Parameter Sweep State
 */
export interface SweepResult {
  parameterValue: number;
  totalPower: number;
  maxVoltage: number;
  maxCurrent: number;
  statusOK: boolean;
  notes: string;
}

export interface ParameterSweepState {
  componentId: string | null;
  variable: 'resistance' | 'capacitance' | 'voltage' | null;
  startValue: number;
  endValue: number;
  results: SweepResult[];
  optimalPoint: { value: number; metric: string } | null;
  isLoading: boolean;
  error: string | null;
  selectedResultIndex: number;
}

/**
 * 3D Scene State
 */
export interface Scene3DState {
  sceneId: string | null;
  components: any[];
  edges: any[];
  camera: { position: { x: number; y: number; z: number }; fov: number } | null;
  lighting: { ambientIntensity: number; directionalIntensity: number } | null;
  isLoading: boolean;
  error: string | null;
  isAutoRotating: boolean;
  visualizationMode: 'standard' | 'confidence' | 'simulation' | 'wiring';
  selectedComponentId: string | null;
  zoomLevel: number;
  showWires: boolean;
  showLabels: boolean;
}

/**
 * AI Orchestration State
 */
export interface AITaskPlan {
  tasks: Array<{
    taskType: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    rationale: string;
    estimatedBenefit: number;
    timeoutMs: number;
  }>;
  estimatedTokens: number;
  estimatedCostUSD: number;
  totalTimeMs: number;
}

export interface AdaptiveExplanationState {
  level: 'beginner' | 'student' | 'engineer' | 'expert';
  explanation: string;
  keyPoints: string[];
  technicalTerms: Array<{ term: string; definition: string }>;
  relatedConcepts: string[];
  confidenceLevel: number;
  source: 'rule-based' | 'ai-generated' | 'hybrid';
}

export interface AIOrchestrationState {
  taskPlan: AITaskPlan | null;
  planLoading: boolean;
  explanations: Record<string, AdaptiveExplanationState>;
  activeExplanationLevel: 'beginner' | 'student' | 'engineer' | 'expert';
  error: string | null;
}

/**
 * Automation State
 */
export interface AutomationRule {
  ruleId: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: string[];
  actions: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface AutomationPreview {
  ruleId: string;
  wouldTrigger: boolean;
  matchedTriggers: string[];
  plannedActions: Array<{ action: string; description: string; estimatedImpact: string }>;
  riskLevel: 'safe' | 'cautious' | 'risky';
  recommendations: string[];
}

export interface AutomationState {
  rules: AutomationRule[];
  preview: AutomationPreview | null;
  previewLoading: boolean;
  selectedRuleId: string | null;
  stats: {
    totalRulesEnabled: number;
    rulesExecutedToday: number;
    successRate: number;
  } | null;
  recentLogs: any[];
  error: string | null;
}

/**
 * Complete Phase C Store Interface
 */
export interface PhaseCStore {
  // Transient Analysis
  transient: TransientAnalysisState;
  setTransientFrames: (frames: TransientResponse[], duration: number, voltage: number) => void;
  setTransientLoading: (loading: boolean) => void;
  setTransientError: (error: string | null) => void;
  playTransient: () => void;
  pauseTransient: () => void;
  setPlaybackFrame: (index: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  nextFrame: () => void;
  prevFrame: () => void;
  selectTransientComponent: (componentId: string | null) => void;

  // Circuit Comparison
  comparison: ComparisonState;
  setComparisonData: (originalId: string, modifiedId: string, differences: CircuitDifference[], verdict: string) => void;
  setComparisonLoading: (loading: boolean) => void;
  setComparisonError: (error: string | null) => void;
  clearComparison: () => void;

  // Parameter Sweep
  sweep: ParameterSweepState;
  setSweepResults: (
    componentId: string,
    variable: string,
    startValue: number,
    endValue: number,
    results: SweepResult[],
    optimal: any
  ) => void;
  setSweepLoading: (loading: boolean) => void;
  setSweepError: (error: string | null) => void;
  selectSweepResult: (index: number) => void;
  clearSweep: () => void;

  // 3D Scene
  scene3D: Scene3DState;
  initializeScene: (sceneData: any) => void;
  setSceneLoading: (loading: boolean) => void;
  setSceneError: (error: string | null) => void;
  toggleAutoRotate: () => void;
  setVisualizationMode: (mode: 'standard' | 'confidence' | 'simulation' | 'wiring') => void;
  selectSceneComponent: (componentId: string | null) => void;
  setZoomLevel: (zoom: number) => void;
  toggleWires: () => void;
  toggleLabels: () => void;

  // AI Orchestration
  aiOrchestration: AIOrchestrationState;
  setTaskPlan: (plan: AITaskPlan) => void;
  setTaskPlanLoading: (loading: boolean) => void;
  setExplanations: (explanations: Record<string, AdaptiveExplanationState>) => void;
  setActiveExplanationLevel: (level: 'beginner' | 'student' | 'engineer' | 'expert') => void;
  setAIError: (error: string | null) => void;

  // Automation
  automation: AutomationState;
  setAutomationRules: (rules: AutomationRule[]) => void;
  setAutomationPreview: (preview: AutomationPreview) => void;
  setPreviewLoading: (loading: boolean) => void;
  selectAutomationRule: (ruleId: string | null) => void;
  setAutomationStats: (stats: any) => void;
  setAutomationError: (error: string | null) => void;
  clearAutomationPreview: () => void;
}

/**
 * Create Zustand store with middleware
 */
export const usePhaseCStore = create<PhaseCStore>()(
  devtools(
    persist(
      (set: any, get: any) => ({
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

        setTransientFrames: (frames, duration, voltage) =>
          set((state) => {
            state.transient.frames = frames;
            state.transient.totalDuration = duration;
            state.transient.powerVoltage = voltage;
            state.transient.currentFrameIndex = 0;
            state.transient.isPlaying = false;
          }),

        setTransientLoading: (loading) =>
          set((state) => {
            state.transient.isLoading = loading;
          }),

        setTransientError: (error) =>
          set((state) => {
            state.transient.error = error;
          }),

        playTransient: () =>
          set((state) => {
            state.transient.isPlaying = true;
          }),

        pauseTransient: () =>
          set((state) => {
            state.transient.isPlaying = false;
          }),

        setPlaybackFrame: (index) =>
          set((state) => {
            const maxIndex = get().transient.frames.length - 1;
            state.transient.currentFrameIndex = Math.max(0, Math.min(index, maxIndex));
          }),

        setPlaybackSpeed: (speed) =>
          set((state) => {
            state.transient.playbackSpeed = Math.max(0.25, Math.min(4, speed));
          }),

        nextFrame: () =>
          set((state) => {
            const maxIndex = get().transient.frames.length - 1;
            state.transient.currentFrameIndex = Math.min(state.transient.currentFrameIndex + 1, maxIndex);
          }),

        prevFrame: () =>
          set((state) => {
            state.transient.currentFrameIndex = Math.max(state.transient.currentFrameIndex - 1, 0);
          }),

        selectTransientComponent: (componentId) =>
          set((state) => {
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

        setComparisonData: (originalId, modifiedId, differences, verdict) =>
          set((state) => {
            state.comparison.originalId = originalId;
            state.comparison.modifiedId = modifiedId;
            state.comparison.differences = differences;
            state.comparison.verdict = verdict;
            state.comparison.isLoading = false;
          }),

        setComparisonLoading: (loading) =>
          set((state) => {
            state.comparison.isLoading = loading;
          }),

        setComparisonError: (error) =>
          set((state) => {
            state.comparison.error = error;
          }),

        clearComparison: () =>
          set((state) => {
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

        setSweepResults: (componentId, variable, startValue, endValue, results, optimal) =>
          set((state) => {
            state.sweep.componentId = componentId;
            state.sweep.variable = variable as any;
            state.sweep.startValue = startValue;
            state.sweep.endValue = endValue;
            state.sweep.results = results;
            state.sweep.optimalPoint = optimal;
            state.sweep.isLoading = false;
            state.sweep.selectedResultIndex = 0;
          }),

        setSweepLoading: (loading) =>
          set((state) => {
            state.sweep.isLoading = loading;
          }),

        setSweepError: (error) =>
          set((state) => {
            state.sweep.error = error;
          }),

        selectSweepResult: (index) =>
          set((state) => {
            state.sweep.selectedResultIndex = Math.max(0, Math.min(index, state.sweep.results.length - 1));
          }),

        clearSweep: () =>
          set((state) => {
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

        initializeScene: (sceneData) =>
          set((state) => {
            state.scene3D.sceneId = sceneData.sceneId;
            state.scene3D.components = sceneData.components;
            state.scene3D.edges = sceneData.edges;
            state.scene3D.camera = sceneData.camera;
            state.scene3D.lighting = sceneData.lighting;
            state.scene3D.isLoading = false;
          }),

        setSceneLoading: (loading) =>
          set((state) => {
            state.scene3D.isLoading = loading;
          }),

        setSceneError: (error) =>
          set((state) => {
            state.scene3D.error = error;
          }),

        toggleAutoRotate: () =>
          set((state) => {
            state.scene3D.isAutoRotating = !state.scene3D.isAutoRotating;
          }),

        setVisualizationMode: (mode) =>
          set((state) => {
            state.scene3D.visualizationMode = mode;
          }),

        selectSceneComponent: (componentId) =>
          set((state) => {
            state.scene3D.selectedComponentId = componentId;
          }),

        setZoomLevel: (zoom) =>
          set((state) => {
            state.scene3D.zoomLevel = Math.max(0.1, Math.min(5, zoom));
          }),

        toggleWires: () =>
          set((state) => {
            state.scene3D.showWires = !state.scene3D.showWires;
          }),

        toggleLabels: () =>
          set((state) => {
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

        setTaskPlan: (plan) =>
          set((state) => {
            state.aiOrchestration.taskPlan = plan;
            state.aiOrchestration.planLoading = false;
          }),

        setTaskPlanLoading: (loading) =>
          set((state) => {
            state.aiOrchestration.planLoading = loading;
          }),

        setExplanations: (explanations) =>
          set((state) => {
            state.aiOrchestration.explanations = explanations;
          }),

        setActiveExplanationLevel: (level) =>
          set((state) => {
            state.aiOrchestration.activeExplanationLevel = level;
          }),

        loadScene3DVisualization: (components: any) =>
          set((state: any) => {
            state.scene3D.components = components;
          }),

        setAIError: (error) =>
          set((state) => {
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

        setAutomationRules: (rules: any) =>
          set((state: any) => {
            state.automation.rules = rules;
          }),

        setAutomationPreview: (preview: any) =>
          set((state: any) => {
            state.automation.preview = preview;
            state.automation.previewLoading = false;
          }),

        setPreviewLoading: (loading: any) =>
          set((state: any) => {
            state.automation.previewLoading = loading;
          }),

        selectAutomationRule: (ruleId: any) =>
          set((state: any) => {
            state.automation.selectedRuleId = ruleId;
          }),

        setAutomationStats: (stats: any) =>
          set((state: any) => {
            state.automation.stats = stats;
          }),

        setAutomationError: (error: any) =>
          set((state: any) => {
            state.automation.error = error;
          }),

        clearAutomationPreview: () =>
          set((state: any) => {
            state.automation.preview = null;
          }),
      }),
      {
        name: 'phase-c-store',
        partialize: (state) => ({
          transient: state.transient,
          comparison: state.comparison,
          sweep: state.sweep,
          scene3D: state.scene3D,
          aiOrchestration: state.aiOrchestration,
          automation: state.automation,
        }),
      }
    )
  )
);
