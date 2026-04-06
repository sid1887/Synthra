/**
 * SPICE Simulator Module
 * DC Operating Point, Transient, and AC Analysis
 * Implements Kirchhoff's voltage/current laws with Newton-Raphson solver
 */

import * as math from 'mathjs';

export interface NetlistNode {
  name: string;
  voltage: number;
  components: NetlistComponent[];
}

export interface NetlistComponent {
  type: 'R' | 'C' | 'L' | 'V' | 'I' | 'D' | 'Q' | 'M';
  name: string;
  nodes: string[];
  value?: number;
  model?: string;
  parameters?: Record<string, number>;
}

export interface CircuitNetlist {
  title: string;
  components: NetlistComponent[];
  nodes: string[];
  sourceNode?: string;
  sinkNode?: string;
}

export interface SimulationResult {
  type: 'dc' | 'transient' | 'ac';
  success: boolean;
  nodeVoltages: Record<string, number>;
  componentCurrents: Record<string, number>;
  powerDissipation: Record<string, number>;
  convergence?: {
    iterations: number;
    error: number;
    timestamp: number;
  };
  waveforms?: {
    time: number[];
    voltage: Record<string, number[]>;
    current: Record<string, number[]>;
  };
  warnings: string[];
  errors: string[];
}

/**
 * SPICE Circuit Simulator
 * Solves circuits using modified nodal analysis (MNA)
 */
export class SPICESimulator {
  private netlist: CircuitNetlist;
  private nodeMap: Map<string, number> = new Map();
  private tolerance: number = 1e-6;
  private maxIterations: number = 100;

  constructor(netlist: CircuitNetlist) {
    this.netlist = netlist;
    this.setupNodeMap();
  }

  /**
   * Create node index mapping
   */
  private setupNodeMap(): void {
    this.nodeMap.clear();
    let idx = 0;
    for (const node of this.netlist.nodes) {
      if (node !== 'GND' && node !== '0') {
        this.nodeMap.set(node, idx);
        idx++;
      }
    }
    this.nodeMap.set('GND', idx);
    this.nodeMap.set('0', idx);
  }

  /**
   * DC Operating Point Analysis
   * Find steady-state node voltages and currents
   */
  dc(): SimulationResult {
    const result: SimulationResult = {
      type: 'dc',
      success: true,
      nodeVoltages: {},
      componentCurrents: {},
      powerDissipation: {},
      warnings: [],
      errors: [],
    };

    try {
      const numNodes = this.nodeMap.size - 1; // Exclude GND
      let voltages = math.zeros(numNodes);
      let iteration = 0;

      // Newton-Raphson iteration
      while (iteration < this.maxIterations) {
        const { G, b } = this.buildAdmittanceMatrix(voltages);

        try {
          const solution = math.lusolve(G as any, b as any);
          const newVoltages = (math.flatten(solution) as unknown as number[]);

          // Check convergence
          const error = (math.max(math.abs(math.subtract(newVoltages, voltages))) as unknown as number);

          // Map results
          this.mapVoltages(newVoltages, result.nodeVoltages);
          this.calculateCurrents(newVoltages, result.componentCurrents, result.powerDissipation);

          if (error < this.tolerance) {
            result.convergence = {
              iterations: iteration + 1,
              error: error,
              timestamp: Date.now(),
            };
            break;
          }

          voltages = math.clone(newVoltages as any) as any;
        } catch (e) {
          result.errors.push(`Matrix solver failed at iteration ${iteration}: ${String(e)}`);
          result.success = false;
          break;
        }

        iteration++;
      }

      if (iteration >= this.maxIterations && result.success) {
        result.warnings.push(`Did not converge after ${this.maxIterations} iterations`);
      }

      // Validate results
      this.validateResults(result);
    } catch (error) {
      result.success = false;
      result.errors.push(String(error));
    }

    return result;
  }

