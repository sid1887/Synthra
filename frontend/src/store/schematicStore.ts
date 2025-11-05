/**
 * Zustand Store for Schematic State Management
 * Handles components, wires, and selections with Immer for immutability
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface ComponentPin {
  x: number;
  y: number;
  name?: string;
}

export interface Component {
  id: string;
  type: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  value?: string;
  pins: ComponentPin[];
  timestamp: number;
  metadata?: any;
}

export interface Wire {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  points: number[];
  timestamp?: number;
}

interface SchematicState {
  // State
  components: Component[];
  wires: Wire[];
  selectedComponentId: string | null;
  selectedWireId: string | null;
  
  // Actions
  addComponent: (component: Component) => void;
  moveComponent: (id: string, position: { x: number; y: number }) => void;
  deleteComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<Component>) => void;
  selectComponent: (id: string | null) => void;
  setComponents: (components: Component[]) => void;
  
  addWire: (wire: Wire) => void;
  deleteWire: (id: string) => void;
  selectWire: (id: string | null) => void;
  setWires: (wires: Wire[]) => void;
  
  clearAll: () => void;
}

export const useSchematicStore = create<SchematicState>()(
  immer((set) => ({
    // Initial state
    components: [],
    wires: [],
    selectedComponentId: null,
    selectedWireId: null,
    
    // Component actions
    addComponent: (component) =>
      set((state) => {
        state.components.push(component);
      }),
    
    moveComponent: (id, position) =>
      set((state) => {
        const component = state.components.find(c => c.id === id);
        if (component) {
          component.position = position;
        }
      }),
    
    deleteComponent: (id) =>
      set((state) => {
        state.components = state.components.filter(c => c.id !== id);
        if (state.selectedComponentId === id) {
          state.selectedComponentId = null;
        }
        // Also delete connected wires
        state.wires = state.wires.filter(w => 
          !w.id.includes(id) // Simplified - should check actual connections
        );
      }),
    
    updateComponent: (id, updates) =>
      set((state) => {
        const component = state.components.find(c => c.id === id);
        if (component) {
          Object.assign(component, updates);
        }
      }),
    
    selectComponent: (id) =>
      set((state) => {
        state.selectedComponentId = id;
        state.selectedWireId = null;
      }),
    
    setComponents: (components) =>
      set((state) => {
        state.components = components;
      }),
    
    // Wire actions
    addWire: (wire) =>
      set((state) => {
        state.wires.push(wire);
      }),
    
    deleteWire: (id) =>
      set((state) => {
        state.wires = state.wires.filter(w => w.id !== id);
        if (state.selectedWireId === id) {
          state.selectedWireId = null;
        }
      }),
    
    selectWire: (id) =>
      set((state) => {
        state.selectedWireId = id;
        state.selectedComponentId = null;
      }),
    
    setWires: (wires) =>
      set((state) => {
        state.wires = wires;
      }),
    
    // Utility
    clearAll: () =>
      set((state) => {
        state.components = [];
        state.wires = [];
        state.selectedComponentId = null;
        state.selectedWireId = null;
      }),
  }))
);
