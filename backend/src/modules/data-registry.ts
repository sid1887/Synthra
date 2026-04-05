/**
 * DATA REGISTRY - Source of Truth for Components and Circuits
 * 
 * Problem it solves:
 * - Modules assume inputs blindly → Registry provides canonical data
 * - No persistent mapping → History stored in registry
 * - No component standard → Registry defines component schema
 * - Silent failures → Registry validates all data
 */

import type { ComponentDetection, CircuitIdentification } from '../types/schemas.js';

// ============================================================================
// Component Registry - Canonical Component Definitions
// ============================================================================

export interface ComponentDefinition {
  canonicalLabel: string;
  aliases: string[];
  category: 'power' | 'passive' | 'active' | 'control' | 'connection';
  description: string;
  expectedFields: string[];
  valuePattern?: RegExp; // e.g., /^\d+([kM])?Ω$/ for resistors
}

export class ComponentRegistry {
  private definitions: Map<string, ComponentDefinition>;
  private detectionHistory: Map<string, ComponentDetection[]>;

  constructor() {
    this.definitions = new Map();
    this.detectionHistory = new Map();
    this.initializeStandardComponents();
  }

  private initializeStandardComponents(): void {
    // Power Components
    this.register({
      canonicalLabel: 'battery',
      aliases: ['cell', 'power_source', 'voltage_source', 'dc_source'],
      category: 'power',
      description: 'Energy source providing voltage',
      expectedFields: ['id', 'canonicalLabel', 'confidence', 'bbox', 'polarity'],
    });

    // Passive Components
    this.register({
      canonicalLabel: 'resistor',
      aliases: ['resistor', 'res', 'r'],
      category: 'passive',
      description: 'Current limiting component',
      expectedFields: ['id', 'canonicalLabel', 'confidence', 'bbox', 'value'],
      valuePattern: /^\d+([kMμm])?Ω?$/,
    });

    this.register({
      canonicalLabel: 'capacitor',
      aliases: ['capacitor', 'cap', 'c'],
      category: 'passive',
      description: 'Energy storage component',
      expectedFields: ['id', 'canonicalLabel', 'confidence', 'bbox', 'value'],
      valuePattern: /^\d+([μnp])?F$/,
    });

    this.register({
      canonicalLabel: 'inductor',
      aliases: ['inductor', 'coil', 'l'],
      category: 'passive',
      description: 'Inductance component',
      expectedFields: ['id', 'canonicalLabel', 'confidence', 'bbox', 'value'],
      valuePattern: /^\d+([mμn])?H$/,
    });

    // Active Components
    this.register({
      canonicalLabel: 'led',
      aliases: ['led', 'light_emitting_diode', 'diode_led'],
      category: 'active',
      description: 'Light-emitting diode',
      expectedFields: ['id', 'canonicalLabel', 'confidence', 'bbox', 'polarity'],
    });

    this.register({
      canonicalLabel: 'transistor',
      aliases: ['transistor', 'bjt', 'mosfet', 'fet'],
      category: 'active',
      description: 'Amplification/switching component',
      expectedFields: ['id', 'canonicalLabel', 'confidence', 'bbox'],
    });

    this.register({
      canonicalLabel: 'diode',
      aliases: ['diode', 'rectifier', 'zener'],
      category: 'active',
      description: 'One-way conduction component',
      expectedFields: ['id', 'canonicalLabel', 'confidence', 'bbox', 'polarity'],
    });

    // Control Components
    this.register({
      canonicalLabel: 'switch',
      aliases: ['switch', 'button', 'pushbutton', 'toggle'],
      category: 'control',
      description: 'On/off control element',
      expectedFields: ['id', 'canonicalLabel', 'confidence', 'bbox'],
    });

    // Connection Components
    this.register({
      canonicalLabel: 'wire',
      aliases: ['wire', 'trace', 'connection', 'pcb_trace'],
      category: 'connection',
      description: 'Electrical connection',
      expectedFields: ['id', 'canonicalLabel', 'confidence', 'bbox'],
    });

    this.register({
      canonicalLabel: 'junction',
      aliases: ['junction', 'node', 'connection_point'],
      category: 'connection',
      description: 'Connection point between components',
      expectedFields: ['id', 'canonicalLabel', 'confidence', 'bbox'],
    });
  }

