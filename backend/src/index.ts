/**
 * A4: Backend Foundation
 * Express API with middleware stack, health endpoints, analysis pipeline
 */

// Load environment variables first - explicit path to ensure it's loaded
import dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
console.log('[Startup] Loading .env from:', envPath);
const dotenvResult = dotenv.config({ path: envPath });
if (dotenvResult.error && (dotenvResult.error as any).code !== 'ENOENT') {
  console.warn('[Startup] Warning: .env config error:', dotenvResult.error);
}
console.log('[Startup] Loaded env vars - DETECTION_STRICT:', process.env.AI_DETECTION_STRICT, 'ALLOW_MOCK:', process.env.AI_ALLOW_MOCK_FALLBACK);

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import multer from 'multer';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import * as fs from 'fs';

// Module imports
import { preprocessImage } from './modules/image-preprocessor.js';
import { cleanupDetections } from './modules/detection-cleanup.js';
import { identifyCircuit, getCircuitDiagnostics } from './modules/circuit-engine.js';
import { generateExplanation, generateSuggestions, generateCaptureGuidance } from './modules/explanations.js';
import {
  detectComponentsInImage,
  buildSimpleReconstruction,
  getDetectionRuntimeInfo,
} from './modules/ai-service.js';
import { simulateCircuit } from './modules/simulation-engine.js';
import { exportToJSON, exportToTXT, exportToMarkdown, exportToHTML, exportToCSV } from './modules/export-engine.js';

// Phase C: Advanced modules
import { simulateTransient, compareCircuits, sweepParameter, generatePlaybackFrames, analyzeStability } from './modules/advanced-simulation.js';
import { initializeScene, applyConfidenceOverlay, updateSceneFromSimulation, serializeScene } from './modules/scene-3d.js';
import { buildAITaskPlan, generateAdaptiveExplanation, executeAITaskPlan, analyzeConfidenceTriggers } from './modules/ai-orchestration.js';
import { DEFAULT_AUTOMATION_RULES, evaluateRuleTriggers, previewAutomationRule, executeAutomationRule, generateAutomationStats } from './modules/automation-engine.js';

// Production: Orchestrator and validation
import { createPipeline } from './modules/analyze-pipeline.js';
import { getComponentRegistry, getCircuitTemplateDB } from './modules/data-registry.js';
import { validateComponentDetectionArray, validateAnalysisResponse } from './modules/schema-validation.js';

// New: Circuit analysis API  
import circuitApiRouter from './routes/circuit-api.js';

// WebSocket
import { initializeWebSocketServer } from './websocket.js';

import type { AnalysisResponse, HealthCheckResponse } from './types/schemas.js';

// Logger setup
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

// Express app
const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Middleware: CORS
app.use(cors());

// Middleware: JSON parsing
app.use(express.json({ limit: '50mb' }));

// Middleware: Request ID and logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || `req_${uuidv4()}`;
  (req as any).requestId = requestId;
  (req as any).logger = logger.child({ requestId });
  next();
});

// Middleware: Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_PER_MIN || '30', 10),
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Middleware: File upload handling
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_UPLOAD_MB || '10', 10) * 1024 * 1024 },
});

