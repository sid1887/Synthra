/**
 * Hook for loading components from API
 */

import { useState, useEffect } from 'react';
import { fetchComponents, componentLibraryEntryToComponentType, type ComponentLibraryEntry } from '../services/componentApi';

export interface ComponentType {
  id: string;
  name: string;
  category: string;
  description: string;
  pins: Array<{
    name: string;
    direction: 'input' | 'output' | 'inout';
    x?: number;
    y?: number;
  }>;
  svg: string;
  width: number;
  height: number;
  spiceTemplate: string;
  vhdlTemplate: string;
  parameters: Record<string, unknown>;
}

export function useComponents() {
  const [components, setComponents] = useState<ComponentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComponents = async () => {
      try {
        setLoading(true);
        const entries = await fetchComponents();
        const converted = entries.map(componentLibraryEntryToComponentType);
        setComponents(converted);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load components';
        setError(message);
        // Provide fallback hardcoded components
        setComponents(getDefaultComponents());
      } finally {
        setLoading(false);
      }
    };

    loadComponents();
  }, []);

  return { components, loading, error };
}

/**
 * Fallback hardcoded components for when API is not available
 */
function getDefaultComponents(): ComponentType[] {
  return [
    {
      id: 'R',
      name: 'R',
      category: 'passive',
      description: '2-terminal resistor',
      pins: [
        { name: 'p', direction: 'inout', x: 0, y: 10 },
        { name: 'n', direction: 'inout', x: 60, y: 10 },
      ],
      svg: '<svg width="60" height="20" viewBox="0 0 60 20"><line x1="0" y1="10" x2="10" y2="10" stroke="black" stroke-width="1"/><polyline points="10,5 15,15 20,5 25,15 30,5 35,15 40,5 45,15 50,10" fill="none" stroke="black" stroke-width="1"/><line x1="50" y1="10" x2="60" y2="10" stroke="black" stroke-width="1"/><circle cx="0" cy="10" r="2" fill="#666"/><circle cx="60" cy="10" r="2" fill="#666"/></svg>',
      width: 60,
      height: 20,
      spiceTemplate: 'R{label} {p} {n} {value}',
      vhdlTemplate: 'R <= {value};',
      parameters: {},
    },
    {
      id: 'C',
      name: 'C',
      category: 'passive',
      description: '2-terminal capacitor',
      pins: [
        { name: 'p', direction: 'inout', x: 0, y: 10 },
        { name: 'n', direction: 'inout', x: 60, y: 10 },
      ],
      svg: '<svg width="60" height="20" viewBox="0 0 60 20"><line x1="0" y1="10" x2="20" y2="10" stroke="black" stroke-width="1"/><line x1="25" y1="5" x2="25" y2="15" stroke="black" stroke-width="2"/><line x1="35" y1="5" x2="35" y2="15" stroke="black" stroke-width="2"/><line x1="40" y1="10" x2="60" y2="10" stroke="black" stroke-width="1"/><circle cx="0" cy="10" r="2" fill="#666"/><circle cx="60" cy="10" r="2" fill="#666"/></svg>',
      width: 60,
      height: 20,
      spiceTemplate: 'C{label} {p} {n} {value}',
      vhdlTemplate: 'C <= {value};',
      parameters: {},
    },
    {
      id: 'AND2',
      name: 'AND2',
      category: 'logic',
      description: '2-input AND gate',
      pins: [
        { name: 'A', direction: 'input', x: 0, y: 10 },
        { name: 'B', direction: 'input', x: 0, y: 30 },
        { name: 'Y', direction: 'output', x: 60, y: 20 },
      ],
      svg: '<svg width="60" height="40" viewBox="0 0 60 40"><g stroke="#000" stroke-width="1" fill="white"><path d="M 5,5 L 5,35 L 40,35 Q 55,20 40,5 Z" fill="white" stroke="black"/></g><line x1="0" y1="10" x2="5" y2="10" stroke="black" stroke-width="1"/><circle cx="0" cy="10" r="2" fill="#666"/><line x1="0" y1="30" x2="5" y2="30" stroke="black" stroke-width="1"/><circle cx="0" cy="30" r="2" fill="#666"/><line x1="55" y1="20" x2="60" y2="20" stroke="black" stroke-width="1"/><circle cx="60" cy="20" r="2" fill="#666"/><text x="-8" y="14" font-size="9" fill="black">A</text><text x="-8" y="34" font-size="9" fill="black">B</text><text x="62" y="24" font-size="9" fill="black">Y</text></svg>',
      width: 60,
      height: 40,
      spiceTemplate: 'U{label} {A} {B} {Y} AND2',
      vhdlTemplate: 'Y <= A and B;',
      parameters: {},
    },
    {
      id: 'OR2',
      name: 'OR2',
      category: 'logic',
      description: '2-input OR gate',
      pins: [
        { name: 'A', direction: 'input', x: 0, y: 10 },
        { name: 'B', direction: 'input', x: 0, y: 30 },
        { name: 'Y', direction: 'output', x: 60, y: 20 },
      ],
      svg: '<svg width="60" height="40" viewBox="0 0 60 40"><g stroke="#000" stroke-width="1" fill="white"><path d="M 8,5 L 5,35 L 40,35 Q 55,20 40,5 Q 20,20 8,5 Z" fill="white" stroke="black"/></g><line x1="0" y1="10" x2="8" y2="10" stroke="black" stroke-width="1"/><circle cx="0" cy="10" r="2" fill="#666"/><line x1="0" y1="30" x2="8" y2="30" stroke="black" stroke-width="1"/><circle cx="0" cy="30" r="2" fill="#666"/><line x1="55" y1="20" x2="60" y2="20" stroke="black" stroke-width="1"/><circle cx="60" cy="20" r="2" fill="#666"/><text x="-8" y="14" font-size="9" fill="black">A</text><text x="-8" y="34" font-size="9" fill="black">B</text><text x="62" y="24" font-size="9" fill="black">Y</text></svg>',
      width: 60,
      height: 40,
      spiceTemplate: 'U{label} {A} {B} {Y} OR2',
      vhdlTemplate: 'Y <= A or B;',
      parameters: {},
    },
    {
      id: 'NOT',
      name: 'NOT',
      category: 'logic',
      description: 'NOT gate',
      pins: [
        { name: 'A', direction: 'input', x: 0, y: 15 },
        { name: 'Y', direction: 'output', x: 40, y: 15 },
      ],
      svg: '<svg width="40" height="30" viewBox="0 0 40 30"><g stroke="#000" stroke-width="1" fill="none"><polygon points="5,5 5,25 30,15" fill="white" stroke="black"/><circle cx="32" cy="15" r="3" fill="none" stroke="black"/></g><line x1="0" y1="15" x2="5" y2="15" stroke="black" stroke-width="1"/><circle cx="0" cy="15" r="2" fill="#666"/><line x1="35" y1="15" x2="40" y2="15" stroke="black" stroke-width="1"/><circle cx="40" cy="15" r="2" fill="#666"/><text x="-8" y="19" font-size="9" fill="black">A</text><text x="42" y="19" font-size="9" fill="black">Y</text></svg>',
      width: 40,
      height: 30,
      spiceTemplate: 'U{label} {A} {Y} NOT',
      vhdlTemplate: 'Y <= not A;',
      parameters: {},
    },
    {
      id: 'V',
      name: 'V',
      category: 'power',
      description: 'Voltage source',
      pins: [
        { name: 'pos', direction: 'output', x: 20, y: 0 },
        { name: 'neg', direction: 'output', x: 20, y: 40 },
      ],
      svg: '<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="white" stroke="black" stroke-width="1"/><text x="15" y="24" font-size="16" font-weight="bold" fill="black">~</text><line x1="20" y1="0" x2="20" y2="5" stroke="black" stroke-width="1"/><line x1="20" y1="35" x2="20" y2="40" stroke="black" stroke-width="1"/><circle cx="20" cy="0" r="2" fill="#666"/><circle cx="20" cy="40" r="2" fill="#666"/></svg>',
      width: 40,
      height: 40,
      spiceTemplate: 'V{label} {pos} {neg} {value}',
      vhdlTemplate: 'V <= {value};',
      parameters: {},
    },
    {
      id: 'GND',
      name: 'GND',
      category: 'power',
      description: 'Ground',
      pins: [
        { name: 'gnd', direction: 'inout', x: 15, y: 0 },
      ],
      svg: '<svg width="30" height="25" viewBox="0 0 30 25"><line x1="15" y1="0" x2="15" y2="5" stroke="black" stroke-width="1"/><line x1="5" y1="5" x2="25" y2="5" stroke="black" stroke-width="2"/><line x1="8" y1="10" x2="22" y2="10" stroke="black" stroke-width="2"/><line x1="11" y1="15" x2="19" y2="15" stroke="black" stroke-width="2"/><circle cx="15" cy="0" r="2" fill="#666"/></svg>',
      width: 30,
      height: 25,
      spiceTemplate: '',
      vhdlTemplate: '',
      parameters: {},
    },
  ];
}
