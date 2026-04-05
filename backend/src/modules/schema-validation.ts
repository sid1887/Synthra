/**
 * SCHEMA VALIDATION - Contract Enforcement with Zod
 * 
 * Problem it solves:
 * - Modules output inconsistent structures → Zod validates every output
 * - Silent failures on wrong data shape → Parse errors caught immediately
 * - No input validation → Every module input checked before processing
 */

// NOTE: These are TypeScript interfaces for now (no Zod yet)
// To upgrade to Zod validation:
// 1. npm install zod
// 2. Replace interfaces with z.object() schemas
// 3. Add .parse() calls in pipeline execution
//
// For now, we provide validation functions instead

import type {
  ImagePayload,
  ImageQuality,
  BoundingBox,
  ComponentDetection,
  CircuitIdentification,
  Explanation,
  Diagnostic,
  Suggestion,
  Reconstruction,
  SimulationResult,
  AnalysisResponse,
} from '../types/schemas.js';

// ============================================================================
// Validation Helper Functions
// ============================================================================

type ValidationError = {
  field: string;
  message: string;
  value?: any;
};

export class ValidationResult<T> {
  constructor(
    public data: T | null,
    public valid: boolean,
    public errors: ValidationError[] = []
  ) {}

  static ok<T>(data: T): ValidationResult<T> {
    return new ValidationResult(data, true, []) as ValidationResult<T>;
  }

  static error<T>(errors: ValidationError[]): ValidationResult<T> {
    return new ValidationResult(null, false, errors) as ValidationResult<T>;
  }

  getErrorMessage(): string {
    return this.errors.map(e => `${e.field}: ${e.message}`).join('; ');
  }
}

// ============================================================================
// ImagePayload Validation
// ============================================================================

export function validateImagePayload(obj: any): ValidationResult<ImagePayload> {
  const errors: ValidationError[] = [];

  if (!obj) {
    errors.push({ field: 'root', message: 'ImagePayload is required' });
    return ValidationResult.error(errors);
  }

  if (!obj.imageId || typeof obj.imageId !== 'string') {
    errors.push({ field: 'imageId', message: 'Must be string', value: obj.imageId });
  }

  if (typeof obj.width !== 'number' || obj.width <= 0) {
    errors.push({ field: 'width', message: 'Must be positive number', value: obj.width });
  }

  if (typeof obj.height !== 'number' || obj.height <= 0) {
    errors.push({ field: 'height', message: 'Must be positive number', value: obj.height });
  }

  if (typeof obj.fileSizeBytes !== 'number' || obj.fileSizeBytes < 0) {
    errors.push({ field: 'fileSizeBytes', message: 'Must be non-negative number', value: obj.fileSizeBytes });
  }

  if (!obj.mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(obj.mimeType)) {
    errors.push({ field: 'mimeType', message: 'Must be valid image MIME type', value: obj.mimeType });
  }

  if (!obj.quality || typeof obj.quality !== 'object') {
    errors.push({ field: 'quality', message: 'Must be ImageQuality object', value: obj.quality });
  }

  if (errors.length > 0) {
    return ValidationResult.error(errors);
  }

  return ValidationResult.ok(obj as ImagePayload);
}

// ============================================================================
// ComponentDetection Validation
// ============================================================================

