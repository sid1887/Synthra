/**
 * C1: Advanced Simulation Engine
 * Transient analysis, circuit comparison, parameter sweep, and playback simulation
 */

import { CircuitIdentification, ComponentDetection } from '../types/schemas.js';

/**
 * Time-domain transient response
 */
export interface TransientResponse {
  timeMs: number;
  components: {
    componentId: string;
    voltage: number;
    current: number;
    power: number;
    status: string;
  }[];
}

/**
 * Simulation comparison result
 */
export interface SimulationComparison {
  original: {
    circuit: CircuitIdentification;
    components: ComponentDetection[];
    steady: any;
  };
  modified: {
    circuit: CircuitIdentification;
    components: ComponentDetection[];
    steady: any;
  };
  differences: {
    componentId: string;
    originalValue: string;
    modifiedValue: string;
    voltageChange: number;
    currentChange: number;
    powerChange: number;
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
  }[];
  verdict: string;
}

/**
 * Parameter sweep analysis
 */
export interface ParameterSweepResult {
  variable: string; // resistance, voltage, etc.
  startValue: number;
  endValue: number;
  stepCount: number;
  results: {
    parameterValue: number;
    totalPower: number;
    maxVoltage: number;
    maxCurrent: number;
    statusOK: boolean;
    notes: string;
  }[];
  optimal: {
    parameterValue: number;
    metric: 'power' | 'efficiency' | 'heat' | 'safety';
    value: number;
  };
}

/**
 * Playback simulation step for UI timeline
 */
export interface PlaybackFrame {
  frameNumber: number;
  timeMs: number;
  label: string;
  components: {
    componentId: string;
    voltage: number;
    current: number;
    power: number;
    status: 'on' | 'off' | 'limited' | 'saturated';
    animated: boolean;
  }[];
  events: {
    componentId: string;
    eventType: 'power_on' | 'power_off' | 'current_spike' | 'heat_warning';
    severity: 'info' | 'warning' | 'critical';
  }[];
}

/**
 * Parse resistor value string to numeric resistance
 */
function parseResistance(value: string): number {
  const match = value.match(/^([\d.]+)\s*([kMΩ]?)/i);
  if (!match) return 1000; // default 1k

  let val = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase() || '';

  if (unit === 'K') val *= 1000;
  if (unit === 'M') val *= 1000000;
  if (unit === 'Ω') {
    // noop
  }

  return val;
}

/**
 * Advanced transient analysis: simulate response over time with RC time constant
 */
export function simulateTransient(
  components: ComponentDetection[],
  duration: number = 1000, // ms
  powerVoltage: number = 5,
): TransientResponse[] {
  const steps: TransientResponse[] = [];
  const timeStep = 10; // 10ms steps
  const frames = Math.ceil(duration / timeStep);

  // Find capacitors for time constant calculation
  const capacitors = components.filter((c) => c.canonicalLabel === 'capacitor');
  const resistors = components.filter((c) => c.canonicalLabel === 'resistor');

  // Estimate RC time constant (tau = R * C)
  // For simple circuits: tau = resistance * capacitance
  let tau = 0.1; // default 100ms
  if (resistors.length > 0 && capacitors.length > 0) {
    const resistance = parseResistance(resistors[0].value || '1k');
    const capacitance = parseResistance(capacitors[0].value || '100n'); // assume nF

    // Rough time constant calculation (extremely simplified)
    tau = (resistance / 1000) * (capacitance / 1e9); // very rough approximation
    tau = Math.max(0.05, Math.min(tau, 1.0)); // clamp to reasonable range
  }

  // Generate frames with exponential charging curve
  for (let i = 0; i < frames; i++) {
    const t = i * timeStep;
    const factor = 1 - Math.exp(-t / (tau * 1000)); // normalized 0->1

    const response: TransientResponse = {
      timeMs: t,
      components: components.map((comp) => {
        let voltage = 0;
        let current = 0;
        let status = 'off';

        if (comp.canonicalLabel === 'battery') {
          voltage = powerVoltage;
          status = 'on';
        } else if (comp.canonicalLabel === 'capacitor') {
          voltage = powerVoltage * factor; // charging curve
          current = (powerVoltage / 1000) * (1 - factor); // discharge current
          status = factor > 0.5 ? 'charging' : 'charged';
        } else if (comp.canonicalLabel === 'resistor') {
          voltage = powerVoltage * (1 - factor) * 0.5;
          current = (powerVoltage / parseResistance(comp.value || '1k')) * (1 - factor);
          status = current > 0.001 ? 'conducting' : 'off';
        } else if (comp.canonicalLabel === 'led') {
          const threshold = 1.7; // LED forward voltage
          voltage = Math.max(0, powerVoltage * factor - threshold);
          status = voltage > 0 ? 'on' : 'off';
          current = voltage > 0 ? (voltage / 100) * 1000 : 0; // mA
        }

        return {
          componentId: comp.id,
          voltage: Math.max(0, voltage),
          current: Math.max(0, current),
          power: Math.max(0, voltage * current),
          status,
        };
      }),
    };

    steps.push(response);
  }

  return steps;
}

