/**
 * Component API Service
 * Handles all component-related API calls
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface ComponentPin {
  name: string;
  x?: number;
  y?: number;
  direction: 'input' | 'output' | 'inout';
}

export interface ComponentLibraryEntry {
  id: string;
  component_type: string;
  symbol_name: string;
  category: string;
  description?: string;
  svg_symbol?: string;
  pin_definitions: ComponentPin[];
  spice_template?: string;
  vhdl_template?: string;
  parameters?: Record<string, unknown>;
  manufacturer?: string;
  datasheet_url?: string;
}

/**
 * Fetch all components from the library
 * Optionally filter by category
 */
export async function fetchComponents(category?: string): Promise<ComponentLibraryEntry[]> {
  const url = new URL(`${API_BASE_URL}/api/components`);
  if (category) {
    url.searchParams.append('category', category);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch components: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a specific component by ID
 */
export async function fetchComponent(componentId: string): Promise<ComponentLibraryEntry> {
  const response = await fetch(`${API_BASE_URL}/api/components/${componentId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch component: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a component by symbol name (e.g., 'R', 'AND2')
 */
export async function fetchComponentBySymbol(symbolName: string): Promise<ComponentLibraryEntry> {
  const response = await fetch(`${API_BASE_URL}/api/components/by-symbol/${symbolName}`);
  if (!response.ok) {
    throw new Error(`Component ${symbolName} not found`);
  }

  return response.json();
}

/**
 * Get all available component categories
 */
export async function fetchCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/components/categories/all`);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all available symbol names
 */
export async function fetchSymbolNames(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/components/search/symbol-names`);
  if (!response.ok) {
    throw new Error(`Failed to fetch symbol names: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search for components
 */
export async function searchComponents(query: string): Promise<ComponentLibraryEntry[]> {
  const url = new URL(`${API_BASE_URL}/api/components`);
  url.searchParams.append('search', query);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to search components: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Convert component library entry to format expected by the circuit editor
 */
export function componentLibraryEntryToComponentType(entry: ComponentLibraryEntry) {
  return {
    id: entry.symbol_name,
    name: entry.symbol_name,
    category: entry.category,
    description: entry.description || '',
    pins: entry.pin_definitions || [],
    svg: entry.svg_symbol || '',
    width: 60,
    height: 40,
    spiceTemplate: entry.spice_template || '',
    vhdlTemplate: entry.vhdl_template || '',
    parameters: entry.parameters || {},
  };
}
