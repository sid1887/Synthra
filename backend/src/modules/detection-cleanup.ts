/**
 * A5: Detection Cleanup Pipeline
 * Normalizes and dedups detected components
 */

import { ComponentDetection } from '../types/schemas.js';

// Canonical component library with aliases
const COMPONENT_LIBRARY: Record<string, { canonical: string; aliases: string[]; role: string }> = {
  resistor: {
    canonical: 'resistor',
    aliases: ['res', 'r', 'carbon_film', 'metal_film', 'potentiometer', 'rheostat', 'variable_resistor'],
    role: 'current_limiting',
  },
  capacitor: {
    canonical: 'capacitor',
    aliases: ['cap', 'c', 'electrolytic', 'disc', 'ceramic', 'film', 'polarized'],
    role: 'energy_storage',
  },
  inductor: {
    canonical: 'inductor',
    aliases: ['ind', 'l', 'coil', 'choke'],
    role: 'filtering',
  },
  diode: {
    canonical: 'diode',
    aliases: ['1n4148', '1n4007', 'rectifier', 'signal_diode'],
    role: 'protection',
  },
  led: {
    canonical: 'led',
    aliases: ['light_emitting_diode', 'indicator_led', 'rgb_led'],
    role: 'indicator',
  },
  transistor: {
    canonical: 'transistor',
    aliases: ['bjt', 'fet', 'mosfet', 'jfet', '2n2222', '2n3904', 'bc547'],
    role: 'switching',
  },
  battery: {
    canonical: 'battery',
    aliases: ['power_source', 'dc_source', 'cell', 'aa', 'aaa', '9v'],
    role: 'power',
  },
  switch: {
    canonical: 'switch',
    aliases: ['button', 'momentary', 'pushbutton', 'toggle'],
    role: 'control',
  },
  ic: {
    canonical: 'ic',
    aliases: ['integrated_circuit', 'chip', 'microcontroller', 'op_amp', 'opamp', 'timer'],
    role: 'logic',
  },
  wire: {
    canonical: 'wire',
    aliases: ['conductor', 'connection', 'trace'],
    role: 'connection',
  },
};

/**
 * Normalize component label to canonical form
 */
export function normalizeComponentLabel(label: string): {
  canonical: string;
  found: boolean;
} {
  const input = label.toLowerCase().trim();

  for (const [canonical, { aliases }] of Object.entries(COMPONENT_LIBRARY)) {
    if (canonical === input || aliases.includes(input)) {
      return { canonical, found: true };
    }
  }

  return { canonical: label, found: false };
}

/**
 * Deduplicate components by merging nearby detections with same canonical label
 */
export function deduplicateComponents(
  components: ComponentDetection[],
  distanceThreshold: number = 50,
): ComponentDetection[] {
  if (components.length <= 1) return components;

  const merged: ComponentDetection[] = [];
  const used = new Set<number>();

  for (let i = 0; i < components.length; i++) {
    if (used.has(i)) continue;

    const current = components[i];
    const group = [i];

    // Find components close to this one
    for (let j = i + 1; j < components.length; j++) {
      if (used.has(j)) continue;
      const other = components[j];

      // Same canonical label and spatially close?
      if (
        current.canonicalLabel === other.canonicalLabel &&
        bboxDistance(current.bbox, other.bbox) < distanceThreshold
      ) {
        group.push(j);
      }
    }

    // Merge group
    if (group.length === 1) {
      merged.push(current);
    } else {
      const mergedComponent = mergeComponentGroup(components, group);
      merged.push(mergedComponent);
      group.forEach((idx) => used.add(idx));
    }

    used.add(i);
  }

  return merged;
}

/**
 * Merge multiple component detections into single best result
 */
function mergeComponentGroup(components: ComponentDetection[], indices: number[]): ComponentDetection {
  const group = indices.map((i) => components[i]);

  // Average confidence
  const avgConfidence = group.reduce((sum, c) => sum + c.confidence, 0) / group.length;

  // Merge bounding boxes
  const xs = group.flatMap((c) => [c.bbox.x, c.bbox.x + c.bbox.w]);
  const ys = group.flatMap((c) => [c.bbox.y, c.bbox.y + c.bbox.h]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Use best confidence detection as template
  const best = group.reduce((b, c) => (c.confidence > b.confidence ? c : b));

  return {
    ...best,
    id: `merged_${best.id}`,
    confidence: Math.min(avgConfidence * 0.95, 0.99),
    bbox: {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    },
  };
}

/**
 * Calculate distance between two bounding boxes (center-to-center)
 */
function bboxDistance(box1: { x: number; y: number; w: number; h: number }, box2: { x: number; y: number; w: number; h: number }): number {
  const c1x = box1.x + box1.w / 2;
  const c1y = box1.y + box1.h / 2;
  const c2x = box2.x + box2.w / 2;
  const c2y = box2.y + box2.h / 2;
  return Math.sqrt((c1x - c2x) ** 2 + (c1y - c2y) ** 2);
}

/**
 * Aggregate confidence scores across multiple detections of same component
 */
export function aggregateConfidence(confidences: number[]): number {
  if (confidences.length === 0) return 0;
  if (confidences.length === 1) return confidences[0];

  // Weighted average favoring consistent high confidence
  const sorted = [...confidences].sort((a, b) => b - a);
  const weighted = sorted.reduce((sum, conf, i) => sum + conf * (1 - i * 0.1), 0) / confidences.length;

  return Math.min(weighted, 0.99);
}

/**
 * Cleanup detected components: normalize, dedupe, aggregate
 */
export function cleanupDetections(rawComponents: ComponentDetection[]): ComponentDetection[] {
  // Step 1: Normalize labels
  const normalized = rawComponents.map((comp) => {
    const { canonical, found } = normalizeComponentLabel(comp.label);
    return {
      ...comp,
      canonicalLabel: canonical,
      unknown: !found || comp.confidence < 0.5,
    };
  });

  // Step 2: Deduplicate spatially close components with same label
  const deduped = deduplicateComponents(normalized);

  // Step 3: Filter low confidence
  const filtered = deduped.filter((c) => c.confidence >= 0.3 || c.unknown);

  // Step 4: Add roles
  return filtered.map((comp) => {
    const libEntry = COMPONENT_LIBRARY[comp.canonicalLabel];
    return {
      ...comp,
      role: libEntry?.role || 'unknown',
    };
  });
}
