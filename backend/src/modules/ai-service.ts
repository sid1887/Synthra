/**
 * AI Service Wrapper - Vision API Integration with Fallbacks
 * Uses Groq Vision API with mock fallback for dev/testing
 */

import axios from 'axios';
import { ComponentDetection, BoundingBox, CircuitNode, CircuitEdge } from '../types/schemas.js';

const GROQ_API_BASE = process.env.AI_API_URL || 'https://api.groq.com/openai/v1';
const DETECTION_PROVIDER = process.env.AI_PROVIDER || 'groq';

const toBool = (value: string | undefined): boolean | undefined => {
  if (value === undefined) return undefined;
  return value.toLowerCase() === 'true';
};

// These are evaluated dynamically to pick up env changes
function getApiKey(): string {
  return process.env.AI_API_KEY || '';
}

function getStrictMode(): boolean {
  return toBool(process.env.AI_DETECTION_STRICT) ?? false;
}

function getAllowMockFallback(): boolean {
  return toBool(process.env.AI_ALLOW_MOCK_FALLBACK) ?? process.env.SYNTHRA_ENV !== 'production';
}

function getDetectionModel(): string {
  return process.env.AI_VISION_MODEL || process.env.AI_MODEL || 'llama-3.2-11b-vision-preview';
}

function isApiKeyConfigured(): boolean {
  const key = getApiKey();
  return !!key && key !== 'your_groq_api_key_here';
}

export function getDetectionRuntimeInfo() {
  return {
    provider: DETECTION_PROVIDER,
    apiBase: GROQ_API_BASE,
    model: getDetectionModel(),
    apiKeyConfigured: isApiKeyConfigured(),
    strictMode: getStrictMode(),
    mockFallbackEnabled: getAllowMockFallback(),
  };
}

function withDetectionSource(
  detections: ComponentDetection[],
  source: 'groq' | 'mock',
): ComponentDetection[] {
  (detections as any).__source = source;
  return detections;
}

// Mock circuit detection data for development/testing
const MOCK_DETECTIONS_LIBRARY: Record<string, ComponentDetection[]> = {
  simple_led: [
    {
      id: 'cmp_001',
      label: 'battery',
      canonicalLabel: 'battery',
      confidence: 0.94,
      bbox: { x: 50, y: 100, w: 80, h: 150 },
      orientation: 'vertical',
      polarity: 'positive',
      role: 'power',
      unknown: false,
    },
    {
      id: 'cmp_002',
      label: 'resistor',
      canonicalLabel: 'resistor',
      confidence: 0.87,
      bbox: { x: 200, y: 120, w: 100, h: 30 },
      orientation: 'horizontal',
      polarity: 'na',
      value: '430Ω',
      role: 'current_limiting',
      unknown: false,
    },
    {
      id: 'cmp_003',
      label: 'led',
      canonicalLabel: 'led',
      confidence: 0.91,
      bbox: { x: 380, y: 110, w: 40, h: 50 },
      orientation: 'vertical',
      polarity: 'positive',
      value: '5mm red',
      role: 'indicator',
      unknown: false,
    },
    {
      id: 'cmp_004',
      label: 'wire',
      canonicalLabel: 'wire',
      confidence: 0.76,
      bbox: { x: 100, y: 250, w: 300, h: 10 },
      orientation: 'horizontal',
      polarity: 'na',
      role: 'connection',
      unknown: false,
    },
  ],
  parallel_leds: [
    {
      id: 'cmp_001',
      label: 'battery',
      canonicalLabel: 'battery',
      confidence: 0.92,
      bbox: { x: 20, y: 80, w: 70, h: 140 },
      orientation: 'vertical',
      polarity: 'positive',
      role: 'power',
      unknown: false,
    },
    {
      id: 'cmp_002',
      label: 'resistor',
      canonicalLabel: 'resistor',
      confidence: 0.85,
      bbox: { x: 140, y: 100, w: 90, h: 25 },
      orientation: 'horizontal',
      polarity: 'na',
      value: '220Ω',
      role: 'current_limiting',
      unknown: false,
    },
    {
      id: 'cmp_003',
      label: 'led',
      canonicalLabel: 'led',
      confidence: 0.89,
      bbox: { x: 300, y: 70, w: 35, h: 50 },
      orientation: 'vertical',
      polarity: 'positive',
      value: '5mm red',
      role: 'indicator',
      unknown: false,
    },
    {
      id: 'cmp_004',
      label: 'led',
      canonicalLabel: 'led',
      confidence: 0.88,
      bbox: { x: 300, y: 140, w: 35, h: 50 },
      orientation: 'vertical',
      polarity: 'positive',
      value: '5mm green',
      role: 'indicator',
      unknown: false,
    },
  ],
  transistor_circuit: [
    {
      id: 'cmp_001',
      label: 'battery',
      canonicalLabel: 'battery',
      confidence: 0.93,
      bbox: { x: 30, y: 70, w: 75, h: 150 },
      orientation: 'vertical',
      polarity: 'positive',
      role: 'power',
      unknown: false,
    },
    {
      id: 'cmp_002',
      label: 'resistor',
      canonicalLabel: 'resistor',
      confidence: 0.84,
      bbox: { x: 150, y: 90, w: 95, h: 28 },
      orientation: 'horizontal',
      polarity: 'na',
      value: '10kΩ',
      role: 'current_limiting',
      unknown: false,
    },
    {
      id: 'cmp_003',
      label: 'transistor',
      canonicalLabel: 'transistor',
      confidence: 0.81,
      bbox: { x: 310, y: 85, w: 45, h: 70 },
      orientation: 'vertical',
      polarity: 'positive',
      value: '2N3904',
      role: 'switching',
      unknown: false,
    },
    {
      id: 'cmp_004',
      label: 'led',
      canonicalLabel: 'led',
      confidence: 0.9,
      bbox: { x: 430, y: 100, w: 40, h: 50 },
      orientation: 'vertical',
      polarity: 'positive',
      value: '5mm red',
      role: 'indicator',
      unknown: false,
    },
  ],
};

