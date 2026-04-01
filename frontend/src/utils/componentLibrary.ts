/**
 * Component Library
 *
 * Registry of all available component types.
 * Each component has pins, visual dimensions, and HDL templates.
 */

import { ComponentType, PinDirection } from '../types/circuit';

// Logic components
const AND2: ComponentType = {
  id: 'AND2',
  category: 'Logic',
  symbol: 'AND2',
  width: 40,
  height: 40,
  pins: [
    { id: 'pin1', name: 'A', direction: PinDirection.IN, x: -20, y: -8 },
    { id: 'pin2', name: 'B', direction: PinDirection.IN, x: -20, y: 8 },
    { id: 'pin3', name: 'Y', direction: PinDirection.OUT, x: 20, y: 0 },
  ],
  spiceTemplate: 'AND2(Y, A, B)',
  vhdlTemplate: 'Y <= A and B;',
};

const OR2: ComponentType = {
  id: 'OR2',
  category: 'Logic',
  symbol: 'OR2',
  width: 40,
  height: 40,
  pins: [
    { id: 'pin1', name: 'A', direction: PinDirection.IN, x: -20, y: -8 },
    { id: 'pin2', name: 'B', direction: PinDirection.IN, x: -20, y: 8 },
    { id: 'pin3', name: 'Y', direction: PinDirection.OUT, x: 20, y: 0 },
  ],
  spiceTemplate: 'OR2(Y, A, B)',
  vhdlTemplate: 'Y <= A or B;',
};

const NOT: ComponentType = {
  id: 'NOT',
  category: 'Logic',
  symbol: 'NOT',
  width: 30,
  height: 30,
  pins: [
    { id: 'pin1', name: 'A', direction: PinDirection.IN, x: -15, y: 0 },
    { id: 'pin2', name: 'Y', direction: PinDirection.OUT, x: 15, y: 0 },
  ],
  spiceTemplate: 'NOT(Y, A)',
  vhdlTemplate: 'Y <= not A;',
};

// Passive components
const RESISTOR: ComponentType = {
  id: 'R',
  category: 'Passive',
  symbol: 'RESISTOR',
  width: 50,
  height: 20,
  pins: [
    { id: 'pin1', name: 'A', direction: PinDirection.INOUT, x: -25, y: 0 },
    { id: 'pin2', name: 'B', direction: PinDirection.INOUT, x: 25, y: 0 },
  ],
  parameters: {
    resistance: {
      name: 'Resistance',
      default: '1k',
      unit: 'Ω',
    },
  },
  spiceTemplate: 'R<index> <node1> <node2> <resistance>',
  vhdlTemplate: '-- Resistor: <resistance> between nodes',
};

const CAPACITOR: ComponentType = {
  id: 'C',
  category: 'Passive',
  symbol: 'CAPACITOR',
  width: 20,
  height: 40,
  pins: [
    { id: 'pin1', name: 'A', direction: PinDirection.INOUT, x: 0, y: -20 },
    { id: 'pin2', name: 'B', direction: PinDirection.INOUT, x: 0, y: 20 },
  ],
  parameters: {
    capacitance: {
      name: 'Capacitance',
      default: '1u',
      unit: 'F',
    },
  },
  spiceTemplate: 'C<index> <node1> <node2> <capacitance>',
};

const INDUCTOR: ComponentType = {
  id: 'L',
  category: 'Passive',
  symbol: 'INDUCTOR',
  width: 30,
  height: 20,
  pins: [
    { id: 'pin1', name: 'A', direction: PinDirection.INOUT, x: -15, y: 0 },
    { id: 'pin2', name: 'B', direction: PinDirection.INOUT, x: 15, y: 0 },
  ],
  parameters: {
    inductance: {
      name: 'Inductance',
      default: '1u',
      unit: 'H',
    },
  },
  spiceTemplate: 'L<index> <node1> <node2> <inductance>',
};

