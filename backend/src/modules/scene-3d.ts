/**
 * C2: 3D Scene Foundation
 * 3D visualization, component models, confidence overlay, and scene controls
 * Uses Three.js abstractions for compatibility
 */

import { ComponentDetection, CircuitIdentification } from '../types/schemas.js';

/**
 * 3D Component Model geometry definition
 */
export interface ComponentModel3D {
  componentId: string;
  canonicalLabel: string;
  geometry: {
    type: 'box' | 'cylinder' | 'sphere' | 'custom';
    dimensions: { width: number; height: number; depth: number };
  };
  material: {
    color: string;
    metalness: number;
    roughness: number;
    emissive: string;
  };
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}

/**
 * 3D Circuit Edge connection
 */
export interface CircuitEdge3D {
  from: string; // component ID
  to: string; // component ID
  path: Array<{ x: number; y: number; z: number }>;
  wireColor: string;
  thickness: number;
  status: 'ok' | 'weak' | 'broken';
}

/**
 * 3D Scene state
 */
export interface Scene3D {
  sceneId: string;
  circuit: CircuitIdentification;
  components: ComponentModel3D[];
  edges: CircuitEdge3D[];
  lighting: {
    ambientIntensity: number;
    directionalIntensity: number;
  };
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov: number;
  };
  metadata: {
    createdAt: string;
    rendererWidth: number;
    rendererHeight: number;
    pixelRatio: number;
  };
}

/**
 * Confidence overlay for 3D scene
 */
export interface ConfidenceOverlay {
  componentId: string;
  confidence: number; // 0-1
  visualType: 'glow' | 'halo' | 'transparency' | 'scale';
  color: string;
  intensity: number;
}

/**
 * 3D interaction event
 */
export interface Scene3DInteraction {
  type: 'hover' | 'click' | 'rotate' | 'zoom' | 'pan';
  componentId?: string;
  cursorX: number;
  cursorY: number;
  delta?: { dx: number; dy: number; dz: number };
}

/**
 * Color mapping for components
 */
const componentColorMap: Record<string, string> = {
  resistor: '#C41E3A',
  capacitor: '#1E90FF',
  inductor: '#FF6347',
  diode: '#FFD700',
  led: '#00FF00',
  transistor: '#FF1493',
  battery: '#000000',
  ground: '#808080',
  wire: '#888888',
  switch: '#FF8C00',
  unknown: '#A9A9A9',
};

/**
 * Get canonical 3D model dimensions for component type
 */
function getComponentDimensions(
  label: string,
): { width: number; height: number; depth: number } {
  const dims: Record<string, { width: number; height: number; depth: number }> = {
    resistor: { width: 12, height: 3, depth: 3 },
    capacitor: { width: 8, height: 10, depth: 2 },
    inductor: { width: 6, height: 6, depth: 6 },
    diode: { width: 6, height: 8, depth: 2 },
    led: { width: 4, height: 4, depth: 4 },
    transistor: { width: 10, height: 8, depth: 8 },
    battery: { width: 6, height: 15, depth: 6 },
    ground: { width: 4, height: 2, depth: 4 },
    wire: { width: 1, height: 1, depth: 1 },
    switch: { width: 12, height: 4, depth: 4 },
  };

  return dims[label] || { width: 8, height: 8, depth: 8 };
}

/**
 * Generate 3D component models from detection results
 */
export function generateComponentModels(
  components: ComponentDetection[],
  layout: 'grid' | 'circular' | 'auto' = 'auto',
): ComponentModel3D[] {
  const models: ComponentModel3D[] = [];

  let angle = 0;
  const radius = 40;

  components.forEach((comp, idx) => {
    const dimType = getComponentDimensions(comp.canonicalLabel);
    const color = componentColorMap[comp.canonicalLabel] || '#A9A9A9';

    let x = 0,
      y = idx * 15,
      z = 0;

    if (layout === 'circular') {
      angle = (idx / components.length) * Math.PI * 2;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
    } else if (layout === 'grid') {
      const cols = Math.ceil(Math.sqrt(components.length));
      x = (idx % cols) * 20 - (cols * 20) / 2;
      y = 0;
      z = Math.floor(idx / cols) * 20;
    }

    const model: ComponentModel3D = {
      componentId: comp.id,
      canonicalLabel: comp.canonicalLabel,
      geometry: {
        type: comp.canonicalLabel === 'wire' ? 'cylinder' : 'box',
        dimensions: dimType,
      },
      material: {
        color,
        metalness: 0.6,
        roughness: 0.4,
        emissive: comp.confidence < 0.7 ? '#333333' : '#000000',
      },
      position: { x, y, z },
      rotation: { x: 0, y: angle, z: 0 },
      scale: 1.0,
    };

    models.push(model);
  });

  return models;
}

