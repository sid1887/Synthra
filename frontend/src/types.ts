// Re-export backend schema types for frontend use
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

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ComponentDetection {
  id: string;
  label: string;
  canonicalLabel: string;
  confidence: number;
  bbox: BoundingBox;
  orientation: 'horizontal' | 'vertical' | 'unknown';
  polarity: 'positive' | 'negative' | 'na';
  value?: string;
  role?: string;
  unknown: boolean;
}

export interface CircuitIdentification {
  label: string;
  family: string;
  complexity: 'simple' | 'moderate' | 'complex';
  confidence: number;
  description?: string;
  power_path?: string[];
}

export interface Diagnostic {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  componentIds?: string[];
  action: string;
  autoFixAvailable: boolean;
}

export interface Suggestion {
  id: string;
  type: 'fix' | 'enhancement' | 'warning';
  title: string;
  description: string;
  affectedComponents?: string[];
  estimatedImpact: string;
  action: string;
}

export interface Explanation {
  short: string;
  student: string;
  engineer: string;
}

export interface CaptureGuidance {
  askSecondAngle: boolean;
  askCloserShot: boolean;
  askTopDown: boolean;
  askBetterLighting: boolean;
  reasons: string[];
}

export interface CircuitNode {
  id: string;
  type: 'component' | 'junction' | 'power' | 'ground';
  label: string;
  componentId?: string;
}

export interface CircuitEdge {
  id: string;
  from: string;
  to: string;
  net?: string;
  confidence: number;
}

export interface Reconstruction {
  nodes: CircuitNode[];
  edges: CircuitEdge[];
  netlist?: string;
  confidence: number;
}

export interface SimulationResult {
  power_voltage?: number;
  components: Array<{
    componentId: string;
    voltage: number;
    current: number;
    power: number;
    status: 'on' | 'off' | 'limited' | 'unknown';
  }>;
  notes: string;
  warnings: string[];
}

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
  __metadata?: {
    detectionSource?: 'groq' | 'mock' | 'unknown';
    executionStages?: Array<{
      name: string;
      status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
      durationMs?: number;
      error?: string;
    }>;
    confidenceGateReasons?: string[];
    optionalModulesEnabled?: {
      simulation?: boolean;
      '3d'?: boolean;
      automation?: boolean;
    };
  };
}