  register(def: ComponentDefinition): void {
    this.definitions.set(def.canonicalLabel, def);
  }

  getDefinition(canonicalLabel: string): ComponentDefinition | undefined {
    return this.definitions.get(canonicalLabel);
  }

  isKnownComponent(canonicalLabel: string): boolean {
    return this.definitions.has(canonicalLabel);
  }

  validateComponentDetection(component: ComponentDetection): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!component.id) errors.push('Missing component.id');
    if (!component.canonicalLabel) errors.push('Missing component.canonicalLabel');
    if (component.confidence === undefined) errors.push('Missing component.confidence');
    if (!component.bbox) errors.push('Missing component.bbox');

    // Check if component type is known
    const def = this.getDefinition(component.canonicalLabel);
    if (!def) {
      errors.push(`Unknown component type: ${component.canonicalLabel}`);
    } else {
      // Validate expected fields
      for (const field of def.expectedFields) {
        if (!(field in component)) {
          errors.push(`Missing expected field for ${component.canonicalLabel}: ${field}`);
        }
      }

      // Validate value pattern if present
      if (def.valuePattern && component.value) {
        if (!def.valuePattern.test(component.value)) {
          errors.push(`Invalid value format for ${component.canonicalLabel}: ${component.value}`);
        }
      }
    }

    // Check confidence range
    if (component.confidence < 0 || component.confidence > 1) {
      errors.push(`Confidence must be 0-1, got ${component.confidence}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  recordDetections(analysisId: string, components: ComponentDetection[]): void {
    this.detectionHistory.set(analysisId, JSON.parse(JSON.stringify(components)));
  }

  getDetectionHistory(analysisId: string): ComponentDetection[] | undefined {
    return this.detectionHistory.get(analysisId);
  }

  getAllDefinitions(): ComponentDefinition[] {
    return Array.from(this.definitions.values());
  }
}

// ============================================================================
// Circuit Templates Database - Mapping Common Patterns
// ============================================================================

export interface CircuitTemplate {
  id: string;
  label: string;
  family: string;
  complexity: 'simple' | 'moderate' | 'complex';
  description: string;
  requiredComponents: string[]; // canonical labels
  optionalComponents?: string[];
  forbiddenComponents?: string[];
  commonValues?: Record<string, string[]>; // e.g., resistor: ['220Ω', '470Ω', '1kΩ']
  powerConsumption?: string; // estimated range
  commonApplications: string[];
}

export class CircuitTemplateDB {
  private templates: Map<string, CircuitTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeCommonPatterns();
  }

  private initializeCommonPatterns(): void {
    // Pattern 1: Simple LED Circuit
    this.register({
      id: 'simple_led',
      label: 'battery_resistor_led',
      family: 'simple_dc',
      complexity: 'simple',
      description: 'Basic LED circuit with current limiting resistor',
      requiredComponents: ['battery', 'resistor', 'led'],
      optionalComponents: ['switch', 'wire'],
      forbiddenComponents: [],
      commonValues: {
        resistor: ['220Ω', '330Ω', '470Ω', '1kΩ'],
      },
      powerConsumption: '< 100mW',
      commonApplications: ['indicator light', 'learning circuit', 'breadboard demo'],
    });

    // Pattern 2: Parallel LED Circuit
    this.register({
      id: 'parallel_leds',
      label: 'parallel_led_output',
      family: 'dc_branches',
      complexity: 'moderate',
      description: 'Multiple LEDs in parallel branches',
      requiredComponents: ['battery', 'resistor', 'led'],
      optionalComponents: ['switch', 'wire'],
      forbiddenComponents: [],
      commonValues: {
        resistor: ['220Ω', '330Ω', '470Ω'],
      },
      powerConsumption: '100-500mW',
      commonApplications: ['multi-color display', 'status indicator array'],
    });

    // Pattern 3: Series LED Circuit
    this.register({
      id: 'series_leds',
      label: 'series_led_output',
      family: 'dc_series',
      complexity: 'simple',
      description: 'Multiple LEDs in series',
      requiredComponents: ['battery', 'led'],
      optionalComponents: ['resistor', 'switch', 'wire'],
      forbiddenComponents: [],
      powerConsumption: '50-200mW',
      commonApplications: ['multi-junction LED', 'voltage indicator'],
    });

    // Pattern 4: RC Filter
    this.register({
      id: 'rc_filter',
      label: 'rc_low_pass_filter',
      family: 'passive_filter',
      complexity: 'moderate',
      description: 'RC low-pass filter circuit',
      requiredComponents: ['resistor', 'capacitor'],
      optionalComponents: ['power', 'wire'],
      forbiddenComponents: [],
      commonValues: {
        resistor: ['1kΩ', '10kΩ', '100kΩ'],
        capacitor: ['100nF', '1μF', '10μF'],
      },
      powerConsumption: '0-10mW',
      commonApplications: ['noise filtering', 'audio processing', 'power supply'],
    });

    // Pattern 5: Astable Oscillator
    this.register({
      id: 'astable_oscillator',
      label: 'astable_oscillator_circuit',
      family: 'timing',
      complexity: 'complex',
      description: 'Oscillating circuit for timing/flashing',
      requiredComponents: ['transistor', 'capacitor', 'resistor'],
      optionalComponents: ['led', 'battery', 'wire'],
      forbiddenComponents: [],
      commonValues: {
        capacitor: ['10μF', '100μF'],
        resistor: ['10kΩ', '100kΩ'],
      },
      powerConsumption: '1-50mW',
      commonApplications: ['LED flasher', 'tone generator', 'clock oscillator'],
    });
  }

  register(template: CircuitTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(templateId: string): CircuitTemplate | undefined {
    return this.templates.get(templateId);
  }

  findMatchingTemplates(
    requiredComponents: string[]
  ): CircuitTemplate[] {
    const matches: CircuitTemplate[] = [];

    for (const template of this.templates.values()) {
      const hasAllRequired = template.requiredComponents.every(comp =>
        requiredComponents.includes(comp)
      );

      if (hasAllRequired) {
        matches.push(template);
      }
    }

    return matches;
  }

  validateCircuitAgainstTemplate(
    circuit: CircuitIdentification,
    templateId: string,
    components: ComponentDetection[]
  ): { isValid: boolean; violations: string[] } {
    const template = this.getTemplate(templateId);
    if (!template) {
      return { isValid: false, violations: [`Unknown template: ${templateId}`] };
    }

    const violations: string[] = [];
    const componentLabels = components.map(c => c.canonicalLabel);

    // Check required components
    for (const req of template.requiredComponents) {
      if (!componentLabels.includes(req)) {
        violations.push(`Missing required component: ${req}`);
      }
    }

    // Check forbidden components
    for (const forbidden of template.forbiddenComponents || []) {
      if (componentLabels.includes(forbidden)) {
        violations.push(`Forbidden component found: ${forbidden}`);
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  getAllTemplates(): CircuitTemplate[] {
    return Array.from(this.templates.values());
  }
}

// ============================================================================
// Global Registry Instances (Singleton)
// ============================================================================

let componentRegistry: ComponentRegistry | null = null;
let circuitTemplateDB: CircuitTemplateDB | null = null;

export function getComponentRegistry(): ComponentRegistry {
  if (!componentRegistry) {
    componentRegistry = new ComponentRegistry();
  }
  return componentRegistry;
}

export function getCircuitTemplateDB(): CircuitTemplateDB {
  if (!circuitTemplateDB) {
    circuitTemplateDB = new CircuitTemplateDB();
  }
  return circuitTemplateDB;
}

export function resetRegistries(): void {
  componentRegistry = null;
  circuitTemplateDB = null;
}