/**
 * Generate 3D wire connections between components
 */
export function generateCircuitEdges(
  components: ComponentModel3D[],
  circuit: CircuitIdentification,
): CircuitEdge3D[] {
  const edges: CircuitEdge3D[] = [];

  // Simple strategy: connect adjacent components in circuit order
  // In real implementation, would use netlist from schematic reconstruction

  for (let i = 0; i < components.length - 1; i++) {
    const from = components[i];
    const to = components[i + 1];

    // Generate smooth bezier curve between components
    const ctrl1 = {
      x: from.position.x + (to.position.x - from.position.x) * 0.33,
      y: from.position.y + 10,
      z: from.position.z + (to.position.z - from.position.z) * 0.33,
    };

    const ctrl2 = {
      x: from.position.x + (to.position.x - from.position.x) * 0.67,
      y: from.position.y + 10,
      z: from.position.z + (to.position.z - from.position.z) * 0.67,
    };

    // Generate bezier curve points
    const path = [];
    for (let t = 0; t <= 1; t += 0.1) {
      const t2 = t * t;
      const mt = 1 - t;
      const mt2 = mt * mt;

      const x =
        mt2 * mt * from.position.x +
        3 * mt2 * t * ctrl1.x +
        3 * mt * t2 * ctrl2.x +
        t2 * t * to.position.x;

      const y =
        mt2 * mt * from.position.y +
        3 * mt2 * t * ctrl1.y +
        3 * mt * t2 * ctrl2.y +
        t2 * t * to.position.y;

      const z =
        mt2 * mt * from.position.z +
        3 * mt2 * t * ctrl1.z +
        3 * mt * t2 * ctrl2.z +
        t2 * t * to.position.z;

      path.push({ x, y, z });
    }

    edges.push({
      from: from.componentId,
      to: to.componentId,
      path,
      wireColor: '#888888',
      thickness: 1,
      status: 'ok',
    });
  }

  return edges;
}

/**
 * Create initial 3D scene
 */
export function initializeScene(
  components: ComponentDetection[],
  circuit: CircuitIdentification,
  rendererWidth: number = 1024,
  rendererHeight: number = 768,
): Scene3D {
  const componentModels = generateComponentModels(components, 'circular');
  const edges = generateCircuitEdges(componentModels, circuit);

  const bbox = calculateBoundingBox(componentModels);

  // Compute ideal camera position (viewing from diagonal)
  const distance = Math.max(
    Math.abs(bbox.max.x - bbox.min.x),
    Math.abs(bbox.max.z - bbox.min.z),
  );
  const cameraDistance = distance * 1.5;

  return {
    sceneId: `scene_${Date.now()}`,
    circuit,
    components: componentModels,
    edges,
    lighting: {
      ambientIntensity: 0.6,
      directionalIntensity: 1.0,
    },
    camera: {
      position: {
        x: cameraDistance * 0.5,
        y: cameraDistance * 0.5,
        z: cameraDistance * 0.5,
      },
      target: { x: 0, y: 0, z: 0 },
      fov: 45,
    },
    metadata: {
      createdAt: new Date().toISOString(),
      rendererWidth,
      rendererHeight,
      pixelRatio: 1.0,
    },
  };
}

/**
 * Calculate bounding box of all components
 */
function calculateBoundingBox(
  components: ComponentModel3D[],
): {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
} {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity,
    maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  components.forEach((comp) => {
    minX = Math.min(minX, comp.position.x - comp.geometry.dimensions.width / 2);
    maxX = Math.max(maxX, comp.position.x + comp.geometry.dimensions.width / 2);
    minY = Math.min(minY, comp.position.y - comp.geometry.dimensions.height / 2);
    maxY = Math.max(maxY, comp.position.y + comp.geometry.dimensions.height / 2);
    minZ = Math.min(minZ, comp.position.z - comp.geometry.dimensions.depth / 2);
    maxZ = Math.max(maxZ, comp.position.z + comp.geometry.dimensions.depth / 2);
  });

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };
}

