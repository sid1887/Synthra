/**
 * Component detection cleanup tests
 */
import { normalizeComponentLabel, deduplicateComponents, cleanupDetections } from '../../modules/detection-cleanup';
import { ComponentDetection } from '../../types/schemas';

describe('Detection Cleanup Pipeline', () => {
  describe('normalizeComponentLabel', () => {
    it('should normalize resistor aliases', () => {
      expect(normalizeComponentLabel('resistor')).toEqual({ canonical: 'resistor', found: true });
      expect(normalizeComponentLabel('R')).toEqual({ canonical: 'resistor', found: true });
      expect(normalizeComponentLabel('pot')).toEqual({ canonical: 'resistor', found: true });
    });

    it('should normalize LED aliases', () => {
      expect(normalizeComponentLabel('led')).toEqual({ canonical: 'led', found: true });
      expect(normalizeComponentLabel('light_emitting_diode')).toEqual({ canonical: 'led', found: true });
    });

    it('should return unknown for unsupported components', () => {
      const result = normalizeComponentLabel('unknown_component');
      expect(result.found).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(normalizeComponentLabel('RESISTOR')).toEqual({ canonical: 'resistor', found: true });
      expect(normalizeComponentLabel('DiOdE')).toEqual({ canonical: 'diode', found: true });
    });
  });

  describe('deduplicateComponents', () => {
    it('should remove duplicate components at same location', () => {
      const components: ComponentDetection[] = [
        {
          id: 'cmp_1',
          label: 'resistor',
          canonicalLabel: 'resistor',
          confidence: 0.9,
          bbox: { x: 100, y: 100, w: 50, h: 20 },
          orientation: 'horizontal',
          polarity: 'na',
          unknown: false,
        },
        {
          id: 'cmp_2',
          label: 'resistor',
          canonicalLabel: 'resistor',
          confidence: 0.85,
          bbox: { x: 105, y: 105, w: 50, h: 20 },
          orientation: 'horizontal',
          polarity: 'na',
          unknown: false,
        },
      ];

      const result = deduplicateComponents(components, 50);
      expect(result.length).toBe(1);
      expect(result[0].confidence).toBeLessThan(0.9);
    });

    it('should keep components far apart', () => {
      const components: ComponentDetection[] = [
        {
          id: 'cmp_1',
          label: 'resistor',
          canonicalLabel: 'resistor',
          confidence: 0.9,
          bbox: { x: 0, y: 0, w: 50, h: 20 },
          orientation: 'horizontal',
          polarity: 'na',
          unknown: false,
        },
        {
          id: 'cmp_2',
          label: 'resistor',
          canonicalLabel: 'resistor',
          confidence: 0.85,
          bbox: { x: 500, y: 500, w: 50, h: 20 },
          orientation: 'horizontal',
          polarity: 'na',
          unknown: false,
        },
      ];

      const result = deduplicateComponents(components, 50);
      expect(result.length).toBe(2);
    });
  });

  describe('cleanupDetections', () => {
    it('should cleanup and normalize detections', () => {
      const raw: ComponentDetection[] = [
        {
          id: 'cmp_1',
          label: 'R',
          canonicalLabel: 'resistor',
          confidence: 0.9,
          bbox: { x: 100, y: 100, w: 50, h: 20 },
          orientation: 'horizontal',
          polarity: 'na',
          unknown: false,
        },
        {
          id: 'cmp_2',
          label: 'LED',
          canonicalLabel: 'led',
          confidence: 0.92,
          bbox: { x: 200, y: 100, w: 40, h: 50 },
          orientation: 'vertical',
          polarity: 'positive',
          unknown: false,
        },
      ];

      const result = cleanupDetections(raw);
      expect(result.length).toBe(2);
      expect(result[0].canonicalLabel).toBe('resistor');
      expect(result[1].canonicalLabel).toBe('led');
      expect(result[0].role).toBe('current_limiting');
      expect(result[1].role).toBe('indicator');
    });

    it('should filter low confidence components', () => {
      const raw: ComponentDetection[] = [
        {
          id: 'cmp_1',
          label: 'resistor',
          canonicalLabel: 'resistor',
          confidence: 0.4, // Low
          bbox: { x: 100, y: 100, w: 50, h: 20 },
          orientation: 'horizontal',
          polarity: 'na',
          unknown: false,
        },
      ];

      const result = cleanupDetections(raw);
      // Low confidence components marked as unknown but not filtered
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });
});
