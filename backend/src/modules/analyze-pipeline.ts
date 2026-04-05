/**
 * ORCHESTRATOR - Central Analysis Pipeline
 * 
 * Ensures guaranteed sequential execution:
 * Layer 1: Detection → Layer 2: Identification → Layer 3: Optional Modules (3D, Sim, Automation)
 * 
 * Features:
 * - Strict schema validation on all inputs/outputs
 * - Confidence-based gating (disable 3D/sim if confidence < threshold)
 * - Status tracking at each stage
 * - No parallel execution chaos
 */

import pino from 'pino';
import type { 
  ImagePayload, 
  ComponentDetection, 
  CircuitIdentification, 
  AnalysisResponse 
} from '../types/schemas.js';

const logger = pino();

// ============================================================================
// Type Definitions for Pipeline
// ============================================================================

export interface PipelineConfig {
  enableSimulation: boolean;
  enable3D: boolean;
  enableAutomation: boolean;
  confidenceThreshold: number; // disable optional modules if below this
  maxProcessingTimeMs: number;
}

export interface ExecutionStage {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  durationMs?: number;
  error?: string;
}

export interface PipelineExecutionContext {
  requestId: string;
  startTime: number;
  stages: Map<string, ExecutionStage>;
  config: PipelineConfig;
  
  // Layer 1: Detection
  imagePayload?: ImagePayload;
  rawDetections?: any[];
  cleanedComponents?: ComponentDetection[];
  
  // Layer 2: Identification & Analysis
  circuitIdentification?: CircuitIdentification;
  explanation?: any;
  diagnostics?: any[];
  suggestions?: any[];
  guidance?: any;
  reconstruction?: any;
  
  // Layer 3: Optional Modules
  simulation?: any;
  scene3D?: any;
  automation?: any;
  
  // Metadata
  gateReasons?: string[];
  statusCode: 'ok' | 'partial' | 'error';
  statusMessage: string;
}

// ============================================================================
// Pipeline Execution Engine
// ============================================================================

export class AnalysisPipeline {
  private config: PipelineConfig;
  private context: PipelineExecutionContext;

  constructor(requestId: string, config: Partial<PipelineConfig> = {}) {
    this.config = {
      enableSimulation: config.enableSimulation ?? true,
      enable3D: config.enable3D ?? true,
      enableAutomation: config.enableAutomation ?? true,
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      maxProcessingTimeMs: config.maxProcessingTimeMs ?? 30000,
    };

    this.context = {
      requestId,
      startTime: Date.now(),
      stages: new Map(),
      config: this.config,
      gateReasons: [],
      statusCode: 'ok',
      statusMessage: 'Analysis initialized',
    };
  }

  // ========================================================================
  // Layer 1: Detection Phase (CRITICAL)
  // ========================================================================

  async executeDetectionLayer(
    imagePayload: ImagePayload,
    rawDetections: ComponentDetection[],
    cleanupFn: (detections: any[]) => ComponentDetection[],
  ): Promise<boolean> {
    const stageName = 'detection';
    this.recordStageStart(stageName);

    try {
      // Validate inputs
      if (!imagePayload || !imagePayload.imageId) {
        throw new Error('Invalid image payload: missing imageId');
      }

      if (!Array.isArray(rawDetections)) {
        throw new Error('Invalid raw detections: must be array');
      }

      this.context.imagePayload = imagePayload;
      this.context.rawDetections = rawDetections;

      // Cleanup and normalize components
      const cleaned = cleanupFn(rawDetections);

      if (!Array.isArray(cleaned)) {
        throw new Error('Cleanup function must return array');
      }

      // Validate cleaned components
      for (const comp of cleaned) {
        if (!comp.id || !comp.canonicalLabel || comp.confidence === undefined) {
          throw new Error(`Invalid component structure: missing required fields`);
        }
      }

      this.context.cleanedComponents = cleaned;

      logger.debug(
        { requestId: this.context.requestId, componentCount: cleaned.length },
        'Detection layer complete'
      );

      this.recordStageSuccess(stageName);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.recordStageFailure(stageName, message);
      this.context.statusCode = 'error';
      this.context.statusMessage = `Detection failed: ${message}`;
      return false;
    }
  }

  // ========================================================================
  // Layer 2: Identification & Reasoning Phase (CORE)
  // ========================================================================

