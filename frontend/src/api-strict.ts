/**
 * STRICT API CONSUMER - Frontend Response Validation
 * 
 * Problem it solves:
 * - Frontend acts like UI showcase → Now enforces API contract
 * - Doesn't depend on schema → Validates every response
 * - Doesn't block on missing data → Required fields enforced
 * - Renders from random data → Only renders valid responses
 * 
 * Philosophy: FAIL LOUDLY if backend breaks contract
 */

import { AnalysisResponse } from './types';

// ============================================================================
// Response Validation Schema
// ============================================================================

export interface APIValidationErrors {
  field: string;
  message: string;
  value?: any;
}

export class APIValidationError extends Error {
  constructor(
    message: string,
    public errors: APIValidationErrors[]
  ) {
    super(message);
    this.name = 'APIValidationError';
  }

  getDetailedMessage(): string {
    return `${this.message}\nErrors:\n${this.errors
      .map(e => `  - ${e.field}: ${e.message}`)
      .join('\n')}`;
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

function validateRequiredField(
  obj: any,
  field: string,
  type?: string
): APIValidationErrors | null {
  if (!(field in obj)) {
    return { field, message: 'Field is required' };
  }

  if (type && typeof obj[field] !== type) {
    return {
      field,
      message: `Expected ${type}, got ${typeof obj[field]}`,
      value: obj[field],
    };
  }

  return null;
}

function validateAnalysisResponse(obj: any): APIValidationErrors[] {
  const errors: APIValidationErrors[] = [];

  // Top-level contract
  const requiredFields = [
    ['requestId', 'string'],
    ['timestamp', 'string'],
    ['statusCode', 'string'],
    ['statusMessage', 'string'],
    ['processingTimeMs', 'number'],
  ];

  for (const [field, type] of requiredFields) {
    const error = validateRequiredField(obj, field, type as string);
    if (error) errors.push(error);
  }

  // Validate statusCode enum
  if (obj.statusCode && !['ok', 'partial', 'error'].includes(obj.statusCode)) {
    errors.push({
      field: 'statusCode',
      message: 'Must be one of: ok, partial, error',
      value: obj.statusCode,
    });
  }

  // If status is 'error', that's a failure
  if (obj.statusCode === 'error') {
    errors.push({
      field: 'statusCode',
      message: `Analysis failed on backend: ${obj.statusMessage}`,
    });
  }

  // Validate image payload
  if (obj.image) {
    const imageErrors = validateImagePayload(obj.image);
    errors.push(
      ...imageErrors.map(e => ({
        ...e,
        field: `image.${e.field}`,
      }))
    );
  }

  // Validate components array
  if (obj.components) {
    if (!Array.isArray(obj.components)) {
      errors.push({
        field: 'components',
        message: 'Must be array',
        value: typeof obj.components,
      });
    } else {
      for (let i = 0; i < obj.components.length; i++) {
        const compErrors = validateComponentDetection(obj.components[i]);
        errors.push(
          ...compErrors.map(e => ({
            ...e,
            field: `components[${i}].${e.field}`,
          }))
        );
      }
    }
  }

  // Validate circuit identification
  if (obj.circuit) {
    const circuitErrors = validateCircuitIdentification(obj.circuit);
    errors.push(
      ...circuitErrors.map(e => ({
        ...e,
        field: `circuit.${e.field}`,
      }))
    );
  }

  // Validate explanation
  if (obj.explanation) {
    const explanationErrors = validateExplanation(obj.explanation);
    errors.push(
      ...explanationErrors.map(e => ({
        ...e,
        field: `explanation.${e.field}`,
      }))
    );
  }

  return errors;
}

function validateImagePayload(obj: any): APIValidationErrors[] {
  const errors: APIValidationErrors[] = [];

  const required = ['imageId', 'width', 'height', 'mimeType', 'fileSizeBytes'];
  for (const field of required) {
    if (!(field in obj)) {
      errors.push({ field, message: 'Required' });
    }
  }

  if (typeof obj.width !== 'number' || obj.width <= 0) {
    errors.push({
      field: 'width',
      message: 'Must be positive number',
      value: obj.width,
    });
  }

  if (typeof obj.height !== 'number' || obj.height <= 0) {
    errors.push({
      field: 'height',
      message: 'Must be positive number',
      value: obj.height,
    });
  }

  return errors;
}

function validateComponentDetection(obj: any): APIValidationErrors[] {
  const errors: APIValidationErrors[] = [];

  const required = ['id', 'label', 'canonicalLabel', 'confidence', 'bbox'];
  for (const field of required) {
    if (!(field in obj)) {
      errors.push({ field, message: 'Required' });
    }
  }

  if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1) {
    errors.push({
      field: 'confidence',
      message: 'Must be number between 0 and 1',
      value: obj.confidence,
    });
  }

  if (obj.bbox) {
    for (const coord of ['x', 'y', 'w', 'h']) {
      if (typeof obj.bbox[coord] !== 'number') {
        errors.push({
          field: `bbox.${coord}`,
          message: 'Must be number',
          value: obj.bbox[coord],
        });
      }
    }
  }

  return errors;
}

function validateCircuitIdentification(obj: any): APIValidationErrors[] {
  const errors: APIValidationErrors[] = [];

  if (!obj.label) errors.push({ field: 'label', message: 'Required' });
  if (!obj.family) errors.push({ field: 'family', message: 'Required' });

  if (!['simple', 'moderate', 'complex'].includes(obj.complexity)) {
    errors.push({
      field: 'complexity',
      message: 'Must be simple/moderate/complex',
      value: obj.complexity,
    });
  }

  if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1) {
    errors.push({
      field: 'confidence',
      message: 'Must be 0-1',
      value: obj.confidence,
    });
  }

