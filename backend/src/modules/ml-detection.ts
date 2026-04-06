/**
 * ML Detection Engine
 * Handles YOLO ONNX model inference and component detection
 */

import path from 'path';
import * as Ort from 'onnxruntime-node';

export interface DetectionResult {
  class: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label: string;
}

export interface DetectionBatch {
  imageId: string;
  timestamp: number;
  detections: DetectionResult[];
  metadata: {
    modelVersion: string;
    inferenceTime: number;
    preprocessTime: number;
  };
}

export class MLDetectionEngine {
  private session: Ort.InferenceSession | null = null;
  private modelPath: string;
  private classNames: Map<number, string>;
  private modelVersion: string = '1.0-yolo-small';

  constructor(modelPath?: string) {
    this.modelPath = modelPath || path.join(process.cwd(), 'models', 'yolo-component-small.onnx');
    this.classNames = new Map([
      [0, 'resistor'],
      [1, 'capacitor'],
      [2, 'inductor'],
      [3, 'diode'],
      [4, 'transistor'],
      [5, 'led'],
      [6, 'battery'],
      [7, 'switch'],
      [8, 'ic'],
      [9, 'connector'],
    ]);
  }

  /**
   * Initialize the model (load ONNX session)
   */
  async initialize(): Promise<void> {
    try {
      Ort.env.logLevel = 'warning';
      this.session = await Ort.InferenceSession.create(this.modelPath);
      console.log('[ML] YOLO model loaded successfully');
    } catch (error) {
      console.error('[ML] Failed to load YOLO model:', error);
      throw new Error(`Failed to initialize ML model: ${error}`);
    }
  }

  /**
   * Detect components in image buffer
   */
  async detect(imageBuffer: Buffer): Promise<DetectionResult[]> {
    if (!this.session) {
      throw new Error('ML model not initialized. Call initialize() first.');
    }

    const startTime = Date.now();

    try {
      // Preprocessing: Convert buffer to tensor
      const preprocessStart = Date.now();
      const tensor = await this.preprocessImage(imageBuffer);
      const preprocessTime = Date.now() - preprocessStart;

      // Run inference
      const inferenceStart = Date.now();
      const feeds: Record<string, Ort.Tensor> = {};
      const inputName = this.session.inputNames[0];
      feeds[inputName] = tensor;

      const outputs = await this.session.run(feeds);
      const inferenceTime = Date.now() - inferenceStart;

      // Post-process outputs
      const detections = this.postprocessOutputs(outputs);

      console.log(
        `[ML] Detection complete: ${detections.length} objects found (${inferenceTime}ms)`
      );

      return detections;
    } catch (error) {
      console.error('[ML] Detection failed:', error);
      throw new Error(`Component detection failed: ${error}`);
    }
  }

  /**
   * Preprocess image to tensor
   */
  private async preprocessImage(imageBuffer: Buffer): Promise<Ort.Tensor> {
    // In production, use sharp or OpenCV to:
    // 1. Decode image
    // 2. Resize to model input size (e.g., 640x640)
    // 3. Normalize values
    // 4. Convert to NCHW tensor format

    // Placeholder: Create a dummy tensor for demo
    const inputSize = 640;
    const channels = 3;
    const data = new Float32Array(channels * inputSize * inputSize);

    // In real implementation, populate with actual image pixel data
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random(); // Placeholder
    }

    return new Ort.Tensor('float32', data, [1, channels, inputSize, inputSize]);
  }

  /**
   * Post-process model outputs to detections
   */
  private postprocessOutputs(outputs: Record<string, Ort.Tensor>): DetectionResult[] {
    const detections: DetectionResult[] = [];

    // YOLO typically outputs:
    // - Detection boxes: [batch_size, num_detections, 4] (x, y, w, h)
    // - Confidence scores: [batch_size, num_detections, num_classes]

    const outputData = outputs[this.session!.outputNames[0]];
    const data = outputData.data as Float32Array;

    // Parse output format based on YOLO version
    // This is simplified - real implementation needs proper parsing
    const confThreshold = 0.5;
    const iouThreshold = 0.4;

    // Example: Iterate through detections
    // (Actual format depends on YOLO version and export settings)
    const numDetections = Math.min(100, data.length / 6); // Assume 6 values per detection

    for (let i = 0; i < numDetections; i++) {
      const offset = i * 6;
      const x = data[offset];
      const y = data[offset + 1];
      const w = data[offset + 2];
      const h = data[offset + 3];
      const conf = data[offset + 4];
      const classIdx = Math.floor(data[offset + 5]);

      if (conf > confThreshold) {
        detections.push({
          class: this.classNames.get(classIdx) || 'unknown',
          confidence: conf,
          bbox: {
            x: Math.max(0, x - w / 2),
            y: Math.max(0, y - h / 2),
            width: w,
            height: h,
          },
          label: `${this.classNames.get(classIdx) || 'unknown'} (${(conf * 100).toFixed(1)}%)`,
        });
      }
    }

    // Apply NMS (Non-Maximum Suppression)
    return this.nonMaxSuppression(detections, iouThreshold);
  }

  /**
   * Non-Maximum Suppression to remove overlapping detections
   */
  private nonMaxSuppression(detections: DetectionResult[], iouThreshold: number): DetectionResult[] {
    if (detections.length === 0) return [];

    // Sort by confidence descending
    const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
    const keep: DetectionResult[] = [];
    const suppressed = new Set<number>();

    for (let i = 0; i < sorted.length; i++) {
      if (suppressed.has(i)) continue;

      keep.push(sorted[i]);

      // Suppress lower confidence overlapping boxes
      for (let j = i + 1; j < sorted.length; j++) {
        if (suppressed.has(j)) continue;

        const iou = this.calculateIoU(sorted[i].bbox, sorted[j].bbox);
        if (iou > iouThreshold) {
          suppressed.add(j);
        }
      }
    }

    return keep;
  }

  /**
   * Calculate Intersection over Union (IoU)
   */
  private calculateIoU(
    box1: DetectionResult['bbox'],
    box2: DetectionResult['bbox']
  ): number {
    const x1_min = box1.x;
    const y1_min = box1.y;
    const x1_max = box1.x + box1.width;
    const y1_max = box1.y + box1.height;

    const x2_min = box2.x;
    const y2_min = box2.y;
    const x2_max = box2.x + box2.width;
    const y2_max = box2.y + box2.height;

    const interX_min = Math.max(x1_min, x2_min);
    const interY_min = Math.max(y1_min, y2_min);
    const interX_max = Math.min(x1_max, x2_max);
    const interY_max = Math.min(y1_max, y2_max);

    if (interX_max < interX_min || interY_max < interY_min) return 0;

    const interArea = (interX_max - interX_min) * (interY_max - interY_min);
    const box1Area = box1.width * box1.height;
    const box2Area = box2.width * box2.height;
    const unionArea = box1Area + box2Area - interArea;

    return interArea / unionArea;
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      modelVersion: this.modelVersion,
      modelPath: this.modelPath,
      classNames: Array.from(this.classNames.values()),
      isInitialized: this.session !== null,
    };
  }
}

// Singleton instance
let detectionEngine: MLDetectionEngine | null = null;

export async function getDetectionEngine(): Promise<MLDetectionEngine> {
  if (!detectionEngine) {
    detectionEngine = new MLDetectionEngine();
    await detectionEngine.initialize();
  }
  return detectionEngine;
}
