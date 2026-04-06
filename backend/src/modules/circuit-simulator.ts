/**
 * Circuit Simulation Engine
 * Lightweight simulation for basic circuit analysis
 * Uses Ohm's Law, Kirchhoff's Laws, and power calculations
 */

import { Decimal } from 'decimal.js';
import * as math from 'mathjs';

export interface SimulationComponent {
  id: string;
  type: 'resistor' | 'led' | 'battery' | 'capacitor' | 'transistor';
  value?: number; // Ohms, Volts, Farads, etc.
  unit?: string;
}

export interface SimulationNode {
  id: string;
  voltage: number;
  label: string;
}

export interface SimulationEdge {
  nodeA: string;
  nodeB: string;
  component: SimulationComponent;
  current?: number;
  powerDissipation?: number;
}

export interface CircuitSimulation {
  nodes: SimulationNode[];
  edges: SimulationEdge[];
}

export interface SimulationResult {
  nodes: Array<{
    id: string;
    voltage: number;
    label: string;
  }>;
  edges: Array<{
    nodeA: string;
    nodeB: string;
    component: SimulationComponent;
    current: number;
    voltage: number;
    powerDissipation: number;
    warnings: string[];
  }>;
  totalPower: number;
  summary: string;
}

export class CircuitSimulator {
  /**
   * Simulate simple series circuit
   * Example: Battery -> Resistor -> LED -> Battery (ground)
   */
  static simulateSeriesCircuit(
    batteryVoltage: number,
    components: SimulationComponent[]
  ): SimulationResult {
    const result: SimulationResult = {
      nodes: [],
      edges: [],
      totalPower: 0,
      summary: '',
    };

    // Calculate total resistance
    let totalResistance = 0;
    const resistiveComponents: SimulationComponent[] = [];

    for (const comp of components) {
      if (comp.type === 'resistor' && comp.value) {
        totalResistance += comp.value;
        resistiveComponents.push(comp);
      } else if (comp.type === 'led' && comp.value) {
        // LED has forward voltage drop, acts like a voltage source
        totalResistance += 1; // Small internal resistance
      }
    }

    if (totalResistance === 0) {
      return {
        ...result,
        summary: '⚠️ Circuit has no resistance - short circuit!',
      };
    }

    // Current in series circuit: I = V / R
    const totalCurrent = new Decimal(batteryVoltage).dividedBy(new Decimal(totalResistance));

    // Calculate voltage drops and power dissipation
    let currentVoltage = batteryVoltage;
    let totalPowerDissipation = new Decimal(0);

    const edges: SimulationResult['edges'] = [];

    for (const comp of components) {
      let voltageDrop = 0;
      let power = new Decimal(0);

      if (comp.type === 'resistor' && comp.value) {
        voltageDrop = totalCurrent.toNumber() * comp.value;
        power = new Decimal(voltageDrop).times(totalCurrent);
      } else if (comp.type === 'led' && comp.value) {
        voltageDrop = comp.value; // Forward voltage
        power = new Decimal(voltageDrop).times(totalCurrent);
      }

      currentVoltage -= voltageDrop;
      totalPowerDissipation = totalPowerDissipation.plus(power);

      const warnings: string[] = [];

      // Check LED current
      if (comp.type === 'led') {
        const ledCurrent = totalCurrent.toNumber() * 1000; // Convert to mA
        if (ledCurrent > 30) {
          warnings.push('⚠️ LED current exceeds typical max (30mA) - may burn out!');
        }
      }

      // Check resistor power rating
      if (comp.type === 'resistor') {
        const powerW = power.toNumber();
        if (powerW > 0.5) {
          warnings.push(`⚠️ Resistor power dissipation (${powerW.toFixed(2)}W) exceeds 0.5W`);
        }
      }

      edges.push({
        nodeA: `node_${edges.length}`,
        nodeB: `node_${edges.length + 1}`,
        component: comp,
        current: totalCurrent.toNumber(),
        voltage: voltageDrop,
        powerDissipation: power.toNumber(),
        warnings,
      });
    }

    result.edges = edges;
    result.totalPower = totalPowerDissipation.toNumber();

    // Build summary
    result.summary = `
**Series Circuit Simulation:**
- Battery Voltage: ${batteryVoltage}V
- Total Resistance: ${totalResistance}Ω
- Circuit Current: ${totalCurrent.toFixed(3)}A (${(totalCurrent.toNumber() * 1000).toFixed(1)}mA)
- Total Power: ${totalPowerDissipation.toFixed(2)}W

**Status:** ${totalCurrent.toNumber() > 0.5 ? '🔴 HIGH CURRENT' : totalCurrent.toNumber() > 0.1 ? '🟡 NORMAL' : '🟢 LOW CURRENT'}
    `;

    return result;
  }