  /**
   * Transient Analysis (time-domain)
   * Solve circuit over time interval using implicit Euler
   */
  transient(
    startTime: number = 0,
    stopTime: number = 1,
    timeStep: number = 0.01
  ): SimulationResult {
    const result: SimulationResult = {
      type: 'transient',
      success: true,
      nodeVoltages: {},
      componentCurrents: {},
      powerDissipation: {},
      waveforms: {
        time: [],
        voltage: {},
        current: {},
      },
      warnings: [],
      errors: [],
    };

    try {
      const nodes = Array.from(this.nodeMap.keys()).filter((n) => n !== 'GND' && n !== '0');
      const numNodes = nodes.length;

      let time = startTime;
      let voltages = math.zeros(numNodes);
      let prevVoltages = math.zeros(numNodes);
      let prevCurrents: Record<string, number> = {};

      // Initialize
      for (const comp of this.netlist.components) {
        prevCurrents[comp.name] = 0;
      }

      const timePoints = [];
      const timeSeries: Record<string, number[]> = {};
      const currentSeries: Record<string, number[]> = {};

      for (const node of nodes) {
        timeSeries[node] = [];
        result.waveforms!.voltage[node] = [];
      }

      // Time-stepping
      while (time <= stopTime && timePoints.length < 10000) {
        try {
          // Predict-correct step
          const { G, b } = this.buildAdmittanceMatrix(voltages, timeStep, prevVoltages);
          const solution = math.lusolve(G as any, b as any);
          voltages = (math.flatten(solution) as unknown as number[]);

          // Store results
          timePoints.push(time);
          result.waveforms!.time.push(time);

          const nodeVoltages: Record<string, number> = {};
          nodes.forEach((node, idx) => {
            nodeVoltages[node] = (voltages as number[])[idx];
            result.waveforms!.voltage[node].push((voltages as number[])[idx]);
          });

          this.calculateCurrents(voltages, prevCurrents, {});

          for (const comp of this.netlist.components) {
            if (!currentSeries[comp.name]) {
              currentSeries[comp.name] = [];
              result.waveforms!.voltage[comp.name] = [];
            }
            currentSeries[comp.name].push(prevCurrents[comp.name]);
          }

          // Update for next iteration
          prevVoltages = math.clone(voltages);
          time += timeStep;
        } catch (e) {
          result.errors.push(`Transient step failed at t=${time}: ${String(e)}`);
          result.success = false;
          break;
        }
      }

      if (timePoints.length > 0) {
        result.nodeVoltages = this.getLastValues(timeSeries);
        result.waveforms!.current = currentSeries;
      }

      this.validateResults(result);
    } catch (error) {
      result.success = false;
      result.errors.push(String(error));
    }

    return result;
  }

  /**
   * Build admittance matrix (G) and source vector (b) for MNA
   */
  private buildAdmittanceMatrix(
    voltages: any,
    dt: number = 0,
    prevVoltages: any = null
  ): { G: any; b: any } {
    const numNodes = this.nodeMap.size - 1;
    let G = math.zeros(numNodes, numNodes);
    let b = math.zeros(numNodes, 1);

    // Process each component
    for (const comp of this.netlist.components) {
      const n1Idx = this.nodeMap.get(comp.nodes[0]) || 0;
      const n2Idx = this.nodeMap.get(comp.nodes[1]) || 0;

      switch (comp.type) {
        case 'R': {
          // Resistor: I = V/R
          const resistance = comp.value || 1;
          if (resistance > 0) {
            const G_val = 1 / resistance;
            if (n1Idx < numNodes)
              G = math.add(G, [[n1Idx, n1Idx], G_val] as any);
            if (n2Idx < numNodes)
              G = math.add(G, [[n2Idx, n2Idx], G_val] as any);
            if (n1Idx < numNodes && n2Idx < numNodes) {
              G = math.subtract(G, [[n1Idx, n2Idx], G_val] as any);
              G = math.subtract(G, [[n2Idx, n1Idx], G_val] as any);
            }
          }
          break;
        }

        case 'V': {
          // Voltage source
          if (comp.value !== undefined) {
            if (n1Idx < numNodes) {
              b = math.add(b, [[n1Idx, 0], comp.value] as any);
            }
          }
          break;
        }

        case 'I': {
          // Current source
          if (comp.value !== undefined) {
            if (n1Idx < numNodes) {
              b = math.add(b, [[n1Idx, 0], comp.value] as any);
            }
            if (n2Idx < numNodes) {
              b = math.subtract(b, [[n2Idx, 0], comp.value] as any);
            }
          }
          break;
        }

        case 'C': {
          // Capacitor (stamp history for transient)
          if (dt > 0 && prevVoltages) {
            const C = comp.value || 1e-6;
            const i_history = (C / dt) * ((prevVoltages as number[])[n1Idx] - (prevVoltages as number[])[n2Idx]);
            if (n1Idx < numNodes) b = math.add(b, [[n1Idx, 0], i_history] as any);
            if (n2Idx < numNodes) b = math.subtract(b, [[n2Idx, 0], i_history] as any);
          }
          break;
        }

        case 'D': {
          // Diode (simple exponential model)
          const Is = comp.parameters?.Is || 1e-12;
          const Vt = comp.parameters?.Vt || 0.026;
          const V = (voltages as number[])[n1Idx] - (voltages as number[])[n2Idx];
          const I = Is * (Math.exp(V / Vt) - 1);
          const gd = Is / Vt * Math.exp(V / Vt); // transconductance

          if (n1Idx < numNodes)
            G = math.add(G, [[n1Idx, n1Idx], gd] as any);
          if (n2Idx < numNodes)
            G = math.add(G, [[n2Idx, n2Idx], gd] as any);
          if (n1Idx < numNodes && n2Idx < numNodes) {
            G = math.subtract(G, [[n1Idx, n2Idx], gd] as any);
            G = math.subtract(G, [[n2Idx, n1Idx], gd] as any);
          }

          if (n1Idx < numNodes) b = math.add(b, [[n1Idx, 0], I - gd * V] as any);
          if (n2Idx < numNodes) b = math.subtract(b, [[n2Idx, 0], I - gd * V] as any);
          break;
        }
      }
    }

    return { G, b };
  }