export function validateComponentDetection(obj: any): ValidationResult<ComponentDetection> {
  const errors: ValidationError[] = [];

  if (!obj) {
    errors.push({ field: 'root', message: 'ComponentDetection is required' });
    return ValidationResult.error(errors);
  }

  if (!obj.id || typeof obj.id !== 'string') {
    errors.push({ field: 'id', message: 'Must be non-empty string', value: obj.id });
  }

  if (!obj.label || typeof obj.label !== 'string') {
    errors.push({ field: 'label', message: 'Must be non-empty string', value: obj.label });
  }

  if (!obj.canonicalLabel || typeof obj.canonicalLabel !== 'string') {
    errors.push({ field: 'canonicalLabel', message: 'Must be non-empty string', value: obj.canonicalLabel });
  }

  if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1) {
    errors.push({ field: 'confidence', message: 'Must be number between 0 and 1', value: obj.confidence });
  }

  if (!obj.bbox || typeof obj.bbox !== 'object') {
    errors.push({ field: 'bbox', message: 'Must be BoundingBox object', value: obj.bbox });
  } else {
    if (typeof obj.bbox.x !== 'number' || obj.bbox.x < 0) {
      errors.push({ field: 'bbox.x', message: 'Must be non-negative number', value: obj.bbox.x });
    }
    if (typeof obj.bbox.y !== 'number' || obj.bbox.y < 0) {
      errors.push({ field: 'bbox.y', message: 'Must be non-negative number', value: obj.bbox.y });
    }
    if (typeof obj.bbox.w !== 'number' || obj.bbox.w <= 0) {
      errors.push({ field: 'bbox.w', message: 'Must be positive number', value: obj.bbox.w });
    }
    if (typeof obj.bbox.h !== 'number' || obj.bbox.h <= 0) {
      errors.push({ field: 'bbox.h', message: 'Must be positive number', value: obj.bbox.h });
    }
  }

  if (!['horizontal', 'vertical', 'unknown'].includes(obj.orientation)) {
    errors.push({ field: 'orientation', message: 'Must be horizontal/vertical/unknown', value: obj.orientation });
  }

  if (!['positive', 'negative', 'na'].includes(obj.polarity ?? 'na')) {
    errors.push({ field: 'polarity', message: 'Must be positive/negative/na', value: obj.polarity });
  }

  if (typeof obj.unknown !== 'boolean') {
    errors.push({ field: 'unknown', message: 'Must be boolean', value: obj.unknown });
  }

  if (errors.length > 0) {
    return ValidationResult.error(errors);
  }

  return ValidationResult.ok(obj as ComponentDetection);
}

// ============================================================================
// ComponentDetection Array Validation
// ============================================================================

export function validateComponentDetectionArray(obj: any): ValidationResult<ComponentDetection[]> {
  const errors: ValidationError[] = [];

  if (!Array.isArray(obj)) {
    errors.push({ field: 'root', message: 'Must be array of ComponentDetection', value: typeof obj });
    return ValidationResult.error(errors);
  }

  for (let i = 0; i < obj.length; i++) {
    const result = validateComponentDetection(obj[i]);
    if (!result.valid) {
      errors.push(
        ...result.errors.map(e => ({
          ...e,
          field: `[${i}].${e.field}`,
        }))
      );
    }
  }

  if (errors.length > 0) {
    return ValidationResult.error(errors);
  }

  return ValidationResult.ok(obj as ComponentDetection[]);
}

// ============================================================================
// CircuitIdentification Validation
// ============================================================================

export function validateCircuitIdentification(obj: any): ValidationResult<CircuitIdentification> {
  const errors: ValidationError[] = [];

  if (!obj) {
    errors.push({ field: 'root', message: 'CircuitIdentification is required' });
    return ValidationResult.error(errors);
  }

  if (!obj.label || typeof obj.label !== 'string') {
    errors.push({ field: 'label', message: 'Must be non-empty string', value: obj.label });
  }

  if (!obj.family || typeof obj.family !== 'string') {
    errors.push({ field: 'family', message: 'Must be non-empty string', value: obj.family });
  }

  if (!['simple', 'moderate', 'complex'].includes(obj.complexity)) {
    errors.push({ field: 'complexity', message: 'Must be simple/moderate/complex', value: obj.complexity });
  }

  if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1) {
    errors.push({ field: 'confidence', message: 'Must be number between 0 and 1', value: obj.confidence });
  }

  if (errors.length > 0) {
    return ValidationResult.error(errors);
  }

  return ValidationResult.ok(obj as CircuitIdentification);
}

// ============================================================================
// Explanation Validation
// ============================================================================

export function validateExplanation(obj: any): ValidationResult<Explanation> {
  const errors: ValidationError[] = [];

  if (!obj) {
    errors.push({ field: 'root', message: 'Explanation is required' });
    return ValidationResult.error(errors);
  }

  if (!obj.short || typeof obj.short !== 'string' || obj.short.length === 0) {
    errors.push({ field: 'short', message: 'Must be non-empty string', value: obj.short });
  }

  if (!obj.student || typeof obj.student !== 'string' || obj.student.length === 0) {
    errors.push({ field: 'student', message: 'Must be non-empty string', value: obj.student });
  }

  if (!obj.engineer || typeof obj.engineer !== 'string' || obj.engineer.length === 0) {
    errors.push({ field: 'engineer', message: 'Must be non-empty string', value: obj.engineer });
  }

  if (errors.length > 0) {
    return ValidationResult.error(errors);
  }

  return ValidationResult.ok(obj as Explanation);
}