// Storage setup
const storageDir = path.resolve(process.env.STORAGE_PATH || './storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

/**
 * POST /api/analyze
 * PRODUCTION-GRADE: Central pipeline with orchestrator
 * 
 * Execution Layers:
 * 1. DETECTION: Image preprocessing → component detection → cleanup
 * 2. IDENTIFICATION: Circuit identification → diagnostics → explanations → reconstruction
 * 3. OPTIONAL: Simulation (if confidence > threshold), 3D scene, automation
 * 
 * Fixes:
 * ✅ Guaranteed sequential execution (no async chaos)
 * ✅ Schema validation on all inputs/outputs
 * ✅ Confidence-based gating for optional modules
 * ✅ Full failure visibility with status tracking
 * ✅ Component registry integration
 */
app.post('/api/analyze', upload.single('image'), async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const log = (req as any).logger;

  try {
    // Validation: Must have image
    if (!req.file) {
      return res.status(400).json({
        requestId,
        statusCode: 'error',
        statusMessage: 'No image file provided',
      });
    }

    log.info({ filename: req.file.originalname }, 'Analysis request received');

    // ========================================================================
    // INITIALIZE PIPELINE
    // ========================================================================
    
    const pipelineConfig = {
      enableSimulation: process.env.ENABLE_SIM === 'true',
      enable3D: process.env.ENABLE_3D === 'true',
      enableAutomation: process.env.ENABLE_AUTOMATION === 'true',
      confidenceThreshold: 0.7, // Disable optional if confidence < 0.7
      maxProcessingTimeMs: 30000,
    };

    const pipeline = createPipeline(requestId, pipelineConfig);
    const componentRegistry = getComponentRegistry();

    // ========================================================================
    // LAYER 1: DETECTION PHASE (Critical)
    // ========================================================================

    log.debug('Starting detection layer...');

    // Step 1: Preprocess image
    const { buffer: processedImage, metadata: imageMetadata } = await preprocessImage(
      req.file.buffer,
      req.file.originalname,
    );

    log.debug({ imageId: imageMetadata.imageId }, 'Image preprocessed');

    // Step 2: Detect components
    const rawDetections = await detectComponentsInImage(processedImage, imageMetadata.imageId);
    const detectionSource = ((rawDetections as any).__source || 'unknown') as
      | 'groq'
      | 'mock'
      | 'unknown';
    log.debug({ count: rawDetections.length }, 'Components detected from AI service');

    // Execute detection layer
    const detectionSuccess = await pipeline.executeDetectionLayer(
      imageMetadata,
      rawDetections,
      cleanupDetections
    );

    if (!detectionSuccess) {
      const response = pipeline.buildResponse();
      fs.writeFileSync(
        path.join(storageDir, `${imageMetadata.imageId}.json`),
        JSON.stringify(response, null, 2)
      );
      log.warn({ detectionSuccess }, 'Detection failed, returning partial response');
      return res.status(400).json(response);
    }

    // Record detections in registry
    const cleanedComponents = (pipeline as any).context.cleanedComponents;
    componentRegistry.recordDetections(imageMetadata.imageId, cleanedComponents);

    // Validate component structure
    const componentsValidation = validateComponentDetectionArray(cleanedComponents);
    if (!componentsValidation.valid) {
      log.error({ errors: componentsValidation.errors }, 'Component validation failed');
      return res.status(400).json({
        requestId,
        statusCode: 'error',
        statusMessage: `Component validation failed: ${componentsValidation.getErrorMessage()}`,
      });
    }

    // ========================================================================
    // LAYER 2: IDENTIFICATION & REASONING PHASE (Core)
    // ========================================================================

    log.debug('Starting identification layer...');

    const identificationSuccess = await pipeline.executeIdentificationLayer(
      identifyCircuit,
      getCircuitDiagnostics,
      generateSuggestions,
      generateExplanation,
      generateCaptureGuidance,
      buildSimpleReconstruction
    );

    if (!identificationSuccess) {
      log.warn({ identificationSuccess }, 'Identification layer had issues');
      // Don't fail - we can still return partial response
    }

    // ========================================================================
    // LAYER 3: OPTIONAL MODULES (with Dependency Gates)
    // ========================================================================

    log.debug('Starting optional layer...');

    await pipeline.executeOptionalLayer(
      (components) => simulateCircuit(components),
      (components, circuit) => {
        try {
          const scene = initializeScene(components, circuit);
          return scene;
        } catch (e) {
          throw new Error(`3D scene initialization failed: ${e}`);
        }
      },
      (circuit, suggestions) => {
        try {
          // Automation module: For now, return basic metadata
          // In Phase D, implement full automation workflow
          return {
            circuitLabel: circuit.label,
            suggestionsCount: suggestions?.length || 0,
            timestamp: new Date().toISOString(),
            status: 'ready_for_automation',
          };
        } catch (e) {
          throw new Error(`Automation status failed: ${e}`);
        }
      }
    );

    // ========================================================================
    // BUILD AND RETURN RESPONSE
    // ========================================================================

    const fullResponse = pipeline.buildResponse() as AnalysisResponse;

    (fullResponse as any).__metadata = {
      ...((fullResponse as any).__metadata || {}),
      detectionSource,
    };

    // Validate response contract
    const responseValidation = validateAnalysisResponse(fullResponse);
    if (!responseValidation.valid) {
      log.error({ errors: responseValidation.errors }, 'Response validation failed');
      // Log but don't fail - return response anyway with warning
      fullResponse.statusMessage = `Response validation warnings: ${responseValidation.getErrorMessage()}`;
    }

    // Persist to storage
    const analysisFile = path.join(storageDir, `${imageMetadata.imageId}.json`);
    fs.writeFileSync(analysisFile, JSON.stringify(fullResponse, null, 2));

    log.info(
      {
        processingTimeMs: fullResponse.processingTimeMs,
        statusCode: fullResponse.statusCode,
        componentCount: fullResponse.components?.length,
        circuit: fullResponse.circuit?.label,
        gatereasons: (fullResponse as any).__metadata?.confidenceGateReasons,
      },
      'Analysis complete'
    );

    res.json(fullResponse);
  } catch (error: any) {
    log.error({ error: error.message, stack: error.stack }, 'Analysis pipeline failed');
    res.status(500).json({
      requestId,
      statusCode: 'error',
      statusMessage: `Pipeline error: ${error.message}`,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  const detectionRuntime = getDetectionRuntimeInfo();

  const health: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modules: {
      api: 'ok',
      preprocessor: 'ok',
      detection: detectionRuntime.apiKeyConfigured ? 'ok' : 'degraded',
      circuitEngine: 'ok',
      explanations: 'ok',
    },
    aiServiceAvailable: detectionRuntime.apiKeyConfigured,
    uptime: process.uptime(),
  };

  res.json(health);
});

/**
 * GET /health/modules
 * Detailed module health
 */
app.get('/health/modules', (req: Request, res: Response) => {
  const detectionRuntime = getDetectionRuntimeInfo();

  const detectionStatus = detectionRuntime.apiKeyConfigured
    ? detectionRuntime.mockFallbackEnabled && !detectionRuntime.strictMode
      ? 'fallback-enabled'
      : 'strict'
    : detectionRuntime.mockFallbackEnabled
      ? 'mock-only'
      : 'unavailable';

  res.json({
    imagePreprocessor: { status: 'ok', version: '1.0' },
    componentDetection: {
      status: detectionStatus,
      backend: detectionRuntime.provider,
      model: detectionRuntime.model,
      strictMode: detectionRuntime.strictMode,
      mockFallbackEnabled: detectionRuntime.mockFallbackEnabled,
      apiKeyConfigured: detectionRuntime.apiKeyConfigured,
    },
    circuitEngine: { status: 'ok', templates: 8 },
    explanationEngine: { status: 'ok', templates: 8 },
    simulationEngine: { status: process.env.ENABLE_SIM === 'true' ? 'enabled' : 'disabled' },
  });
});

/**
 * GET /api/results/:id
 * Retrieve previous analysis
 */
app.get('/api/results/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(storageDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/history
 * List recent analyses
 */
app.get('/api/history', (req: Request, res: Response) => {
  try {
    const files = fs
      .readdirSync(storageDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 50); // Last 50

    const history = files.map((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(storageDir, f), 'utf-8'));
      return {
        id: f.replace('.json', ''),
        timestamp: data.timestamp,
        circuitLabel: data.circuit.label,
        componentCount: data.components.length,
      };
    });

    res.json({ history, count: history.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/export/:id
 * Export analysis to multiple formats
 */
app.post('/api/export/:id', (req: Request, res: Response) => {
  try {
    const { format = 'json' } = req.body;
    const filePath = path.join(storageDir, `${req.params.id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis: AnalysisResponse = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    let content: string;
    let contentType: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'txt':
      case 'text':
        content = exportToTXT(analysis);
        contentType = 'text/plain';
        filename = `analysis-${req.params.id}.txt`;
        break;

      case 'markdown':
      case 'md':
        content = exportToMarkdown(analysis);
        contentType = 'text/markdown';
        filename = `analysis-${req.params.id}.md`;
        break;

      case 'html':
        content = exportToHTML(analysis);
        contentType = 'text/html';
        filename = `analysis-${req.params.id}.html`;
        break;

      case 'csv':
        content = exportToCSV(analysis);
        contentType = 'text/csv';
        filename = `components-${req.params.id}.csv`;
        break;

      case 'json':
      default:
        content = exportToJSON(analysis);
        contentType = 'application/json';
        filename = `analysis-${req.params.id}.json`;
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/:id/:format
 * Export analysis to specific format (GET alternative)
 */
app.get('/api/export/:id/:format', (req: Request, res: Response) => {
  try {
    const { id, format } = req.params;
    const filePath = path.join(storageDir, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis: AnalysisResponse = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    let content: string;
    let contentType: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'txt':
      case 'text':
        content = exportToTXT(analysis);
        contentType = 'text/plain';
        filename = `analysis-${id}.txt`;
        break;

      case 'markdown':
      case 'md':
        content = exportToMarkdown(analysis);
        contentType = 'text/markdown';
        filename = `analysis-${id}.md`;
        break;

      case 'html':
        content = exportToHTML(analysis);
        contentType = 'text/html';
        filename = `analysis-${id}.html`;
        break;

      case 'csv':
        content = exportToCSV(analysis);
        contentType = 'text/csv';
        filename = `components-${id}.csv`;
        break;

      case 'json':
      default:
        content = exportToJSON(analysis);
        contentType = 'application/json';
        filename = `analysis-${id}.json`;
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * C1: Advanced Simulation Endpoints
 */

/**
 * POST /api/advanced-sim/transient/:id
 * Transient response simulation (RC charging, etc.)
 */
app.post('/api/advanced-sim/transient/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(storageDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis: AnalysisResponse = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const { duration = 1000, powerVoltage = 5 } = req.body;

    const transientResponse = simulateTransient(analysis.components, duration, powerVoltage);

    res.json({
      requestId: analysis.requestId,
      type: 'transient_response',
      duration,
      powerVoltage,
      frameCount: transientResponse.length,
      frames: transientResponse,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-sim/compare
 * Compare two circuit configurations
 */
app.post('/api/advanced-sim/compare', (req: Request, res: Response) => {
  try {
    const { originalId, modifiedId, powerVoltage = 5 } = req.body;

    const origPath = path.join(storageDir, `${originalId}.json`);
    const modPath = path.join(storageDir, `${modifiedId}.json`);

    if (!fs.existsSync(origPath) || !fs.existsSync(modPath)) {
      return res.status(404).json({ error: 'One or both analyses not found' });
    }

    const original = JSON.parse(fs.readFileSync(origPath, 'utf-8'));
    const modified = JSON.parse(fs.readFileSync(modPath, 'utf-8'));

    const comparison = compareCircuits(
      { components: original.components, circuit: original.circuit },
      { components: modified.components, circuit: modified.circuit },
      powerVoltage,
    );

    res.json({
      type: 'circuit_comparison',
      timestamp: new Date().toISOString(),
      ...comparison,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-sim/sweep/:id
 * Parameter sweep analysis
 */
app.post('/api/advanced-sim/sweep/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(storageDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis: AnalysisResponse = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const {
      componentId,
      variable = 'resistance',
      startValue = 100,
      endValue = 10000,
      stepCount = 10,
      powerVoltage = 5,
    } = req.body;

    const sweepResult = sweepParameter(
      analysis.components,
      componentId,
      variable,
      startValue,
      endValue,
      stepCount,
      powerVoltage,
    );

    res.json({
      requestId: analysis.requestId,
      type: 'parameter_sweep',
      ...sweepResult,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-sim/playback/:id
 * Generate playback frames for timeline animation
 */
app.post('/api/advanced-sim/playback/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(storageDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis: AnalysisResponse = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const { duration = 1000, frameCount = 20, powerVoltage = 5 } = req.body;

    const frames = generatePlaybackFrames(analysis.components, duration, powerVoltage);

    res.json({
      requestId: analysis.requestId,
      type: 'playback_timeline',
      frameCount: frames.length,
      frames: frames.slice(0, frameCount),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-sim/stability/:id
 * Stability and margin analysis
 */
app.post('/api/advanced-sim/stability/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(storageDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis: AnalysisResponse = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const { powerVoltage = 5 } = req.body;

    const stability = analyzeStability(analysis.components, powerVoltage);

    res.json({
      requestId: analysis.requestId,
      type: 'stability_analysis',
      ...stability,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * C2: 3D Scene Endpoints
 */

/**
 * POST /api/scene-3d/init/:id
 * Initialize 3D scene for circuit
 */
app.post('/api/scene-3d/init/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(storageDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis: AnalysisResponse = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const { width = 1024, height = 768, layout = 'circular' } = req.body;

    const scene = initializeScene(analysis.components, analysis.circuit, width, height);

    res.json({
      type: '3d_scene',
      sceneId: scene.sceneId,
      componentCount: scene.components.length,
      edgeCount: scene.edges.length,
      scene,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scene-3d/confidence-overlay/:id
 * Apply confidence visualization overlay
 */
app.post('/api/scene-3d/confidence-overlay/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(storageDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis: AnalysisResponse = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const { width = 1024, height = 768 } = req.body;

    const scene = initializeScene(analysis.components, analysis.circuit, width, height);

    const confidenceMap = new Map(
      analysis.components.map((c) => [c.id, c.confidence]),
    );
    const overlays = applyConfidenceOverlay(scene, confidenceMap);

    res.json({
      type: 'confidence_overlay',
      sceneId: scene.sceneId,
      overlayCount: overlays.length,
      overlays,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * C3: AI Orchestration Endpoints
 */

/**
 * POST /api/ai-orchestration/plan/:id
 * Build selective AI task plan
 */
app.post('/api/ai-orchestration/plan/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(storageDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis: AnalysisResponse = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const analysisQuality = Math.min(...analysis.components.map((c) => c.confidence));

    const plan = buildAITaskPlan(analysis.requestId, analysis.components, analysis.circuit, analysisQuality);

    res.json({
      type: 'ai_task_plan',
      ...plan,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai-orchestration/adaptive-explanation/:id
 * Generate explanation adapted to user expertise level
 */
app.post('/api/ai-orchestration/adaptive-explanation/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(storageDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis: AnalysisResponse = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const { level = 'student' } = req.body;

    const explanation = generateAdaptiveExplanation(
      analysis.requestId,
      analysis.circuit,
      analysis.components,
      analysis.explanation.student,
      level,
    );

    res.json({
      type: 'adaptive_explanation',
      ...explanation,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * C4: Automation Engine Endpoints
 */

/**
 * GET /api/automation/rules
 * List available automation rules
 */
app.get('/api/automation/rules', (req: Request, res: Response) => {
  try {
    res.json({
      type: 'automation_rules_list',
      ruleCount: DEFAULT_AUTOMATION_RULES.length,
      rules: DEFAULT_AUTOMATION_RULES.map((r) => ({
        ruleId: r.ruleId,
        name: r.name,
        enabled: r.enabled,
        priority: r.priority,
        triggerCount: r.triggers.length,
        actionCount: r.actions.length,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/automation/preview/:id
 * Preview automation execution (dry-run)
 */
app.post('/api/automation/preview/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(storageDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis: AnalysisResponse = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const { ruleId } = req.body;

    const rule = DEFAULT_AUTOMATION_RULES.find((r) => r.ruleId === ruleId);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const analysisMetrics = {
      hasPolarityErrors: analysis.warnings.some((w) => w.code === 'POLARITY_ERROR'),
      hasOpenCircuit: analysis.warnings.some((w) => w.code === 'OPEN_CIRCUIT'),
      hasShortCircuit: analysis.warnings.some((w) => w.code === 'SHORT_CIRCUIT'),
      totalPower: 100, // placeholder
      lowestConfidence: Math.min(...analysis.components.map((c) => c.confidence)),
      unknownComponents: analysis.components.filter((c) => c.unknown).length,
    };

    const preview = previewAutomationRule(rule, analysis.components, analysis.circuit, analysisMetrics);

    res.json({
      type: 'automation_preview',
      ...preview,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/automation/stats
 * Get automation statistics
 */
app.post('/api/automation/stats', (req: Request, res: Response) => {
  try {
    // Load all logs from storage (simplified version)
    const automationLogs: any[] = [];

    const stats = generateAutomationStats(automationLogs);

    res.json({
      type: 'automation_statistics',
      ...stats,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 404 handler
 */
app.use('/api/circuit', circuitApiRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Start server
 */
if (process.env.NODE_ENV !== 'test') {
  const httpServer = http.createServer(app);
  const { wss } = initializeWebSocketServer(httpServer);

  httpServer.listen(port, () => {
    logger.info({ port }, 'Synthra backend server started');
    logger.info({ apiUrl: `http://localhost:${port}` }, 'API ready');
    logger.info({ wsUrl: `ws://localhost:${port}` }, 'WebSocket ready');
  });
}

export default app;
