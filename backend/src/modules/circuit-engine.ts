/**
 * A6: Circuit Identification Rules Engine
 * Identifies circuit types based on component topology and roles
 */

import { ComponentDetection, CircuitIdentification } from '../types/schemas.js';

interface CircuitTemplate {
  id: string;
  label: string;
  family: string;
  description: string;
  requiredComponents: string[];
  optionalComponents?: string[];
  forbiddenComponents?: string[];
  pattern?: (components: ComponentDetection[]) => number; // matching score 0-1
}

// Circuit templates - rule-based patterns
const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
  {
    id: 'simple_led_circuit',
    label: 'battery_resistor_led',
    family: 'simple_dc',
    description: 'Simple LED circuit with current limiting resistor',
    requiredComponents: ['battery', 'resistor', 'led'],
    optionalComponents: ['switch', 'wire'],
    forbiddenComponents: ['capacitor'],
    pattern: (comps) => {
      const has = (label: string) => comps.some((c) => c.canonicalLabel === label);
      if (!has('battery') || !has('led')) return 0;
      if (has('resistor')) return 0.95; // resistor present = likely intentional
      if (has('switch')) return 0.9;
      return 0.7; // LED + battery alone
    },
  },
  {
    id: 'parallel_led_circuit',
    label: 'parallel_led_output',
    family: 'dc_branches',
    description: 'Multiple LEDs in parallel branches with shared resistor',
    requiredComponents: ['battery', 'resistor', 'led'],
    optionalComponents: ['switch', 'wire'],
    pattern: (comps) => {
      const ledCount = comps.filter((c) => c.canonicalLabel === 'led').length;
      if (ledCount < 2) return 0;
      if (!comps.some((c) => c.canonicalLabel === 'battery')) return 0;
      if (!comps.some((c) => c.canonicalLabel === 'resistor')) return 0;
      return 0.85;
    },
  },
  {
    id: 'series_resistors',
    label: 'resistor_divider',
    family: 'dc_network',
    description: 'Voltage divider using series resistors',
    requiredComponents: ['battery', 'resistor'],
    optionalComponents: ['wire', 'switch'],
    pattern: (comps) => {
      const resCount = comps.filter((c) => c.canonicalLabel === 'resistor').length;
      if (resCount < 2) return 0;
      if (!comps.some((c) => c.canonicalLabel === 'battery')) return 0;
      return 0.88;
    },
  },
  {
    id: 'transistor_switch',
    label: 'transistor_switch_circuit',
    family: 'active_switch',
    description: 'Transistor used for switching or amplification',
    requiredComponents: ['transistor', 'battery'],
    optionalComponents: ['resistor', 'led', 'switch', 'wire', 'capacitor'],
    pattern: (comps) => {
      if (!comps.some((c) => c.canonicalLabel === 'transistor')) return 0;
      if (!comps.some((c) => c.canonicalLabel === 'battery')) return 0;
      if (comps.some((c) => c.canonicalLabel === 'led')) return 0.9;
      return 0.75;
    },
  },
  {
    id: 'rc_filter',
    label: 'rc_low_pass_filter',
    family: 'analog_filter',
    description: 'RC low-pass filter circuit',
    requiredComponents: ['resistor', 'capacitor'],
    optionalComponents: ['battery', 'ic', 'wire'],
    pattern: (comps) => {
      const hasRes = comps.some((c) => c.canonicalLabel === 'resistor');
      const hasCap = comps.some((c) => c.canonicalLabel === 'capacitor');
      if (!hasRes || !hasCap) return 0;
      return 0.8;
    },
  },
  {
    id: 'diode_protection',
    label: 'diode_protection_circuit',
    family: 'protection',
    description: 'Diode used for component protection',
    requiredComponents: ['diode', 'battery'],
    optionalComponents: ['resistor', 'led', 'transistor', 'ic', 'wire'],
    pattern: (comps) => {
      if (!comps.some((c) => c.canonicalLabel === 'diode')) return 0;
      if (!comps.some((c) => c.canonicalLabel === 'battery')) return 0;
      return 0.85;
    },
  },
  {
    id: 'simple_switch_circuit',
    label: 'switch_controlled_circuit',
    family: 'simple_control',
    description: 'Simple switch to control circuit power',
    requiredComponents: ['switch', 'battery'],
    optionalComponents: ['led', 'resistor', 'wire'],
    forbiddenComponents: [],
    pattern: (comps) => {
      const hasSwitch = comps.some((c) => c.canonicalLabel === 'switch');
      const hasBattery = comps.some((c) => c.canonicalLabel === 'battery');
      if (!hasSwitch || !hasBattery) return 0;
      return 0.8;
    },
  },
  {
    id: 'unknown_circuit',
    label: 'unidentified_topology',
    family: 'unknown',
    description: 'Circuit topology not matching known patterns',
    requiredComponents: [],
    pattern: () => 0.1, // Always low match but never zero
  },
];

