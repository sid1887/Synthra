/**
 * Circuit engine tests
 */
import { identifyCircuit, getCircuitDiagnostics } from '../../modules/circuit-engine';
import { ComponentDetection } from '../../types/schemas';

describe('Circuit Engine', () => {
  describe('identifyCircuit', () => {
    it('should identify simple LED circuit', () => {
      const components: ComponentDetection[] = [
        {
          id: 'b1',
          label: 'battery',
          canonicalLabel: 'battery',
          confidence: 0.95,
          bbox: { x: 50, y: 100, w: 80, h: 150 },
          orientation: 'vertical',
          polarity: 'positive',
          unknown: false,
        },
        {
          id: 'r1',
          label: 'resistor',
          canonicalLabel: 'resistor',
          confidence: 0.87,
          bbox: { x: 200, y: 120, w: 100, h: 30 },
          orientation: 'horizontal',
          polarity: 'na',
          unknown: false,
        },
        {
          id: 'l1',
          label: 'led',
          canonicalLabel: 'led',
          confidence: 0.91,
          bbox: { x: 380, y: 110, w: 40, h: 50 },
          orientation: 'vertical',
          polarity: 'positive',
          unknown: false,
        },
      ];

      const circuit = identifyCircuit(components);
      expect(circuit.label).toBe('battery_resistor_led');
      expect(circuit.confidence).toBeGreaterThan(0.8);
      expect(circuit.complexity).toBe('simple');
    });

    it('should identify parallel LED circuit', () => {
      const components: ComponentDetection[] = [
        {
          id: 'b1',
          label: 'battery',
          canonicalLabel: 'battery',
          confidence: 0.92,
          bbox: { x: 20, y: 80, w: 70, h: 140 },
          orientation: 'vertical',
          polarity: 'positive',
          unknown: false,
        },
        {
          id: 'r1',
          label: 'resistor',
          canonicalLabel: 'resistor',
          confidence: 0.85,
          bbox: { x: 140, y: 100, w: 90, h: 25 },
          orientation: 'horizontal',
          polarity: 'na',
          unknown: false,
        },
        {
          id: 'l1',
          label: 'led',
          canonicalLabel: 'led',
          confidence: 0.89,
          bbox: { x: 300, y: 70, w: 35, h: 50 },
          orientation: 'vertical',
          polarity: 'positive',
          unknown: false,
        },
        {
          id: 'l2',
          label: 'led',
          canonicalLabel: 'led',
          confidence: 0.88,
          bbox: { x: 300, y: 140, w: 35, h: 50 },
          orientation: 'vertical',
          polarity: 'positive',
          unknown: false,
        },
      ];

      const circuit = identifyCircuit(components);
      expect(circuit.label).toBe('parallel_led_output');
      expect(circuit.confidence).toBeGreaterThan(0.8);
    });

    it('should identify resistor divider', () => {
      const components: ComponentDetection[] = [
        {
          id: 'b1',
          label: 'battery',
          canonicalLabel: 'battery',
          confidence: 0.93,
          bbox: { x: 30, y: 70, w: 75, h: 150 },
          orientation: 'vertical',
          polarity: 'positive',
          unknown: false,
        },
        {
          id: 'r1',
          label: 'resistor',
          canonicalLabel: 'resistor',
          confidence: 0.84,
          bbox: { x: 150, y: 90, w: 95, h: 28 },
          orientation: 'horizontal',
          polarity: 'na',
          unknown: false,
        },
        {
          id: 'r2',
          label: 'resistor',
          canonicalLabel: 'resistor',
          confidence: 0.86,
          bbox: { x: 300, y: 90, w: 95, h: 28 },
          orientation: 'horizontal',
          polarity: 'na',
          unknown: false,
        },
      ];

      const circuit = identifyCircuit(components);
      expect(circuit.label).toBe('resistor_divider');
      expect(circuit.confidence).toBeGreaterThan(0.8);
    });

    it('should return unknown for empty component list', () => {
      const circuit = identifyCircuit([]);
      expect(circuit.label).toBe('unidentified_topology');
    });
  });

  describe('getCircuitDiagnostics', () => {
    it('should warn about missing resistor with LED', () => {
      const components: ComponentDetection[] = [
        {
          id: 'b1',
          label: 'battery',
          canonicalLabel: 'battery',
          confidence: 0.95,
          bbox: { x: 50, y: 100, w: 80, h: 150 },
          orientation: 'vertical',
          polarity: 'positive',
          unknown: false,
        },
        {
          id: 'l1',
          label: 'led',
          canonicalLabel: 'led',
          confidence: 0.91,
          bbox: { x: 380, y: 110, w: 40, h: 50 },
          orientation: 'vertical',
          polarity: 'positive',
          unknown: false,
        },
      ];

      const circuit = identifyCircuit(components);
      const diagnostics = getCircuitDiagnostics(components, circuit);
      
      const missingResistor = diagnostics.find(d => d.code === 'MISSING_RESISTOR');
      expect(missingResistor).toBeDefined();
      expect(missingResistor?.severity).toBe('warning');
    });

    it('should error on missing power source', () => {
      const components: ComponentDetection[] = [
        {
          id: 'r1',
          label: 'resistor',
          canonicalLabel: 'resistor',
          confidence: 0.87,
          bbox: { x: 200, y: 120, w: 100, h: 30 },
          orientation: 'horizontal',
          polarity: 'na',
          unknown: false,
        },
      ];

      const circuit = identifyCircuit(components);
      const diagnostics = getCircuitDiagnostics(components, circuit);
      
      const missingPower = diagnostics.find(d => d.code === 'MISSING_POWER');
      expect(missingPower).toBeDefined();
      expect(missingPower?.severity).toBe('error');
    });
  });
});