  return errors;
}

function validateExplanation(obj: any): APIValidationErrors[] {
  const errors: APIValidationErrors[] = [];

  for (const level of ['short', 'student', 'engineer']) {
    if (!(level in obj) || typeof obj[level] !== 'string' || obj[level].length === 0) {
      errors.push({
        field: level,
        message: 'Required non-empty string',
        value: obj[level],
      });
    }
  }

  return errors;
}

// ============================================================================
// API Client with Strict Validation
// ============================================================================

export interface History {
  id: string;
  timestamp: string;
  circuitLabel: string;
  componentCount: number;
}

/**
 * Analyze image with STRICT response validation
 * Throws APIValidationError if response doesn't match contract
 */
export async function analyzeImage(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    const json = await response.json();

    // Validate status code first
    if (!response.ok || json.statusCode === 'error') {
      const errors = validateAnalysisResponse(json);
      throw new APIValidationError('Backend returned error', errors);
    }

    // Validate response contract
    const validationErrors = validateAnalysisResponse(json);
    if (validationErrors.length > 0) {
      console.error('API Response Validation Failed:', validationErrors);
      throw new APIValidationError('Backend response does not match contract', validationErrors);
    }

    // Type assertion after validation - now we KNOW it's valid
    return json as AnalysisResponse;
  } catch (err) {
    if (err instanceof APIValidationError) {
      throw err;
    }
    throw new APIValidationError('Failed to analyze image', [
      {
        field: 'network',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    ]);
  }
}

/**
 * Get history with validation
 */
export async function getHistory(): Promise<History[]> {
  try {
    const response = await fetch('/api/history');

    if (!response.ok) {
      throw new APIValidationError('Failed to fetch history', [
        {
          field: 'status',
          message: `HTTP ${response.status}`,
        },
      ]);
    }

    const data = await response.json();

    if (!Array.isArray(data.history)) {
      throw new APIValidationError('Invalid history response', [
        {
          field: 'history',
          message: 'Must be array',
          value: typeof data.history,
        },
      ]);
    }

    return data.history;
  } catch (err) {
    if (err instanceof APIValidationError) throw err;
    throw new APIValidationError('Network error fetching history', [
      {
        field: 'network',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    ]);
  }
}

/**
 * Get specific analysis with validation
 */
export async function getAnalysis(id: string): Promise<AnalysisResponse> {
  try {
    const response = await fetch(`/api/results/${id}`);

    if (!response.ok) {
      throw new APIValidationError('Failed to fetch analysis', [
        {
          field: 'status',
          message: `HTTP ${response.status}`,
        },
      ]);
    }

    const json = await response.json();

    // Validate response contract
    const validationErrors = validateAnalysisResponse(json);
    if (validationErrors.length > 0) {
      throw new APIValidationError('Analysis result does not match contract', validationErrors);
    }

    return json as AnalysisResponse;
  } catch (err) {
    if (err instanceof APIValidationError) throw err;
    throw new APIValidationError('Failed to get analysis', [
      {
        field: 'network',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    ]);
  }
}

/**
 * Export analysis (responses are binary, so less strict validation)
 */
export async function exportAnalysis(
  id: string,
  format: 'json' | 'txt' | 'md' | 'html' | 'csv'
): Promise<Blob> {
  try {
    const response = await fetch(`/api/export/${id}/${format}`);

    if (!response.ok) {
      throw new APIValidationError(`Failed to export to ${format}`, [
        {
          field: 'export_status',
          message: `HTTP ${response.status}`,
        },
      ]);
    }

    return response.blob();
  } catch (err) {
    if (err instanceof APIValidationError) throw err;
    throw new APIValidationError(`Export error: ${format}`, [
      {
        field: 'network',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    ]);
  }
}

/**
 * Helper to download file (no API validation needed)
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Hook for React Components to Handle Validation Errors
// ============================================================================

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof APIValidationError) {
    return err.getDetailedMessage();
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Unknown error occurred';
}