// ============================================================================
// Diagnostic Array Validation
// ============================================================================

export function validateDiagnosticArray(obj: any): ValidationResult<Diagnostic[]> {
  if (!Array.isArray(obj)) {
    return ValidationResult.error([
      { field: 'root', message: 'Must be array of Diagnostic', value: typeof obj },
    ]);
  }

  // Diagnostics can be empty array, but if present must have valid structure
  const errors: ValidationError[] = [];

  for (let i = 0; i < obj.length; i++) {
    const diag = obj[i];
    if (!diag.code || typeof diag.code !== 'string') {
      errors.push({ field: `[${i}].code`, message: 'Must be string', value: diag.code });
    }
    if (!['info', 'warning', 'error'].includes(diag.severity)) {
      errors.push({
        field: `[${i}].severity`,
        message: 'Must be info/warning/error',
        value: diag.severity,
      });
    }
  }

  if (errors.length > 0) {
    return ValidationResult.error(errors);
  }

  return ValidationResult.ok(obj as Diagnostic[]);
}

// ============================================================================
// SimulationResult Validation
// ============================================================================

export function validateSimulationResult(obj: any): ValidationResult<SimulationResult | null> {
  if (obj === null) {
    return ValidationResult.ok(null);
  }

  const errors: ValidationError[] = [];

  if (!Array.isArray(obj.components)) {
    errors.push({ field: 'components', message: 'Must be array', value: typeof obj.components });
  }

  if (errors.length > 0) {
    return ValidationResult.error(errors);
  }

  return ValidationResult.ok(obj as SimulationResult);
}

// ============================================================================
// AnalysisResponse Validation (Full Response Contract)
// ============================================================================

export function validateAnalysisResponse(obj: any): ValidationResult<AnalysisResponse> {
  const errors: ValidationError[] = [];

  if (!obj.requestId) {
    errors.push({ field: 'requestId', message: 'Must be present' });
  }

  if (!obj.timestamp) {
    errors.push({ field: 'timestamp', message: 'Must be present' });
  }

  // Validate image payload
  const imageResult = validateImagePayload(obj.image);
  if (!imageResult.valid) {
    errors.push(
      ...imageResult.errors.map(e => ({
        ...e,
        field: `image.${e.field}`,
      }))
    );
  }

  // Validate components array
  const componentsResult = validateComponentDetectionArray(obj.components);
  if (!componentsResult.valid) {
    errors.push(
      ...componentsResult.errors.map(e => ({
        ...e,
        field: `components.${e.field}`,
      }))
    );
  }

  // Validate circuit
  const circuitResult = validateCircuitIdentification(obj.circuit);
  if (!circuitResult.valid) {
    errors.push(
      ...circuitResult.errors.map(e => ({
        ...e,
        field: `circuit.${e.field}`,
      }))
    );
  }

  // Validate explanation
  const explanationResult = validateExplanation(obj.explanation);
  if (!explanationResult.valid) {
    errors.push(
      ...explanationResult.errors.map(e => ({
        ...e,
        field: `explanation.${e.field}`,
      }))
    );
  }

  // Validate status
  if (!['ok', 'partial', 'error'].includes(obj.statusCode)) {
    errors.push({ field: 'statusCode', message: 'Must be ok/partial/error', value: obj.statusCode });
  }

  if (typeof obj.processingTimeMs !== 'number') {
    errors.push({ field: 'processingTimeMs', message: 'Must be number', value: obj.processingTimeMs });
  }

  if (errors.length > 0) {
    return ValidationResult.error(errors);
  }

  return ValidationResult.ok(obj as AnalysisResponse);
}

// ============================================================================
// Batch Validation Helper
// ============================================================================

export function validateAll(responses: ValidationResult<any>[]): {
  allValid: boolean;
  errors: ValidationError[];
} {
  const allErrors: ValidationError[] = [];

  for (const result of responses) {
    if (!result.valid) {
      allErrors.push(...result.errors);
    }
  }

  return {
    allValid: allErrors.length === 0,
    errors: allErrors,
  };
}
