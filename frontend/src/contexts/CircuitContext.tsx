/**
 * Circuit Context
 *
 * Provides global circuit state and dispatch to all components.
 * Single source of truth pattern.
 */

import React, { createContext, useReducer, useCallback, ReactNode } from 'react';
import {
  Circuit,
  CircuitAction,
  ComponentInstance,
  Net,
  PinInstance,
} from '../types/circuit';

interface CircuitContextType {
  circuit: Circuit;
  dispatch: React.Dispatch<CircuitAction>;
  // Convenience methods
  addComponent: (typeId: string, label: string, x: number, y: number) => string;
  removeComponent: (id: string) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  rotateComponent: (id: string, rotation: 0 | 90 | 180 | 270) => void;
  addNet: (net: Net) => void;
  removeNet: (id: string) => void;
  updateComponent: (component: ComponentInstance) => void;
}

export const CircuitContext = createContext<CircuitContextType | undefined>(
  undefined
);

// Initial state
const initialCircuit: Circuit = {
  id: 'untitled',
  name: 'Untitled Circuit',
  components: [],
  nets: [],
  metadata: {
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
};

// Reducer function
function circuitReducer(state: Circuit, action: CircuitAction): Circuit {
  const updateMetadata = (s: Circuit): Circuit => ({
    ...s,
    metadata: {
      createdAt: s.metadata?.createdAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    },
  });

  switch (action.type) {
    case 'RESET':
      return action.payload;

    case 'ADD_COMPONENT': {
      const existing = state.components.find((c) => c.id === action.payload.id);
      if (existing) return state;
      return updateMetadata({
        ...state,
        components: [...state.components, action.payload],
      });
    }

    case 'REMOVE_COMPONENT': {
      const componentId = action.payload;
      const netsToKeep = state.nets.filter(
        (net) => !net.pins.some((p) => p.componentId === componentId)
      );
      return updateMetadata({
        ...state,
        components: state.components.filter((c) => c.id !== componentId),
        nets: netsToKeep,
      });
    }

    case 'UPDATE_COMPONENT': {
      return updateMetadata({
        ...state,
        components: state.components.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      });
    }

    case 'MOVE_COMPONENT': {
      const { id, x, y } = action.payload;
      return updateMetadata({
        ...state,
        components: state.components.map((c) =>
          c.id === id ? { ...c, x, y } : c
        ),
      });
    }

    case 'ROTATE_COMPONENT': {
      const { id, rotation } = action.payload;
      return updateMetadata({
        ...state,
        components: state.components.map((c) =>
          c.id === id ? { ...c, rotation } : c
        ),
      });
    }

    case 'ADD_NET': {
      const existing = state.nets.find((n) => n.id === action.payload.id);
      if (existing) return state;
      return updateMetadata({
        ...state,
        nets: [...state.nets, action.payload],
      });
    }

    case 'REMOVE_NET': {
      return updateMetadata({
        ...state,
        nets: state.nets.filter((n) => n.id !== action.payload),
      });
    }

    case 'UPDATE_NET': {
      return updateMetadata({
        ...state,
        nets: state.nets.map((n) =>
          n.id === action.payload.id ? action.payload : n
        ),
      });
    }

    case 'CLEAR': {
      return {
        ...initialCircuit,
        id: state.id,
        name: state.name,
      };
    }

    default:
      return state;
  }
}

interface CircuitProviderProps {
  children: ReactNode;
  initialCircuit?: Circuit;
}

export function CircuitProvider({
  children,
  initialCircuit: customInitial,
}: CircuitProviderProps) {
  const [circuit, dispatch] = useReducer(
    circuitReducer,
    customInitial || initialCircuit
  );

  // Convenience method: Add component
  const addComponent = useCallback(
    (typeId: string, label: string, x: number, y: number): string => {
      const id = `${label.replace(/\s+/g, '')}-${Date.now()}`;
      dispatch({
        type: 'ADD_COMPONENT',
        payload: {
          id,
          typeId,
          label,
          x,
          y,
          rotation: 0,
        } as ComponentInstance,
      });
      return id;
    },
    []
  );

  // Convenience method: Remove component
  const removeComponent = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_COMPONENT', payload: id });
  }, []);

  // Convenience method: Move component
  const moveComponent = useCallback((id: string, x: number, y: number) => {
    dispatch({
      type: 'MOVE_COMPONENT',
      payload: { id, x, y },
    });
  }, []);

  // Convenience method: Rotate component
  const rotateComponent = useCallback((id: string, rotation: 0 | 90 | 180 | 270) => {
    dispatch({
      type: 'ROTATE_COMPONENT',
      payload: { id, rotation },
    });
  }, []);

  // Convenience method: Update component
  const updateComponent = useCallback((component: ComponentInstance) => {
    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: component,
    });
  }, []);

  // Convenience method: Create net
  const addNet = useCallback((net: Net) => {
    dispatch({
      type: 'ADD_NET',
      payload: net,
    });
  }, []);

  // Convenience method: Remove net
  const removeNet = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NET', payload: id });
  }, []);

  const value: CircuitContextType = {
    circuit,
    dispatch,
    addComponent,
    removeComponent,
    moveComponent,
    rotateComponent,
    updateComponent,
    addNet,
    removeNet,
  };

  return (
    <CircuitContext.Provider value={value}>{children}</CircuitContext.Provider>
  );
}

/**
 * Hook to use Circuit context
 */
export function useCircuit(): CircuitContextType {
  const context = React.useContext(CircuitContext);
  if (!context) {
    throw new Error('useCircuit must be used within CircuitProvider');
  }
  return context;
}