  /**
   * Calculate component currents and power dissipation
   */
  private calculateCurrents(
    voltages: any,
    currentMap: Record<string, number>,
    powerMap: Record<string, number>
  ): void {
    for (const comp of this.netlist.components) {
      const n1Idx = this.nodeMap.get(comp.nodes[0]) || 0;
      const n2Idx = this.nodeMap.get(comp.nodes[1]) || 0;
      const V1 = (voltages as number[])[n1Idx] || 0;
      const V2 = (voltages as number[])[n2Idx] || 0;
      const V = V1 - V2;

      let I = 0;
      let P = 0;

      switch (comp.type) {
        case 'R':
          I = V / (comp.value || 1);
          P = I * I * (comp.value || 1);
          break;
        case 'D': {
          const Is = comp.parameters?.Is || 1e-12;
          const Vt = comp.parameters?.Vt || 0.026;
          I = Is * (Math.exp(V / Vt) - 1);
          P = I * V;
          break;
        }
        case 'V':
          I = 0; // Voltage source
          break;
        case 'I':
          I = comp.value || 0;
          P = I * V;
          break;
      }

      currentMap[comp.name] = I;
      if (P !== undefined) powerMap[comp.name] = Math.abs(P);
    }
  }

  /**
   * Map node voltages to result object
   */
  private mapVoltages(voltages: number[], result: Record<string, number>): void {
    let idx = 0;
    for (const [node, nodeIdx] of this.nodeMap) {
      if (node !== 'GND' && node !== '0') {
        result[node] = voltages[idx] || 0;
        idx++;
      } else {
        result[node] = 0;
      }
    }
  }

  /**
   * Get last values from time series
   */
  private getLastValues(series: Record<string, number[]>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, values] of Object.entries(series)) {
      result[key] = values[values.length - 1] || 0;
    }
    return result;
  }

  /**
   * Validate simulation results for physical constraints
   */
  private validateResults(result: SimulationResult): void {
    // Check for unrealistic values
    for (const [node, voltage] of Object.entries(result.nodeVoltages)) {
      if (Math.abs(voltage) > 1000) {
        result.warnings.push(`Node ${node} has extreme voltage: ${voltage.toFixed(2)}V`);
      }
    }

    for (const [comp, power] of Object.entries(result.powerDissipation)) {
      if (power > 1000) {
        result.warnings.push(`Component ${comp} dissipates excessive power: ${power.toFixed(2)}W`);
      }
    }
  }

  /**
   * Generate SPICE netlist from circuit description
   */
  static generateNetlist(circuit: CircuitNetlist): string {
    let netlist = `${circuit.title}\n`;
    netlist += `* Auto-generated SPICE netlist\n\n`;

    // Components
    for (const comp of circuit.components) {
      switch (comp.type) {
        case 'R':
          netlist += `${comp.name} ${comp.nodes.join(' ')} ${comp.value}Ω\n`;
          break;
        case 'C':
          netlist += `${comp.name} ${comp.nodes.join(' ')} ${comp.value}F\n`;
          break;
        case 'L':
          netlist += `${comp.name} ${comp.nodes.join(' ')} ${comp.value}H\n`;
          break;
        case 'V':
          netlist += `${comp.name} ${comp.nodes.join(' ')} DC ${comp.value}V\n`;
          break;
        case 'I':
          netlist += `${comp.name} ${comp.nodes.join(' ')} DC ${comp.value}A\n`;
          break;
        case 'D':
          netlist += `${comp.name} ${comp.nodes.join(' ')} ${comp.model || 'DMOD'}\n`;
          break;
      }
    }

    netlist += `\n.end\n`;
    return netlist;
  }

  /**
   * Parse SPICE netlist into CircuitNetlist
   */
  static parseNetlist(spiceText: string): CircuitNetlist {
    const lines = spiceText.split('\n').filter((line) => line.trim() && !line.trim().startsWith('*'));

    const circuit: CircuitNetlist = {
      title: lines[0] || 'Circuit',
      components: [],
      nodes: [],
    };

    const nodeSet = new Set<string>();

    for (const line of lines.slice(1)) {
      const tokens = line.trim().split(/\s+/);
      if (tokens[0] === '.end') break;

      const compName = tokens[0];
      const type = compName[0] as 'R' | 'C' | 'L' | 'V' | 'I' | 'D' | 'Q' | 'M';
      const nodes = tokens.slice(1, 3);
      const value = parseFloat(tokens[3]) || 0;

      nodes.forEach((n) => nodeSet.add(n));
      nodeSet.add('GND');

      circuit.components.push({
        type,
        name: compName,
        nodes,
        value,
      });
    }

    circuit.nodes = Array.from(nodeSet);
    return circuit;
  }
}

export default SPICESimulator;
