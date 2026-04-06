/**
 * Circuit Analysis Engine
 * Analyzes circuit topology, component relationships, and safety
 */

import { ComponentMetadata, getComponent, validateComponentConnection } from '../models/components';
import { DetectionResult } from './ml-detection';

export interface CircuitNode {
  id: string;
  x: number;
  y: number;
  type: 'junction' | 'component_pin' | 'power' | 'ground';
  label?: string;
}

export interface CircuitEdge {
  id: string;
  from: string; // node ID
  to: string; // node ID
  component?: ComponentMetadata;
  signal?: {
    voltage?: number;
    current?: number;
    frequency?: number;
  };
}

export interface CircuitTopology {
  nodes: Map<string, CircuitNode>;
  edges: Map<string, CircuitEdge>;
  components: Map<string, ComponentMetadata>;
}

export interface AnalysisResult {
  circuitType: string; // 'LED circuit', '555 timer', etc.
  components: Array<{
    component: ComponentMetadata;
    count: number;
    detections: DetectionResult[];
  }>;
  topology: CircuitTopology;
  issues: AnalysisIssue[];
  suggestions: CircuitSuggestion[];
  warnings: string[];
  explanation: string;
}

export interface AnalysisIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  affectedComponents?: string[];
}

export interface CircuitSuggestion {
  type: 'add' | 'remove' | 'replace' | 'check';
  component: string;
  reason: string;
  example?: string;
}

export class CircuitAnalysisEngine {
  /**
   * Analyze detected components and generate circuit analysis
   */
  static analyzeDetections(detections: DetectionResult[]): AnalysisResult {
    const componentMap = new Map<string, DetectionResult[]>();
    const issues: AnalysisIssue[] = [];
    const suggestions: CircuitSuggestion[] = [];
    const warnings: string[] = [];

    // Group detections by component type
    for (const detection of detections) {
      if (!componentMap.has(detection.class)) {
        componentMap.set(detection.class, []);
      }
      componentMap.get(detection.class)!.push(detection);
    }

    // Analyze each component type
    const components: AnalysisResult['components'] = [];
    const topology = new Map<string, any>();

    for (const [className, detectionGroup] of componentMap) {
      const component = getComponent(className);
      if (!component) continue;

      components.push({
        component,
        count: detectionGroup.length,
        detections: detectionGroup,
      });

      topology.set(className, component);
    }

    // Analyze circuit patterns
    const { circuitType, patternIssues, patternSuggestions } =
      this.identifyCircuitPattern(components);

    issues.push(...patternIssues);
    suggestions.push(...patternSuggestions);

    // Check for common safety issues
    const safetyIssues = this.checkSafetyIssues(components);
    issues.push(...safetyIssues);

    // Generate explanation
    const explanation = this.generateExplanation(circuitType, components, issues);

    return {
      circuitType,
      components,
      topology: {
        nodes: new Map(),
        edges: new Map(),
        components: topology,
      },
      issues,
      suggestions,
      warnings,
      explanation,
    };
  }

  /**
   * Identify circuit pattern (e.g., "LED with current limiting resistor")
   */
  private static identifyCircuitPattern(
    components: AnalysisResult['components']
  ): {
    circuitType: string;
    patternIssues: AnalysisIssue[];
    patternSuggestions: CircuitSuggestion[];
  } {
    const issues: AnalysisIssue[] = [];
    const suggestions: CircuitSuggestion[] = [];
    let circuitType = 'Unknown circuit';

    const componentNames = components.map((c) => c.component.id);

    // Pattern: Simple LED circuit
    if (componentNames.includes('led') && componentNames.includes('battery')) {
      circuitType = 'LED Indicator Circuit';

      const hasResistor = componentNames.includes('resistor');
      if (!hasResistor) {
        issues.push({
          severity: 'critical',
          category: 'design',
          message: 'LED circuit missing current-limiting resistor!',
          affectedComponents: ['led'],
        });
        suggestions.push({
          type: 'add',
          component: 'resistor',
          reason: 'Current-limiting resistor protects LED from overcurrent',
          example: 'Use 220Ω–1kΩ resistor in series with LED',
        });
      }
    }

    // Pattern: Power supply circuit
    if (
      componentNames.includes('battery') &&
      componentNames.includes('capacitor') &&
      !componentNames.includes('diode')
    ) {
      circuitType = 'Power Supply (possibly needs rectification)';
      suggestions.push({
        type: 'check',
        component: 'diode',
        reason: 'Rectifier diode prevents reverse polarity damage',
        example: '1N4007 diode in parallel (cathode to positive)',
      });
    }

    // Pattern: Switching circuit
    if (componentNames.includes('transistor') && componentNames.includes('resistor')) {
      circuitType = 'Transistor Switching Circuit';
      suggestions.push({
        type: 'check',
        component: 'diode',
        reason:
          'If driving inductive load, add protection diode to prevent back-EMF damage',
      });
    }

    // Check for ground connections
    if (!componentNames.includes('battery')) {
      issues.push({
        severity: 'warning',
        category: 'power',
        message: 'No power source detected. Verify circuit has battery or external power.',
      });
    }

    return { circuitType, patternIssues: issues, patternSuggestions: suggestions };
  }

