import { Router } from "express";
import multer from "multer";
import { config } from "../config.js";
import { logInfo } from "../utils/logger.js";
import { startTimer } from "../utils/timing.js";
import { preprocessImage } from "../services/preprocessImage.js";
import { detectObjectsFromHF } from "../services/hfDetection.js";
import { inferRawDetections } from "../services/detectionMock.js";
import { cleanDetections } from "../services/componentPipeline.js";
import { identifyCircuit } from "../services/circuitEngine.js";
import { generateDiagnostics } from "../services/diagnosticsEngine.js";
import { buildExplanation } from "../services/explanationEngine.js";
import { parseAnalyzeBody } from "../schemas/analyzeSchema.js";
import { buildSchematicFromComponents } from "../services/reconstructionEngine.js";
import { simulateStaticCircuit } from "../services/simulationEngine.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxUploadMb * 1024 * 1024
  }
});

export const analyzeRouter = Router();

function createImageId(requestId) {
  return `img_${requestId.replace(/-/g, "").slice(0, 12)}`;
}

analyzeRouter.post("/analyze", upload.single("image"), async (req, res, next) => {
  const timer = startTimer();

  try {
    if (!req.file) {
      return res.status(400).json({
        requestId: req.requestId,
        status: "error",
        error: {
          code: "NO_IMAGE",
          message: "Please upload an image file."
        }
      });
    }

    const parse = parseAnalyzeBody(req.body);
    const minConfidence = parse.minConfidence ?? config.minConfidenceDefault;

    const pre = await preprocessImage(req.file.buffer);
    
    let rawDetections = [];
    try {
      rawDetections = await detectObjectsFromHF(pre.processedBuffer);
    } catch (hfError) {
      logInfo(req.requestId, "hf_detection_fallback", {
        reason: hfError.message
      });
      rawDetections = inferRawDetections({
        fileName: req.file.originalname,
        quality: pre.quality
      });
    }

    const cleaned = cleanDetections(rawDetections);
    const circuit = identifyCircuit(cleaned.components);
    const diagnostics = generateDiagnostics({
      components: cleaned.components,
      circuit,
      quality: pre.quality,
      minConfidence
    });
    const explanation = buildExplanation({
      circuit,
      components: cleaned.components,
      warnings: diagnostics.warnings
    });
    const reconstruction = buildSchematicFromComponents(cleaned.components, circuit);
    const simulation = simulateStaticCircuit(cleaned.components, circuit);

    const imageId = createImageId(req.requestId);

    const response = {
      requestId: req.requestId,
      status: "ok",
      image: {
        imageId,
        fileName: req.file.originalname,
        width: pre.imageMeta.width,
        height: pre.imageMeta.height,
        format: pre.imageMeta.format,
        quality: pre.quality
      },
      components: cleaned.components,
      circuit,
      explanation,
      warnings: diagnostics.warnings,
      suggestions: diagnostics.suggestions,
      fixes: diagnostics.fixes,
      guidance: diagnostics.guidance,
      reconstruction,
      simulation,
      meta: {
        thresholds: { minConfidence },
        parserIssues: parse.issues,
        elapsedMs: timer.elapsedMs()
      }
    };

    logInfo(req.requestId, "analysis_completed", {
      imageId,
      componentCount: cleaned.components.length,
      circuit: circuit.label,
      elapsedMs: response.meta.elapsedMs
    });

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});