/**
 * Identify circuit type based on detected components
 */
export function identifyCircuit(components: ComponentDetection[]): CircuitIdentification {
  const canonicalLabels = components.map((c) => c.canonicalLabel);

  // Score each template
  const scores = CIRCUIT_TEMPLATES.map((template) => {
    let score = 0;

    // Check required components
    const requiredMet = (template.requiredComponents || []).every((req) =>
      canonicalLabels.includes(req),
    );
    if (!requiredMet) return { template, score: 0 };

    // Check forbidden components
    const forbiddenViolated = (template.forbiddenComponents || []).some((forb) =>
      canonicalLabels.includes(forb),
    );
    if (forbiddenViolated) return { template, score: 0 };

    // Apply pattern matcher if provided
    if (template.pattern) {
      score = template.pattern(components);
    } else {
      score = 0.6; // Base score for required+optional match
    }

    return { template, score };
  });

  // Find best match (excluding unknown unless nothing else matches)
  const sorted = scores
    .filter((s) => s.template.id !== 'unknown_circuit')
    .sort((a, b) => b.score - a.score);

  const best = sorted.length > 0 && sorted[0].score > 0.5 ? sorted[0] : scores.find((s) => s.template.id === 'unknown_circuit')!;

  const template = best.template;
  const confidence = Math.min(best.score, 0.99);

  // Build power path if battery + LED
  const powerPath = buildPowerPath(components);

  return {
    label: template.label,
    family: template.family,
    complexity: calculateComplexity(components),
    confidence,
    description: template.description,
    power_path: powerPath,
  };
}

/**
 * Trace power flow through circuit
 */
function buildPowerPath(components: ComponentDetection[]): string[] | undefined {
  const battery = components.find((c) => c.canonicalLabel === 'battery');
  if (!battery) return undefined;

  const path = ['battery'];

  // Find next in series
  const resistor = components.find((c) => c.canonicalLabel === 'resistor');
  if (resistor) path.push('resistor');

  const led = components.find((c) => c.canonicalLabel === 'led');
  if (led) path.push('led');

  path.push('ground');

  return path.length > 2 ? path : undefined;
}

/**
 * Estimate circuit complexity
 */
function calculateComplexity(components: ComponentDetection[]): 'simple' | 'moderate' | 'complex' {
  const count = components.length;
  const activeCount = components.filter((c) => ['transistor', 'ic'].includes(c.canonicalLabel)).length;

  if (count <= 3 && activeCount === 0) return 'simple';
  if (count <= 8 && activeCount <= 2) return 'moderate';
  return 'complex';
}

/**
 * Get diagnostics for identified circuit
 */
export function getCircuitDiagnostics(components: ComponentDetection[], circuit: CircuitIdentification) {
  const diagnostics = [];

  // Check for missing resistor with LED
  const hasLed = components.some((c) => c.canonicalLabel === 'led');
  const hasResistor = components.some((c) => c.canonicalLabel === 'resistor');
  if (hasLed && !hasResistor) {
    diagnostics.push({
      code: 'MISSING_RESISTOR',
      message: 'LED detected without current-limiting resistor',
      severity: 'warning' as const,
      action: 'Add a 220-470Ω resistor in series with LED to limit current',
      autoFixAvailable: false,
    });
  }

  // Check for power source
  const hasPower = components.some((c) => c.canonicalLabel === 'battery');
  if (!hasPower) {
    diagnostics.push({
      code: 'MISSING_POWER',
      message: 'No power source detected in circuit',
      severity: 'error' as const,
      action: 'Add a battery or power supply to complete the circuit',
      autoFixAvailable: false,
    });
  }

  // Check for polarity issues (if detectable)
  const polarityIssues = components.filter((c) => c.polarity && c.unknown);
  if (polarityIssues.length > 0) {
    diagnostics.push({
      code: 'POLARITY_UNCERTAIN',
      message: `${polarityIssues.length} polarized component(s) with uncertain orientation`,
      severity: 'warning' as const,
      action: 'Verify polarity orientation by checking the image or retaking from a better angle',
      autoFixAvailable: false,
    });
  }

  return diagnostics;
}