  /**
   * Check for common safety issues
   */
  private static checkSafetyIssues(
    components: AnalysisResult['components']
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Check for short circuits
    const hasResistor = components.some((c) => c.component.id === 'resistor');
    const hasLED = components.some((c) => c.component.id === 'led');
    const hasBattery = components.some((c) => c.component.id === 'battery');

    if (hasLED && hasBattery && !hasResistor) {
      issues.push({
        severity: 'critical',
        category: 'safety',
        message: 'LED will draw excessive current without protection resistor - risk of burnout!',
        affectedComponents: ['led'],
      });
    }

    // Check component heat dissipation
    const powerComponents = components.filter((c) =>
      ['resistor', 'transistor', 'ic'].includes(c.component.category)
    );

    for (const comp of powerComponents) {
      if (comp.count > 0) {
        issues.push({
          severity: 'info',
          category: 'thermal',
          message: `Verify ${comp.component.name} power dissipation is within limits`,
          affectedComponents: [comp.component.id],
        });
      }
    }

    // Check for mismatched voltage ratings
    const capacitors = components.find((c) => c.component.id === 'capacitor');
    if (capacitors && hasBattery) {
      issues.push({
        severity: 'warning',
        category: 'voltage',
        message: 'Verify capacitor voltage rating exceeds battery voltage by 20% safety margin',
        affectedComponents: ['capacitor'],
      });
    }

    return issues;
  }

  /**
   * Generate human-readable explanation
   */
  private static generateExplanation(
    circuitType: string,
    components: AnalysisResult['components'],
    issues: AnalysisIssue[]
  ): string {
    let explanation = `**Circuit Type:** ${circuitType}\n\n`;

    explanation += '**Components Detected:**\n';
    for (const comp of components) {
      explanation += `- ${comp.count}× ${comp.component.name}\n`;
    }

    if (issues.length > 0) {
      explanation += '\n**Issues Found:**\n';
      const criticals = issues.filter((i) => i.severity === 'critical');
      const warnings = issues.filter((i) => i.severity === 'warning');

      if (criticals.length > 0) {
        explanation += '\\n🔴 **Critical Issues:**\n';
        for (const issue of criticals) {
          explanation += `- ${issue.message}\n`;
        }
      }

      if (warnings.length > 0) {
        explanation += '\n⚠️ **Warnings:**\n';
        for (const issue of warnings) {
          explanation += `- ${issue.message}\n`;
        }
      }
    }

    return explanation;
  }

  /**
   * Compute suggested component values (constraint solving)
   */
  static computeSuggestedValues(
    circuitType: string,
    batteryVoltage: number = 5
  ): Record<string, any> {
    const suggested: Record<string, any> = {};

    if (circuitType.includes('LED')) {
      // For typical red LED (Vf ≈ 2V, I ≈ 20mA)
      // R = (V_battery - V_led) / I
      const ledVf = 2; // Forward voltage
      const ledCurrent = 0.02; // 20mA
      const resistorValue = (batteryVoltage - ledVf) / ledCurrent;

      suggested.currentLimitingResistor = {
        value: resistorValue,
        unit: 'Ω',
        standard: this.getNearestStandardResistor(resistorValue),
        range: `${this.getNearestStandardResistor(resistorValue * 0.8)} - ${this.getNearestStandardResistor(resistorValue * 1.2)} Ω`,
      };
    }

    return suggested;
  }

  /**
   * Get nearest standard resistor value (E12 series)
   */
  private static getNearestStandardResistor(value: number): number {
    const e12Series = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
    let exponent = 0;
    let normalized = value;

    while (normalized >= 100) {
      normalized /= 10;
      exponent++;
    }

    while (normalized < 10) {
      normalized *= 10;
      exponent--;
    }

    const closest = e12Series.reduce((prev, curr) =>
      Math.abs(curr - normalized) < Math.abs(prev - normalized) ? curr : prev
    );

    return closest * Math.pow(10, exponent);
  }
}

export default CircuitAnalysisEngine;
