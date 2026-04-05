/**
 * B2: Basic Simulation Engine
 * Ideal static simulation for battery/resistor/LED circuits
 * Implements Ohm's Law: V = IR, P = VI
 */

import { ComponentDetection, SimulationResult } from '../types/schemas.js';

interface ComponentSpecs {
  [key: string]: {
    type: 'resistive' | 'voltage_source' | 'current_sink' | 'unknown';
    voltage?: number; // voltage drop (V)
    resistance?: number; // Ω
    maxCurrent?: number; // mA
};
}

// Realistic component specifications
const COMPONENT_SPECS: ComponentSpecs = {
  battery: {
    type: 'voltage_source',
    voltage: 5.0, // Assuming 5V, typical Arduino/breadboard scenario
  },
  led: {
    type: 'current_sink',
    voltage: 2.0, // Typical forward voltage drop ~2V for red LED
    maxCurrent: 20, // mA - typically 15-20mA max
  },
  resistor: {
    type: 'resistive',
    resistance: 430, // Typical value, will be parsed from value field
  },
  diode: {
    type: 'current_sink',
    voltage: 0.7, // Forward drop
    maxCurrent: 100,
  },
  transistor: {
    type: 'unknown',
  },
  capacitor: {
    type: 'unknown',
  },
  inductor: {
    type: 'unknown',
  },
  ic: {
    type: 'unknown',
  },
  switch: {
    type: 'resistive',
    resistance: 0.1, // Contact resistance
  },
  wire: {
    type: 'resistive',
    resistance: 0.01,
  },
};

/**
 * Parse resistor value from component label/value field
 * Examples: "220Ω", "10k", "1.5M", formats
 */
function parseResistanceValue(valueStr?: string): number {
  if (!valueStr) return 0;

  const str = valueStr.toLowerCase().trim();

  // Remove spaces and special chars except multipliers
  let base = parseFloat(str);
  if (isNaN(base)) return 0;

  if (str.includes('k') || str.includes('ω')) {
    base *= 1000;
  } else if (str.includes('m')) {
    base *= 1000000;
  }

  return base;
}

/**
 * Run ideal static DC simulation on circuit
 */
export function simulateCircuit(components: ComponentDetection[]): SimulationResult {
  const result: SimulationResult = {
    components: [],
    notes: 'Ideal DC analysis (Ohm\'s Law, V=IR)',
    warnings: [],
  };

  // Find voltage source
  const batteryComp = components.find((c) => c.canonicalLabel === 'battery');
  const batteryVoltage = batteryComp ? (COMPONENT_SPECS.battery.voltage || 5.0) : 0;

  if (!batteryVoltage) {
    result.notes = 'No battery detected; simulation skipped';
    return result;
  }

  result.power_voltage = batteryVoltage;

  // Find resistive and current-sink components
  let totalResistance = 0;
  const resistors: ComponentDetection[] = [];
  const currentSinks: ComponentDetection[] = [];

  components.forEach((comp) => {
    const spec = COMPONENT_SPECS[comp.canonicalLabel];
    if (!spec) return;

    if (spec.type === 'resistive') {
      const resistance =
        comp.canonicalLabel === 'resistor' ? parseResistanceValue(comp.value) : spec.resistance || 0;
      resistors.push(comp);
      totalResistance += resistance;
    } else if (spec.type === 'current_sink') {
      currentSinks.push(comp);
    }
  });

  // Apply Ohm's Law: V = IR
  const totalLedVoltage = currentSinks.reduce((sum, c) => {
    const spec = COMPONENT_SPECS[c.canonicalLabel];
    return sum + (spec?.voltage || 0);
  }, 0);

  const resistorVoltage = batteryVoltage - totalLedVoltage;
  let circuitCurrent = totalResistance > 0 ? (resistorVoltage / totalResistance) * 1000 : 0; // in mA

  // Check for over-current
  const maxCurrent = Math.min(
    ...currentSinks.map((c) => COMPONENT_SPECS[c.canonicalLabel].maxCurrent || 100),
  );

  if (circuitCurrent > maxCurrent) {
    result.warnings.push(
      `Circuit current (${circuitCurrent.toFixed(1)}mA) exceeds safe limit (${maxCurrent}mA); increase resistor value`,
    );
    circuitCurrent = maxCurrent;
  }

  if (circuitCurrent < 1 && currentSinks.length > 0) {
    result.warnings.push(`Circuit current very low (${circuitCurrent.toFixed(2)}mA); LED may not light`);
  }

  // Calculate per-component power and status
  components.forEach((comp) => {
    const spec = COMPONENT_SPECS[comp.canonicalLabel];
    if (!spec) return;

    let voltage = 0;
    let current = circuitCurrent;
    let power = 0;
    let status: 'on' | 'off' | 'limited' | 'unknown' = 'unknown';

    switch (spec.type) {
      case 'voltage_source':
        voltage = batteryVoltage;
        current = circuitCurrent;
        power = voltage * current;
        status = circuitCurrent > 0 ? 'on' : 'off';
        break;

      case 'resistive': {
        const resistance =
          comp.canonicalLabel === 'resistor' ? parseResistanceValue(comp.value) : spec.resistance || 0;
        if (resistance === 0) {
          voltage = 0;
          current = 0;
          status = 'off';
        } else {
          voltage = (circuitCurrent / 1000) * resistance; // voltage
          current = circuitCurrent;
          power = voltage * (current / 1000);
          status = 'on';
        }
        break;
      }

      case 'current_sink': {
        voltage = spec.voltage || 0;
        current = circuitCurrent;
        power = voltage * (current / 1000);
        status = current > 1 && current < (spec.maxCurrent || 100) ? 'on' : 'limited';
        break;
      }

      default:
        status = 'unknown';
    }

    result.components.push({
      componentId: comp.id,
      voltage: parseFloat(voltage.toFixed(2)),
      current: parseFloat(current.toFixed(2)),
      power: parseFloat(power.toFixed(2)),
      status,
    });
  });

  return result;
}
