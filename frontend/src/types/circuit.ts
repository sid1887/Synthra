/**
 * Circuit State Model
 *
 * Single source of truth for all circuit data.
 * Everything else derives from this.
 */

// Pin direction
export enum PinDirection {
  IN = 'input',
  OUT = 'output',
  INOUT = 'inout',
  PWR = 'power',
  GND = 'ground',
}

// Pin definition for a component type
export interface PinDef {
  id: string;           // 'pin1', 'pin2'
  name: string;         // 'A', 'Y', 'VCC'
  direction: PinDirection;
  x: number;            // Pin offset from component origin
  y: number;
}

// Component type library entry
export interface ComponentType {
  id: string;           // 'AND2', 'R', 'C'
  category: string;     // 'Logic', 'Passive', 'Source'
  symbol: string;       // SVG symbol or reference
  width: number;        // Canvas dimensions
  height: number;
  pins: PinDef[];
  parameters?: {        // R, L, C values, etc
    [key: string]: {
      name: string;
      default: string;
      unit: string;
    };
  };
  spiceTemplate?: string;
  vhdlTemplate?: string;
}

// Instantiated component on canvas
export interface ComponentInstance {
  id: string;           // 'R1', 'U1', unique
  typeId: string;       // 'AND2', 'R' - reference to ComponentType
  label: string;        // Display name
  x: number;            // Canvas position
  y: number;
  rotation: 0 | 90 | 180 | 270;
  paramValues?: {       // Actual values: { 'resistance': '10k' }
    [key: string]: string;
  };
}

// Pin instance (concrete pin on a placed component)
export interface PinInstance {
  componentId: string;
  pinId: string;        // 'pin1' from ComponentType.pins
  x: number;            // Absolute canvas position
  y: number;
}

// Net (connection between pins)
export interface Net {
  id: string;           // 'net1', unique
  name: string;         // 'GND', 'VCC', 'signal_A', optional
  pins: PinInstance[];  // All pins connected by this net
  wireSegments?: WireSegment[];
}

// Wire segment (visual representation of connection)
export interface WireSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  style?: 'straight' | 'orthogonal';
}

// Complete circuit state
export interface Circuit {
  id: string;
  name: string;
  description?: string;
  components: ComponentInstance[];
  nets: Net[];
  metadata?: {
    createdAt: string;
    modifiedAt: string;
    author?: string;
  };
}

// Action types for reducer
export type CircuitAction =
  | { type: 'RESET'; payload: Circuit }
  | { type: 'ADD_COMPONENT'; payload: ComponentInstance }
  | { type: 'REMOVE_COMPONENT'; payload: string }
  | { type: 'UPDATE_COMPONENT'; payload: ComponentInstance }
  | { type: 'MOVE_COMPONENT'; payload: { id: string; x: number; y: number } }
  | { type: 'ROTATE_COMPONENT'; payload: { id: string; rotation: 0 | 90 | 180 | 270 } }
  | { type: 'ADD_NET'; payload: Net }
  | { type: 'REMOVE_NET'; payload: string }
  | { type: 'UPDATE_NET'; payload: Net }
  | { type: 'START_WIRE_DRAG'; payload: { fromPin: PinInstance } }
  | { type: 'COMMIT_NET'; payload: { toPin: PinInstance } }
  | { type: 'CLEAR' };

/**
 * Utility function: Calculate absolute pin position
 */
export function getPinAbsolutePosition(
  component: ComponentInstance,
  componentType: ComponentType,
  pinDef: PinDef
): { x: number; y: number } {
  // Apply rotation to pin offset
  let px = pinDef.x;
  let py = pinDef.y;

  switch (component.rotation) {
    case 90:
      [px, py] = [py, -px];
      break;
    case 180:
      [px, py] = [-px, -py];
      break;
    case 270:
      [px, py] = [-py, px];
      break;
  }

  return {
    x: component.x + px,
    y: component.y + py,
  };
}

/**
 * Utility function: Check if two pins are close enough to connect
 */
export function arePointsNear(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  tolerance: number = 5
): boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy) < tolerance;
}

/**
 * Utility function: Generate orthogonal wire path (Manhattan routing)
 */
export function generateOrthogonalPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): WireSegment[] {
  const segments: WireSegment[] = [];
  const midX = (x1 + x2) / 2;

  // Horizontal -> Vertical -> Horizontal
  segments.push({ x1, y1, x2: midX, y2: y1 });
  segments.push({ x1: midX, y1, x2: midX, y2 });
  segments.push({ x1: midX, y1: y2, x2, y2 });

  return segments;
}