  async executeIdentificationLayer(
    identifyFn: (components: ComponentDetection[]) => CircuitIdentification,
    diagnosticsFn: (components: ComponentDetection[], circuit: CircuitIdentification) => any[],
    suggestionsFn: (components: ComponentDetection[], circuit: CircuitIdentification, diags: any[]) => any[],
    explanationFn: (circuit: CircuitIdentification) => any,
    guidanceFn: (components: ComponentDetection[], quality: any) => any,
    reconstructionFn: (components: ComponentDetection[]) => any,
  ): Promise<boolean> {
    const stageName = 'identification';
    this.recordStageStart(stageName);

    try {
      if (!this.context.cleanedComponents) {
        throw new Error('No cleaned components available - detection layer must run first');
      }

      // Identify circuit
      const circuit = identifyFn(this.context.cleanedComponents);

      if (!circuit || !circuit.label || circuit.confidence === undefined) {
        throw new Error('Invalid circuit identification result');
      }

      this.context.circuitIdentification = circuit;

      // Generate diagnostics
      const diags = diagnosticsFn(this.context.cleanedComponents, circuit);
      if (!Array.isArray(diags)) {
        throw new Error('Diagnostics function must return array');
      }
      this.context.diagnostics = diags;

      // Generate suggestions
      const sugg = suggestionsFn(this.context.cleanedComponents, circuit, diags);
      if (!Array.isArray(sugg)) {
        throw new Error('Suggestions function must return array');
      }
      this.context.suggestions = sugg;

      // Generate explanation
      const expl = explanationFn(circuit);
      if (!expl || !expl.short || !expl.student || !expl.engineer) {
        throw new Error('Invalid explanation structure');
      }
      this.context.explanation = expl;

      // Generate guidance
      const guid = guidanceFn(this.context.cleanedComponents, this.context.imagePayload?.quality);
      if (!guid) {
        throw new Error('Guidance function must return object');
      }
      this.context.guidance = guid;

      // Build reconstruction
      const recon = reconstructionFn(this.context.cleanedComponents);
      if (recon && (!recon.nodes || !recon.edges)) {
        throw new Error('Invalid reconstruction structure');
      }
      this.context.reconstruction = recon;

      logger.debug(
        {
          requestId: this.context.requestId,
          circuit: circuit.label,
          confidence: circuit.confidence,
          diagnosticCount: diags.length,
        },
        'Identification layer complete'
      );

      this.recordStageSuccess(stageName);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.recordStageFailure(stageName, message);
      this.context.statusCode = 'partial';
      this.context.statusMessage = `Identification partially failed: ${message}`;
      return false;
    }
  }

  // ========================================================================
  // Layer 3: Optional Modules (with Dependency Gates)
  // ========================================================================