/**
 * Compare two circuit configurations and quantify differences
 */
export function compareCircuits(
  original: { components: ComponentDetection[]; circuit: CircuitIdentification },
  modified: { components: ComponentDetection[]; circuit: CircuitIdentification },
  powerVoltage: number = 5,
): SimulationComparison {
  // Simulate both
  const origSim = simulateTransient(original.components, 500, powerVoltage);
  const modSim = simulateTransient(modified.components, 500, powerVoltage);

  // Extract steady-state (last frame)
  const origSteady = origSim[origSim.length - 1];
  const modSteady = modSim[modSim.length - 1];

  // Find component differences
  const differences: SimulationComparison['differences'] = [];

  modified.components.forEach((modComp) => {
    const origComp = original.components.find((c) => c.id === modComp.id);

    if (!origComp) {
      differences.push({
        componentId: modComp.id,
        originalValue: 'ADDED',
        modifiedValue: modComp.value || 'N/A',
        voltageChange: 0,
        currentChange: 0,
        powerChange: 0,
        impactLevel: 'low',
      });
      return;
    }

    if (origComp.value !== modComp.value) {
      const origSim = origSteady.components.find((c) => c.componentId === origComp.id);
      const modSim = modSteady.components.find((c) => c.componentId === modComp.id);

      if (origSim && modSim) {
        const vChange = Math.abs(modSim.voltage - origSim.voltage);
        const iChange = Math.abs(modSim.current - origSim.current);
        const pChange = Math.abs(modSim.power - origSim.power);

        let impact: SimulationComparison['differences'][0]['impactLevel'] = 'low';
        if (pChange > 100) impact = 'critical';
        else if (pChange > 50) impact = 'high';
        else if (pChange > 10) impact = 'medium';

        differences.push({
          componentId: modComp.id,
          originalValue: origComp.value || 'N/A',
          modifiedValue: modComp.value || 'N/A',
          voltageChange: vChange,
          currentChange: iChange,
          powerChange: pChange,
          impactLevel: impact,
        });
      }
    }
  });

  const hasHighImpact = differences.some((d) => d.impactLevel === 'critical');
  const verdict = hasHighImpact
    ? '⚠️ Critical changes detected - verify safety constraints'
    : differences.length > 0
      ? '✓ Moderate changes - review power levels'
      : '✓ No significant changes detected';

  const origSteadyData = origSteady.components.reduce((acc: any, c: any) => {
    acc[c.componentId] = { voltage: c.voltage, current: c.current, power: c.power };
    return acc;
  }, {});

  const modSteadyData = modSteady.components.reduce((acc: any, c: any) => {
    acc[c.componentId] = { voltage: c.voltage, current: c.current, power: c.power };
    return acc;
  }, {});

  return {
    original: { ...original, steady: origSteadyData },
    modified: { ...modified, steady: modSteadyData },
    differences,
    verdict,
  };
}

/**
 * Parameter sweep analysis: vary one component value and observe effects
 */
export function sweepParameter(
  baseComponents: ComponentDetection[],
  componentId: string,
  parameterName: 'resistance' | 'capacitance' | 'voltage',
  startValue: number,
  endValue: number,
  stepCount: number = 10,
  basePowerVoltage: number = 5,
): ParameterSweepResult {
  const results = [];

  for (let i = 0; i < stepCount; i++) {
    const progress = i / (stepCount - 1);
    const paramValue = startValue + (endValue - startValue) * progress;

    // Modify component value
    const modifiedComps = baseComponents.map((comp) => {
      if (comp.id !== componentId) return comp;

      const modified = { ...comp };
      if (parameterName === 'resistance' && comp.canonicalLabel === 'resistor') {
        modified.value = `${paramValue}Ω`;
      } else if (parameterName === 'capacitance' && comp.canonicalLabel === 'capacitor') {
        modified.value = `${paramValue}F`;
      } else if (parameterName === 'voltage' && comp.canonicalLabel === 'battery') {
        modified.value = `${paramValue}V`;
      }

      return modified;
    });

    // Simulate
    const simFrames = simulateTransient(modifiedComps, 100, basePowerVoltage);
    const steady = simFrames[simFrames.length - 1];

    const totalPower = steady.components.reduce((sum, c) => sum + c.power, 0);
    const maxVoltage = Math.max(...steady.components.map((c) => c.voltage));
    const maxCurrent = Math.max(...steady.components.map((c) => c.current));

    let statusOK = true;
    let notes = '✓ Normal operation';

    if (totalPower > 500) {
      statusOK = false;
      notes = '⚠️ High power dissipation';
    }
    if (maxCurrent > 500) {
      statusOK = false;
      notes = '⚠️ Excessive current';
    }

    results.push({
      parameterValue: paramValue,
      totalPower,
      maxVoltage,
      maxCurrent,
      statusOK,
      notes,
    });
  }

  // Find optimal
  const optimalByPower = results.reduce((best, curr) =>
    curr.totalPower < best.totalPower ? curr : best,
  );

  return {
    variable: parameterName,
    startValue,
    endValue,
    stepCount,
    results,
    optimal: {
      parameterValue: optimalByPower.parameterValue,
      metric: 'power',
      value: optimalByPower.totalPower,
    },
  };
}

