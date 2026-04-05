/**
 * Simulation engine tests
 */
import { simulateCircuit } from '../../modules/simulation-engine';
import { ComponentDetection } from '../../types/schemas';

describe('Simulation Engine', () => {
  describe('simulateCircuit', () => {
    it('should simulate simple LED circuit (5V battery, 430Ω resistor, LED)', () => {
      const components: ComponentDetection[] = [
        {
          id: 'b1',
          label: 'battery',
          canonicalLabel: 'battery',
          confidence: 0.95,
          bbox: { x: 50, y: 100, w: 80, h: 150 },
          orientation: 'vertical',
          polarity: 'positive',
          value: '5V',
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
          value: '430Ω',
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
          value: 'red',
          unknown: false,
        },
      ];

      const sim = simulateCircuit(components);

      expect(sim.power_voltage).toBe(5.0);
      expect(sim.components.length).toBeGreaterThan(0);

      // LED should have ~2V drop
      const led = sim.components.find(c => c.componentId === 'l1');
      expect(led).toBeDefined();
      expect(led?.status).toBe('on');
      expect(led!.current).toBeGreaterThan(5); // Should be around 7mA or so
    });

    it('should handle missing battery gracefully', () => {
      const components: ComponentDetection[] = [
        {
          id: 'r1',
          label: 'resistor',
          canonicalLabel: 'resistor',
          confidence: 0.87,
          bbox: { x: 200, y: 120, w: 100, h: 30 },
          orientation: 'horizontal',
          polarity: 'na',
          value: '430Ω',
          unknown: false,
        },
      ];

      const sim = simulateCircuit(components);
      expect(sim.power_voltage).toBeUndefined();
      expect(sim.notes).toContain('No battery');
    });

    it('should warn when current exceeds LED maximum', () => {
      const components: ComponentDetection[] = [
        {
          id: 'b1',
          label: 'battery',
          canonicalLabel: 'battery',
          confidence: 0.95,
          bbox: { x: 50, y: 100, w: 80, h: 150 },
          orientation: 'vertical',
          polarity: 'positive',
          value: '15V',
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
          value: '100Ω', // Very low, will exceed LED max
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

      const sim = simulateCircuit(components);
      expect(sim.warnings.length).toBeGreaterThan(0);
      expect(sim.warnings[0]).toContain('exceeds');
    });

    it('should warn when current is very low', () => {
      const components: ComponentDetection[] = [
        {
          id: 'b1',
          label: 'battery',
          canonicalLabel: 'battery',
          confidence: 0.95,
          bbox: { x: 50, y: 100, w: 80, h: 150 },
          orientation: 'vertical',
          polarity: 'positive',
          value: '5V',
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
          value: '10000000Ω', // Very high
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

      const sim = simulateCircuit(components);
      expect(sim.warnings.length).toBeGreaterThan(0);
      expect(sim.warnings[0]).toContain('low');
    });
  });
});