  async executeOptionalLayer(
    simulationFn?: (components: ComponentDetection[]) => any,
    scene3DFn?: (components: ComponentDetection[], circuit: CircuitIdentification) => any,
    automationFn?: (circuit: CircuitIdentification, suggestions: any[]) => any,
  ): Promise<void> {
    try {
      if (!this.context.circuitIdentification) {
        logger.warn(
          { requestId: this.context.requestId },
          'Skipping optional layer: no circuit identification'
        );
        return;
      }

      const confidence = this.context.circuitIdentification.confidence;
      const enoughComponents = (this.context.cleanedComponents?.length ?? 0) > 0;

      // ====== GATE 1: Confidence Threshold ======
      if (confidence < this.config.confidenceThreshold) {
        this.context.gateReasons?.push(
          `Circuit confidence ${confidence.toFixed(2)} < threshold ${this.config.confidenceThreshold}`
        );
        logger.info(
          { requestId: this.context.requestId, confidence, threshold: this.config.confidenceThreshold },
          'Skipping optional modules: low confidence'
        );
        return;
      }

      // ====== GATE 2: Component Count ======
      if (!enoughComponents) {
        this.context.gateReasons?.push('No components detected');
        logger.info(
          { requestId: this.context.requestId },
          'Skipping optional modules: insufficient components'
        );
        return;
      }

      // ====== Module 3.1: Simulation ======
      if (this.config.enableSimulation && simulationFn) {
        const stageName = 'simulation';
        this.recordStageStart(stageName);
        try {
          const sim = simulationFn(this.context.cleanedComponents!);
          if (!sim) throw new Error('Simulation returned null');
          this.context.simulation = sim;
          this.recordStageSuccess(stageName);
          logger.debug(
            { requestId: this.context.requestId },
            'Simulation module complete'
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.recordStageFailure(stageName, message);
          logger.warn(
            { requestId: this.context.requestId, error: message },
            'Simulation module failed'
          );
          // Don't fail overall pipeline - optional module
        }
      }

      // ====== Module 3.2: 3D Scene ======
      if (this.config.enable3D && scene3DFn) {
        const stageName = '3d_scene';
        this.recordStageStart(stageName);
        try {
          const scene = scene3DFn(this.context.cleanedComponents!, this.context.circuitIdentification!);
          if (!scene) throw new Error('3D scene returned null');
          this.context.scene3D = scene;
          this.recordStageSuccess(stageName);
          logger.debug(
            { requestId: this.context.requestId },
            '3D scene module complete'
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.recordStageFailure(stageName, message);
          logger.warn(
            { requestId: this.context.requestId, error: message },
            '3D scene module failed'
          );
          // Don't fail overall pipeline - optional module
        }
      }

      // ====== Module 3.3: Automation ======
      if (this.config.enableAutomation && automationFn) {
        const stageName = 'automation';
        this.recordStageStart(stageName);
        try {
          const auto = automationFn(this.context.circuitIdentification!, this.context.suggestions || []);
          if (!auto) throw new Error('Automation returned null');
          this.context.automation = auto;
          this.recordStageSuccess(stageName);
          logger.debug(
            { requestId: this.context.requestId },
            'Automation module complete'
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.recordStageFailure(stageName, message);
          logger.warn(
            { requestId: this.context.requestId, error: message },
            'Automation module failed'
          );
          // Don't fail overall pipeline - optional module
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { requestId: this.context.requestId, error: message },
        'Optional layer execution error'
      );
      // Don't fail overall - optional modules failing is non-critical
    }
  }

  // ========================================================================
  // Response Assembly
  // ========================================================================

  buildResponse(): Partial<AnalysisResponse> & { __metadata?: any } {
    const processingTimeMs = Date.now() - this.context.startTime;
    const hasComponents = (this.context.cleanedComponents?.length ?? 0) > 0;
    const hasCircuit = !!this.context.circuitIdentification;

    let finalStatusCode = this.context.statusCode;
    let finalStatusMessage = this.context.statusMessage;

    if (finalStatusCode === 'ok' && !hasComponents) {
      finalStatusCode = 'partial';
      finalStatusMessage = 'No components detected';
    } else if (finalStatusCode === 'ok' && finalStatusMessage === 'Analysis initialized') {
      finalStatusMessage = hasCircuit ? 'Analysis complete' : 'Partial analysis complete';
    }

    return {
      requestId: this.context.requestId,
      timestamp: new Date().toISOString(),
      image: this.context.imagePayload,
      components: this.context.cleanedComponents,
      circuit: this.context.circuitIdentification,
      explanation: this.context.explanation,
      warnings: this.context.diagnostics,
      suggestions: this.context.suggestions,
      guidance: this.context.guidance,
      reconstruction: this.context.reconstruction,
      simulation: this.context.simulation || null,
      statusCode: finalStatusCode,
      statusMessage: finalStatusMessage,
      processingTimeMs,
      
      // Extended metadata (optional)
      __metadata: {
        executionStages: Array.from(this.context.stages.entries()).map(([stageName, stage]) => ({
          name: stageName,
          status: stage.status,
          durationMs: stage.durationMs,
          error: stage.error,
        })),
        confidenceGateReasons: this.context.gateReasons,
        optionalModulesEnabled: {
          simulation: this.config.enableSimulation,
          '3d': this.config.enable3D,
          automation: this.config.enableAutomation,
        },
      },
    };
  }

  // ========================================================================
  // Execution Tracking
  // ========================================================================

  private recordStageStart(stageName: string): void {
    this.context.stages.set(stageName, {
      name: stageName,
      status: 'running',
      startTime: Date.now(),
    });
  }

  private recordStageSuccess(stageName: string): void {
    const stage = this.context.stages.get(stageName);
    if (stage && stage.startTime) {
      stage.status = 'success';
      stage.endTime = Date.now();
      stage.durationMs = stage.endTime - stage.startTime;
    }
  }

  private recordStageFailure(stageName: string, error: string): void {
    const stage = this.context.stages.get(stageName);
    if (stage && stage.startTime) {
      stage.status = 'failed';
      stage.endTime = Date.now();
      stage.durationMs = stage.endTime - stage.startTime;
      stage.error = error;
    }
  }

  getExecutionContext(): PipelineExecutionContext {
    return this.context;
  }
}

// ============================================================================
// Helper: Create pipeline with all module functions
// ============================================================================

export function createPipeline(
  requestId: string,
  config?: Partial<PipelineConfig>
): AnalysisPipeline {
  return new AnalysisPipeline(requestId, config);
}