/**
 * Get appropriate mock detection for image analysis
 * In real deployment, this returns nothing and Groq is used
 */
function selectMockDetection(): ComponentDetection[] {
  const mockTypes = Object.keys(MOCK_DETECTIONS_LIBRARY);
  const selected = mockTypes[Math.floor(Math.random() * mockTypes.length)];
  return withDetectionSource(
    JSON.parse(JSON.stringify(MOCK_DETECTIONS_LIBRARY[selected])),
    'mock',
  );
}

function fallbackOrThrow(reason: string): ComponentDetection[] {
  if (getAllowMockFallback() && !getStrictMode()) {
    console.warn(`[Detection] ${reason}; using mock detections`);
    return selectMockDetection();
  }

  throw new Error(
    `[Detection] ${reason}; strict detection mode prevents mock fallback. ` +
      'Set AI_ALLOW_MOCK_FALLBACK=true or AI_DETECTION_STRICT=false for development.',
  );
}

/**
 * Detect components in image using Groq Vision API
 * Falls back to mock data if API unavailable
 */
export async function detectComponentsInImage(
  imageBuffer: Buffer,
  imageId: string,
): Promise<ComponentDetection[]> {
  if (DETECTION_PROVIDER !== 'groq') {
    return fallbackOrThrow(`Unsupported AI provider: ${DETECTION_PROVIDER}`);
  }

  if (!isApiKeyConfigured()) {
    return fallbackOrThrow('No valid Groq API key configured');
  }

  try {
    console.debug(
      `[Detection] Attempting Groq Vision API call (model=${getDetectionModel()}, strict=${getStrictMode()})`,
    );

    // Convert image to base64 for API
    const base64Image = imageBuffer.toString('base64');

    const response = await axios.post(
      `${GROQ_API_BASE}/chat/completions`,
      {
        model: getDetectionModel(),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert electronics circuit analyzer. Analyze this circuit image and identify all visible electronic components.

For each component, respond with JSON in this exact format:
{
  "components": [
    {
      "id": "cmp_001",
      "label": "component_name",
      "confidence": 0.95,
      "bbox": {"x": 100, "y": 120, "w": 80, "h": 30},
      "orientation": "horizontal|vertical|unknown",
      "polarity": "positive|negative|na",
      "value": "optional_spec"
    }
  ]
}

Component labels: resistor, capacitor, inductor, diode, led, transistor, battery, switch, ic, wire, or other.
Be precise with bounding boxes. Only include components with confidence > 0.5.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      },
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      return fallbackOrThrow('Empty response from Groq API');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackOrThrow('No valid JSON in Groq response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const components = (parsed.components || []) as ComponentDetection[];

    if (!Array.isArray(components) || components.length === 0) {
      return fallbackOrThrow('Vision response did not include components');
    }

    console.debug(`[Detection] Detected ${components.length} components from Groq API`);
    return withDetectionSource(components, 'groq');
  } catch (error: any) {
    // Log detailed error info for debugging
    if (error.response?.data) {
      console.error('[Detection] Groq API Error Response:', JSON.stringify(error.response.data));
    }
    console.error('[Detection] Error details:', {
      status: error.response?.status,
      message: error.message,
      model: getDetectionModel(),
      strict: getStrictMode(),
    });
    
    if (getStrictMode() || !getAllowMockFallback()) {
      throw error;
    }

    if (error.response?.status === 404) {
      return fallbackOrThrow(`Groq model not available (404): ${getDetectionModel()}`);
    }

    return fallbackOrThrow(`Groq API error: ${error.message}`);
  }
}

/**
 * Estimate reconstruction from detected components
 */
export function buildSimpleReconstruction(components: ComponentDetection[]) {
  const nodes: CircuitNode[] = [];
  const edges: CircuitEdge[] = [];

  // Create nodes for each component
  components.forEach((comp, idx) => {
    nodes.push({
      id: comp.id,
      type: comp.canonicalLabel === 'battery' ? 'power' : 'component',
      label: comp.canonicalLabel,
      componentId: comp.id,
    });
  });

  // Add virtual ground node
  nodes.push({
    id: 'gnd_000',
    type: 'ground',
    label: 'GND',
  });

  // Create simple series connections
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `edge_${i}_${i + 1}`,
      from: nodes[i].id,
      to: nodes[i + 1].id,
      confidence: 0.7,
    });
  }

  return { nodes, edges, confidence: 0.65 };
}