// Sources
const VOLTAGE_SOURCE: ComponentType = {
  id: 'V',
  category: 'Source',
  symbol: 'VOLTAGE',
  width: 30,
  height: 30,
  pins: [
    { id: 'pin1', name: '+', direction: PinDirection.OUT, x: 0, y: -15 },
    { id: 'pin2', name: '-', direction: PinDirection.OUT, x: 0, y: 15 },
  ],
  parameters: {
    voltage: {
      name: 'Voltage',
      default: '5V',
      unit: 'V',
    },
  },
  spiceTemplate: 'V<index> <node+> <node-> DC <voltage>',
};

const CURRENT_SOURCE: ComponentType = {
  id: 'I',
  category: 'Source',
  symbol: 'CURRENT',
  width: 30,
  height: 30,
  pins: [
    { id: 'pin1', name: '+', direction: PinDirection.OUT, x: 0, y: -15 },
    { id: 'pin2', name: '-', direction: PinDirection.OUT, x: 0, y: 15 },
  ],
  parameters: {
    current: {
      name: 'Current',
      default: '1mA',
      unit: 'A',
    },
  },
  spiceTemplate: 'I<index> <node+> <node-> DC <current>',
};

// Other components
const DIODE: ComponentType = {
  id: 'D',
  category: 'Semiconductor',
  symbol: 'DIODE',
  width: 20,
  height: 30,
  pins: [
    { id: 'pin1', name: 'A', direction: PinDirection.IN, x: 0, y: -15 },
    { id: 'pin2', name: 'C', direction: PinDirection.OUT, x: 0, y: 15 },
  ],
  spiceTemplate: 'D<index> <anode> <cathode> <model>',
};

const TRANSISTOR_NPN: ComponentType = {
  id: 'Q',
  category: 'Semiconductor',
  symbol: 'BJT_NPN',
  width: 40,
  height: 50,
  pins: [
    { id: 'pin1', name: 'C', direction: PinDirection.INOUT, x: 20, y: -25 },
    { id: 'pin2', name: 'B', direction: PinDirection.IN, x: -20, y: 0 },
    { id: 'pin3', name: 'E', direction: PinDirection.INOUT, x: 20, y: 25 },
  ],
  spiceTemplate: 'Q<index> <collector> <base> <emitter> <model>',
};

const OP_AMP: ComponentType = {
  id: 'U',
  category: 'IC',
  symbol: 'OPAMP',
  width: 60,
  height: 80,
  pins: [
    { id: 'pin1', name: 'IN+', direction: PinDirection.IN, x: -30, y: -20 },
    { id: 'pin2', name: 'IN-', direction: PinDirection.IN, x: -30, y: 20 },
    { id: 'pin3', name: 'OUT', direction: PinDirection.OUT, x: 30, y: 0 },
    { id: 'pin4', name: 'VCC', direction: PinDirection.PWR, x: 0, y: -40 },
    { id: 'pin5', name: 'GND', direction: PinDirection.GND, x: 0, y: 40 },
  ],
};

const GROUND: ComponentType = {
  id: 'GND',
  category: 'Reference',
  symbol: 'GROUND',
  width: 15,
  height: 15,
  pins: [
    { id: 'pin1', name: 'GND', direction: PinDirection.GND, x: 0, y: 0 },
  ],
  spiceTemplate: '.GROUND',
};

// Export library
export const COMPONENT_LIBRARY: Record<string, ComponentType> = {
  AND2,
  OR2,
  NOT,
  R: RESISTOR,
  C: CAPACITOR,
  L: INDUCTOR,
  V: VOLTAGE_SOURCE,
  I: CURRENT_SOURCE,
  D: DIODE,
  Q: TRANSISTOR_NPN,
  U: OP_AMP,
  GND: GROUND,
};

/**
 * Get component type by ID
 */
export function getComponentType(typeId: string): ComponentType | undefined {
  return COMPONENT_LIBRARY[typeId];
}

/**
 * Get all components by category
 */
export function getComponentsByCategory(category: string): ComponentType[] {
  return Object.values(COMPONENT_LIBRARY).filter(
    (c) => c.category === category
  );
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  const categories = Object.values(COMPONENT_LIBRARY).map((c) => c.category);
  return Array.from(new Set(categories));
}