/**
 * Apply confidence overlay to scene
 */
export function applyConfidenceOverlay(
  scene: Scene3D,
  confidenceByComponent: Map<string, number>,
): ConfidenceOverlay[] {
  const overlays: ConfidenceOverlay[] = [];

  Array.from(confidenceByComponent.entries()).forEach(([componentId, confidence]) => {
    if (confidence < 0.75) {
      let visualType: ConfidenceOverlay['visualType'];
      let intensity: number;

      if (confidence < 0.5) {
        visualType = 'transparency';
        intensity = 0.3; // very transparent
      } else if (confidence < 0.65) {
        visualType = 'halo';
        intensity = 0.7;
      } else {
        visualType = 'glow';
        intensity = 0.4;
      }

      overlays.push({
        componentId,
        confidence,
        visualType,
        color: '#FFFF00', // yellow warning
        intensity,
      });
    }
  });

  return overlays;
}

/**
 * Update scene based on simulation state
 */
export function updateSceneFromSimulation(
  scene: Scene3D,
  simulationState: any, // transient response
): Scene3D {
  const updated = { ...scene };

  // Update material properties based on component status
  updated.components = updated.components.map((comp) => {
    const simComp = simulationState.components.find(
      (c: any) => c.componentId === comp.componentId,
    );

    if (!simComp) return comp;

    const updated = { ...comp };

    // Animate scale based on current
    if (simComp.current > 100) {
      updated.scale = 1.2; // heat dissipation indicator
    }

    // Update emissive based on power
    if (simComp.power > 50) {
      updated.material = {
        ...updated.material,
        emissive: '#FF4500', // orange glow for high power
      };
    } else if (simComp.power > 10) {
      updated.material = {
        ...updated.material,
        emissive: '#FFD700', // gold for moderate power
      };
    }

    return updated;
  });

  return updated;
}

/**
 * Generate scene controls JSON for UI
 */
export function getSceneControls(): Record<string, any> {
  return {
    camera: {
      auto_rotate: true,
      auto_rotate_speed: 2,
      zoom_speed: 1.0,
      pan_speed: 0.5,
    },
    rendering: {
      antialiasing: true,
      shadow_quality: 'high',
      reflection_quality: 'low',
    },
    visualization: {
      show_wires: true,
      show_confidence: true,
      show_labels: true,
      highlight_invalid: true,
      animation_speed: 1.0,
    },
    interaction: {
      hover_tooltip: true,
      click_inspect: true,
      double_click_isolate: true,
    },
  };
}

/**
 * Handle 3D scene interaction
 */
export function handleSceneInteraction(
  scene: Scene3D,
  interaction: Scene3DInteraction,
): { updated: Scene3D; action?: string } {
  const updated = { ...scene };

  switch (interaction.type) {
    case 'hover':
      return { updated, action: `Hovering over ${interaction.componentId}` };

    case 'click':
      if (interaction.componentId) {
        const comp = updated.components.find((c) => c.componentId === interaction.componentId);
        if (comp) {
          comp.scale = 1.5; // highlight
        }
      }
      return { updated, action: `Selected ${interaction.componentId}` };

    case 'rotate':
      if (interaction.delta) {
        updated.camera.position.x += interaction.delta.dx * 0.1;
        updated.camera.position.z += interaction.delta.dz * 0.1;
      }
      return { updated, action: 'Rotating view' };

    case 'zoom':
      if (interaction.delta) {
        const factor = 1 + interaction.delta.dy * 0.01;
        updated.camera.position.x *= factor;
        updated.camera.position.y *= factor;
        updated.camera.position.z *= factor;
      }
      return { updated, action: 'Zooming' };

    default:
      return { updated };
  }
}

/**
 * Export scene to JSON for serialization
 */
export function serializeScene(scene: Scene3D): string {
  return JSON.stringify(scene, null, 2);
}

/**
 * Import scene from JSON
 */
export function deserializeScene(json: string): Scene3D {
  return JSON.parse(json) as Scene3D;
}