  /**
   * Simulate parallel circuit
   */
  static simulateParallelCircuit(
    batteryVoltage: number,
    components: SimulationComponent[]
  ): SimulationResult {
    const result: SimulationResult = {
      nodes: [],
      edges: [],
      totalPower: 0,
      summary: '',
    };

    // In parallel: voltage is same across all components
    // Total current = sum of individual currents

    let totalCurrent = new Decimal(0);
    let totalPower = new Decimal(0);
    const edges: SimulationResult['edges'] = [];

    // Calculate voltage drops
    for (const comp of components) {
      let current = new Decimal(0);
      let power = new Decimal(0);

      if (comp.type === 'resistor' && comp.value) {
        // I = V / R
        current = new Decimal(batteryVoltage).dividedBy(new Decimal(comp.value));
      } else if (comp.type === 'led' && comp.value) {
        // LED voltage drop is relatively fixed
        const ledVoltage = comp.value;
        const effectiveVoltage = Math.max(0, batteryVoltage - ledVoltage);
        current = new Decimal(effectiveVoltage).dividedBy(new Decimal(100)); // Assume ~100Ω equivalent
      }

      power = new Decimal(batteryVoltage).times(current);
      totalCurrent = totalCurrent.plus(current);
      totalPower = totalPower.plus(power);

      edges.push({
        nodeA: 'positive_rail',
        nodeB: 'negative_rail',
        component: comp,
        current: current.toNumber(),
        voltage: batteryVoltage,
        powerDissipation: power.toNumber(),
        warnings: [],
      });
    }

    result.edges = edges;
    result.totalPower = totalPower.toNumber();
    result.summary = `
**Parallel Circuit Simulation:**
- Battery Voltage: ${batteryVoltage}V
- Total Current: ${totalCurrent.toFixed(3)}A (${(totalCurrent.toNumber() * 1000).toFixed(1)}mA)
- Total Power: ${totalPower.toFixed(2)}W

**Status:** ${totalCurrent.toNumber() > 1 ? '🔴 HIGH CURRENT' : totalCurrent.toNumber() > 0.1 ? '🟡 NORMAL' : '🟢 LOW CURRENT'}
    `;

    return result;
  }

  /**
   * Compute LED brightness from current
   */
  static computeLEDBrightness(currentMA: number): {
    brightness: number;
    description: string;
  } {
    // Typical LED brightness vs current relationship
    const brightness = Math.min(100, (currentMA / 20) * 100); // 20mA = 100% brightness

    let description = 'Off';
    if (brightness > 0 && brightness < 10) description = '🟣 Very dim';
    else if (brightness >= 10 && brightness < 30) description = '🔵 Dim';
    else if (brightness >= 30 && brightness < 70) description = '🟢 Normal';
    else if (brightness >= 70 && brightness < 90) description = '🟡 Bright';
    else if (brightness >= 90) description = '🔴 Very bright (may degrade)';

    return { brightness, description };
  }

  /**
   * Recommend resistor value for LED
   */
  static recommendLEDResistor(
    batteryVoltage: number,
    ledForwardVoltage: number = 2,
    targetCurrent: number = 0.02 // 20mA in Amps
  ): {
    value: number;
    powerRating: number;
    standard: number;
  } {
    const availableVoltage = batteryVoltage - ledForwardVoltage;

    if (availableVoltage <= 0) {
      throw new Error('Battery voltage too low for LED');
    }

    // R = V / I
    const resistorValue = availableVoltage / targetCurrent;

    // P = V * I = I^2 * R
    const powerRating = targetCurrent * targetCurrent * resistorValue;

    // Get standard E12 resistor value
    const standard = this.getNearestStandardResistor(resistorValue);

    return {
      value: resistorValue,
      powerRating,
      standard,
    };
  }

  /**
   * Get nearest standard resistor
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

export default CircuitSimulator;
