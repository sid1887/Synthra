/**
 * Circuit Analysis API Routes
 * Main entry point for ML detection, analysis, and simulation
 */

import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import path from 'path';

import { getDetectionEngine } from '../modules/ml-detection';
import CircuitAnalysisEngine, { AnalysisResult } from '../modules/circuit-analysis';
import CircuitSimulator from '../modules/circuit-simulator';
import { getComponent } from '../models/components';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * POST /api/circuit/analyze
 * Upload image and analyze circuit
 */
router.post('/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const analysisId = uuid();
    const startTime = Date.now();

    console.log(`[API] Starting analysis: ${analysisId}`);

    // Run ML detection
    const detectionEngine = await getDetectionEngine();
    const detections = await detectionEngine.detect(req.file.buffer);

    console.log(`[API] Detection complete: ${detections.length} components`);

    // Analyze circuit
    const analysis = CircuitAnalysisEngine.analyzeDetections(detections);

    // Get suggested component values
    const suggestedValues = CircuitSimulator.recommendLEDResistor(5); // Default 5V

    // Simulate circuit (simple series case)
    const components = analysis.components.map((c, idx) => ({
      id: `comp-${idx}`,
      type: c.component.id as any,
      value: c.component.id === 'battery' ? 5 : c.component.specs.resistance?.min || 1,
    }));

    const simulation = CircuitSimulator.simulateSeriesCircuit(5, components);

    const totalTime = Date.now() - startTime;

    res.json({
      success: true,
      analysisId,
      timestamp: new Date().toISOString(),
      processingTime: `${totalTime}ms`,
      detections: {
        count: detections.length,
        items: detections,
      },
      analysis: {
        circuitType: analysis.circuitType,
        components: analysis.components.map((c) => ({
          name: c.component.name,
          category: c.component.category,
          count: c.count,
          specs: c.component.specs,
        })),
        issues: analysis.issues,
        suggestions: analysis.suggestions,
        explanation: analysis.explanation,
      },
      simulation: {
        ...simulation,
        summary: `Series circuit analysis complete. Total power: ${simulation.totalPower.toFixed(2)}W`,
      },
      recommendations: {
        ledResistor: suggestedValues,
      },
    });
  } catch (error) {
    console.error('[API] Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
    });
  }
});

/**
 * POST /api/circuit/simulate
 * Simulate circuit with custom parameters
 */
router.post('/simulate', express.json(), (req: Request, res: Response) => {
  try {
    const { batteryVoltage = 5, components = [] } = req.body;

    if (!Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ error: 'No components provided' });
    }

    const simulation = CircuitSimulator.simulateSeriesCircuit(batteryVoltage, components);

    res.json({
      success: true,
      simulation,
    });
  } catch (error) {
    console.error('[API] Simulation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Simulation failed',
    });
  }
});

/**
 * GET /api/components
 * Get component database
 */
router.get('/components', (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    // Return all components or filtered
    res.json({
      success: true,
      components: Array.from(
        Object.values(
          category
            ? Object.fromEntries(
                Object.entries(require('../models/components').COMPONENT_LIBRARY).filter(
                  ([, c]: [string, any]) => c.category === category
                )
              )
            : require('../models/components').COMPONENT_LIBRARY
        )
      ),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve components',
    });
  }
});

/**
 * GET /api/circuit/info
 * Get circuit analysis engine info
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const detectionEngine = await getDetectionEngine();
    const modelInfo = detectionEngine.getModelInfo();

    res.json({
      success: true,
      system: {
        model: modelInfo,
        components: {
          database: 'COMPONENT_LIBRARY v1.0',
          total: 10, // resistor, led, battery, etc
        },
        simulation: {
          engine: 'Lightweight OHM simulator',
          capabilities: ['series', 'parallel', 'basic_dc'],
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get system info',
    });
  }
});

export default router;