/**
 * Generate playback frames for timeline UI animation
 */
export function generatePlaybackFrames(
  components: ComponentDetection[],
  duration: number = 1000,
  powerVoltage: number = 5,
): PlaybackFrame[] {
  const transient = simulateTransient(components, duration, powerVoltage);
  const frameCount = 20; // target 20 frames for smooth playback

  const playbackFrames: PlaybackFrame[] = [];

  for (let i = 0; i < frameCount; i++) {
    const progress = i / (frameCount - 1);
    const simIndex = Math.floor(progress * (transient.length - 1));
    const transStep = transient[simIndex];

    const frameNumber = i;
    let label = 'Initial';
    if (progress < 0.25) label = 'Power-on';
    else if (progress < 0.5) label = 'Rising';
    else if (progress < 0.75) label = 'Settling';
    else label = 'Steady-state';

    const events: PlaybackFrame['events'] = [];

    // Detect spike events
    if (i > 0) {
      const prevStep = transient[Math.floor(progress * (transient.length - 1)) - 1] || transStep;

      transStep.components.forEach((comp) => {
        const prevComp = prevStep.components.find((c) => c.componentId === comp.componentId);
        if (prevComp) {
          if (comp.current > prevComp.current * 1.2) {
            events.push({
              componentId: comp.componentId,
              eventType: 'current_spike',
              severity: comp.current > 100 ? 'critical' : 'warning',
            });
          }
        }
      });
    }

    const validStatus = (status: string): 'on' | 'off' | 'limited' | 'saturated' => {
      if (status === 'on' || status === 'off' || status === 'limited' || status === 'saturated') {
        return status;
      }
      return 'off';
    };

    playbackFrames.push({
      frameNumber,
      timeMs: transStep.timeMs,
      label,
      components: transStep.components.map((comp) => ({
        componentId: comp.componentId,
        voltage: comp.voltage,
        current: comp.current,
        power: comp.power,
        status: validStatus(comp.status),
        animated: comp.status !== 'off',
      })),
      events,
    });
  }

  return playbackFrames;
}

/**
 * Stability analysis: predict if circuit is stable under perturbations
 */
export function analyzeStability(
  components: ComponentDetection[],
  powerVoltage: number = 5,
): {
  stable: boolean;
  marginOfSafety: number;
  warnings: string[];
} {
  const sim = simulateTransient(components, 1000, powerVoltage);
  const steady = sim[sim.length - 1];

  const warnings: string[] = [];
  let marginOfSafety = 1.0;

  // Check for oscillations
  if (sim.length > 100) {
    const mid = sim[Math.floor(sim.length / 2)];
    const end = steady;

    let oscillation = 0;
    mid.components.forEach((comp, idx) => {
      const endComp = end.components[idx];
      const diff = Math.abs(comp.voltage - endComp.voltage);
      if (diff > endComp.voltage * 0.1) {
        oscillation++;
      }
    });

    if (oscillation > components.length * 0.5) {
      warnings.push('⚠️ Circuit may be oscillating or unstable');
      marginOfSafety = 0.5;
    }
  }

  // Check for excessive currents
  const excessive = steady.components.filter((c) => c.current > 200); // arbitrary threshold
  if (excessive.length > 0) {
    warnings.push(`⚠️ ${excessive.length} component(s) with excessive current`);
    marginOfSafety = Math.min(marginOfSafety, 0.7);
  }

  // Check for power dissipation
  const totalPower = steady.components.reduce((sum, c) => sum + c.power, 0);
  if (totalPower > 1000) {
    warnings.push('⚠️ High total power dissipation');
    marginOfSafety = Math.min(marginOfSafety, 0.8);
  }

  return {
    stable: warnings.length === 0,
    marginOfSafety,
    warnings,
  };
}
