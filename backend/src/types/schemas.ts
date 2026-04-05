/**
 * A1: Product + Contract Lock - Canonical JSON Schemas
 * These schemas define the contract between all modules
 */

// Image metadata and quality assessment
export interface ImageQuality {
  blurry: boolean;
  dark: boolean;
  anglePoor: boolean;
  overexposed?: boolean;
}

export interface ImagePayload {
  imageId: string;
  width: number;
  height: number;
  quality: ImageQuality;
  mimeType: string;
  fileSizeBytes: number;
}

// Component detection result
export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ComponentDetection {
  id: string;
  label: string; // raw label from model
  canonicalLabel: string; // normalized
  confidence: number; // 0-1
  bbox: BoundingBox;
  orientation: 'horizontal' | 'vertical' | 'unknown';
  polarity: 'positive' | 'negative' | 'na';
  value?: string; // e.g. "220Ω", "5mm"
  role?: string; // e.g. "current_limit", "voltage_drop"
  unknown: boolean; // confidence too low
}

// Circuit identification result
export interface CircuitIdentification {
  label: string; // e.g. "battery_resistor_led"
  family: string; // e.g. "simple_dc"
  complexity: 'simple' | 'moderate' | 'complex';
  confidence: number; // 0-1
  description?: string;
  power_path?: string[]; // trace of power flow
}

// Diagnostic warning or issue
export interface Diagnostic {
  code: string; // e.g. "MISSING_RESISTOR", "POLARITY_REVERSED"
  message: string;
  severity: 'info' | 'warning' | 'error';
  componentIds?: string[];
  action: string; // what to do about it
  autoFixAvailable: boolean;
}

// Fix or suggestion
export interface Suggestion {
  id: string;
  type: 'fix' | 'enhancement' | 'warning';
  title: string;
  description: string;
  affectedComponents?: string[];
  estimatedImpact: string; // e.g. "brightness_increase", "safety_critical"
  action: string;
}

// Multi-level explanation
export interface Explanation {
  short: string; // one-liner
  student: string; // beginner-friendly (2-3 sentences)
  engineer: string; // technical (includes values, reasoning)
}

// Guidance for capture improvement
export interface CaptureGuidance {
  askSecondAngle: boolean;
  askCloserShot: boolean;
  askTopDown: boolean;
  askBetterLighting: boolean;
  reasons: string[];
}

// Node/edge for schematic reconstruction
export interface CircuitNode {
  id: string;
  type: 'component' | 'junction' | 'power' | 'ground';
  label: string;
  componentId?: string;
}

export interface CircuitEdge {
  id: string;
  from: string; // node id
  to: string;
  net?: string; // net name if identified
  confidence: number;
}

// Reconstruction output
export interface Reconstruction {
  nodes: CircuitNode[];
  edges: CircuitEdge[];
  netlist?: string; // simplified SPICE-like notation
  confidence: number;
}

// Basic simulation result
export interface SimulationResult {
  power_voltage?: number; // volts
  components: Array<{
    componentId: string;
    voltage: number;
    current: number; // mA
    power: number; // mW
    status: 'on' | 'off' | 'limited' | 'unknown';
  }>;
  notes: string;
  warnings: string[];
}

// Complete analysis response
export interface AnalysisResponse {
  requestId: string;
  timestamp: string;
  image: ImagePayload;
  components: ComponentDetection[];
  circuit: CircuitIdentification;
  explanation: Explanation;
  warnings: Diagnostic[];
  suggestions: Suggestion[];
  guidance: CaptureGuidance;
  reconstruction: Reconstruction | null;
  simulation: SimulationResult | null;
  statusCode: 'ok' | 'partial' | 'error';
  statusMessage: string;
  processingTimeMs: number;
}

// Analysis request
export interface AnalysisRequest {
  requestId?: string;
  timestamp?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  modules: {
    api: 'ok' | 'error';
    preprocessor: 'ok' | 'error';
    detection: 'ok' | 'error' | 'degraded';
    circuitEngine: 'ok' | 'error';
    explanations: 'ok' | 'error';
  };
  aiServiceAvailable: boolean;
  cacheSize?: number;
  uptime?: number;
}
