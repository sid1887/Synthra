/**
 * API Client - Central service for all backend integrations
 * Handles communication with all microservices: Vision, Core, Simulator, SVE, Docs, API, Realtime
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// API URLs from environment or defaults
const API_GATEWAY = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const VISION_API = process.env.REACT_APP_VISION_URL || 'http://localhost:8001';
const CORE_API = process.env.REACT_APP_CORE_URL || 'http://localhost:8002';
const SIMULATOR_API = process.env.REACT_APP_SIMULATOR_URL || 'http://localhost:8003';
const SVE_API = process.env.REACT_APP_SVE_URL || 'http://localhost:8005';
const DOCS_API = process.env.REACT_APP_DOCS_URL || 'http://localhost:8006';
const REALTIME_API = process.env.REACT_APP_REALTIME_URL || 'http://localhost:8007';

// Create axios instances for each service
const createClient = (baseURL: string): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const apiClient = createClient(API_GATEWAY);
const visionClient = createClient(VISION_API);
const coreClient = createClient(CORE_API);
const simulatorClient = createClient(SIMULATOR_API);
const sveClient = createClient(SVE_API);
const docsClient = createClient(DOCS_API);

/**
 * Vision Service - Image detection and OCR
 */
export const visionService = {
  /**
   * Detect components from image
   */
  detectComponents: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return visionClient.post('/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Extract wires from image
   */
  extractWires: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return visionClient.post('/extract-wires', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Extract text/labels from image (OCR)
   */
  extractText: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return visionClient.post('/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Preprocess image for analysis
   */
  preprocessImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return visionClient.post('/preprocess', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

/**
 * Core Service - HDL generation and netlists
 */
export const coreService = {
  /**
   * Generate HDL from schematic
   */
  generateHDL: async (schematic: any, language: 'verilog' | 'vhdl' | 'systemverilog') => {
    return coreClient.post('/generate-hdl', {
      schematic,
      language,
    });
  },

  /**
   * Generate netlist from components and wires
   */
  generateNetlist: async (components: any[], wires: any[]) => {
    return coreClient.post('/generate-netlist', {
      components,
      wires,
    });
  },

  /**
   * Validate schematic connectivity
   */
  validateSchematic: async (components: any[], wires: any[]) => {
    return coreClient.post('/validate', {
      components,
      wires,
    });
  },

  /**
   * Parse and analyze HDL code
   */
  analyzeHDL: async (code: string, language: string) => {
    return coreClient.post('/analyze-hdl', {
      code,
      language,
    });
  },
};

/**
 * Simulator Service - Run simulations
 */
export const simulatorService = {
  /**
   * Run SPICE simulation
   */
  runSPICE: async (netlist: string, params: {
    duration: number;
    stepSize: number;
    temperature?: number;
    voltage?: number;
    analysisType?: string;
  }) => {
    return simulatorClient.post('/run-spice', {
      netlist,
      ...params,
    });
  },

  /**
   * Run HDL simulation
   */
  runHDL: async (code: string, language: string, params: any) => {
    return simulatorClient.post('/run-hdl', {
      code,
      language,
      ...params,
    });
  },

  /**
   * Get simulation progress
   */
  getProgress: async (taskId: string) => {
    return simulatorClient.get(`/progress/${taskId}`);
  },

  /**
   * Get simulation results
   */
  getResults: async (taskId: string) => {
    return simulatorClient.get(`/results/${taskId}`);
  },

  /**
   * Cancel running simulation
   */
  cancel: async (taskId: string) => {
    return simulatorClient.post(`/cancel/${taskId}`);
  },
};

/**
 * SVE (Schematic Visualization Engine) Service - Component library
 */
export const sveService = {
  /**
   * Get all component categories
   */
  getCategories: async () => {
    return sveClient.get('/components/categories');
  },

  /**
   * Get components in a category
   */
  getComponents: async (category: string) => {
    return sveClient.get(`/components/category/${category}`);
  },

  /**
   * Search components
   */
  search: async (query: string) => {
    return sveClient.get('/components/search', {
      params: { q: query },
    });
  },

  /**
   * Get component details
   */
  getComponent: async (id: string) => {
    return sveClient.get(`/components/${id}`);
  },

  /**
   * Get component symbol/icon
   */
  getSymbol: async (id: string) => {
    return sveClient.get(`/components/${id}/symbol`);
  },
};

/**
 * Docs Service - Generate documentation
 */
export const docsService = {
  /**
   * Generate PDF schematic
   */
  generatePDF: async (schematic: any, options: any) => {
    return docsClient.post('/generate-pdf', {
      schematic,
      options,
    }, {
      responseType: 'blob',
    });
  },

  /**
   * Generate BOM (Bill of Materials)
   */
  generateBOM: async (components: any[]) => {
    return docsClient.post('/generate-bom', {
      components,
    });
  },

  /**
   * Generate Gerber files (PCB manufacturing)
   */
  generateGerber: async (schematic: any) => {
    return docsClient.post('/generate-gerber', {
      schematic,
    }, {
      responseType: 'blob',
    });
  },

  /**
   * Export to KiCAD format
   */
  exportKiCAD: async (schematic: any) => {
    return docsClient.post('/export-kicad', {
      schematic,
    }, {
      responseType: 'blob',
    });
  },
};

/**
 * API Gateway - High-level operations
 */
export const apiService = {
  /**
   * Upload and process schematic image
   */
  uploadSchematic: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Get all recent projects
   */
  getProjects: async () => {
    return apiClient.get('/projects');
  },

  /**
   * Save project
   */
  saveProject: async (project: {
    name: string;
    schematic: any;
    components: any[];
    wires: any[];
  }) => {
    return apiClient.post('/projects', project);
  },

  /**
   * Load project by ID
   */
  loadProject: async (id: string) => {
    return apiClient.get(`/projects/${id}`);
  },

  /**
   * Delete project
   */
  deleteProject: async (id: string) => {
    return apiClient.delete(`/projects/${id}`);
  },

  /**
   * Export project in various formats
   */
  export: async (schematic: any, format: string, options: any) => {
    return apiClient.post('/export', {
      schematic,
      format,
      options,
    }, {
      responseType: format === 'json' ? 'json' : 'blob',
    });
  },
};

/**
 * Error handler
 */
export const handleApiError = (error: AxiosError) => {
  if (error.response) {
    // Server responded with error status
    console.error('API Error:', error.response.status, error.response.data);
    return {
      status: error.response.status,
      message: (error.response.data as any)?.message || 'An error occurred',
      data: error.response.data,
    };
  } else if (error.request) {
    // Request made but no response
    console.error('Network Error:', error.message);
    return {
      status: 0,
      message: 'Network error - service unavailable',
      data: null,
    };
  } else {
    // Error in request setup
    console.error('Error:', error.message);
    return {
      status: -1,
      message: error.message,
      data: null,
    };
  }
};

/**
 * Health check - verify all services are running
 */
export const healthCheck = async () => {
  try {
    const checks = await Promise.allSettled([
      apiClient.get('/health').catch(() => ({ status: 'down' })),
      visionClient.get('/health').catch(() => ({ status: 'down' })),
      coreClient.get('/health').catch(() => ({ status: 'down' })),
      simulatorClient.get('/health').catch(() => ({ status: 'down' })),
      sveClient.get('/health').catch(() => ({ status: 'down' })),
      docsClient.get('/health').catch(() => ({ status: 'down' })),
    ]);

    return {
      api: checks[0].status === 'fulfilled' ? 'up' : 'down',
      vision: checks[1].status === 'fulfilled' ? 'up' : 'down',
      core: checks[2].status === 'fulfilled' ? 'up' : 'down',
      simulator: checks[3].status === 'fulfilled' ? 'up' : 'down',
      sve: checks[4].status === 'fulfilled' ? 'up' : 'down',
      docs: checks[5].status === 'fulfilled' ? 'up' : 'down',
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      api: 'unknown',
      vision: 'unknown',
      core: 'unknown',
      simulator: 'unknown',
      sve: 'unknown',
      docs: 'unknown',
    };
  }
};

export default {
  apiClient,
  visionClient,
  coreClient,
  simulatorClient,
  sveClient,
  docsClient,
  visionService,
  coreService,
  simulatorService,
  sveService,
  docsService,
  apiService,
  handleApiError,
  healthCheck,
};
