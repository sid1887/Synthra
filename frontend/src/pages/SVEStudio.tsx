/**
 * SVE Studio - Admin UI for Component Management
 * Manage AI-generated electronic component symbols
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Trash2,
  Upload,
  Download,
  Settings,
  TrendingUp,
  Zap,
  Filter,
  Grid3x3,
  List
} from 'lucide-react';
import { sveService } from '../utils/apiClient';

interface Component {
  id: string;
  component_type: string;
  category: string;
  svg_content: string;
  pins: number;
  quality_score: number;
  usage_count: number;
  style: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

interface Stats {
  total_components: number;
  categories: Record<string, number>;
  avg_quality: number;
  total_usage: number;
}

export const SVEStudio: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<Component[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [regenerating, setRegenerating] = useState<Set<string>>(new Set());
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());

  // Load components and stats
  useEffect(() => {
    loadComponents();
    loadStats();
  }, []);

  // Filter components based on search and category
  useEffect(() => {
    let filtered = components;

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.component_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    setFilteredComponents(filtered);
  }, [components, searchQuery, selectedCategory]);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const response = await sveService.getComponents('all');
      setComponents(response.data.components || []);
    } catch (error) {
      console.error('Failed to load components:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get all categories first
      const categoriesResponse = await sveService.getCategories();
      const categories = categoriesResponse.data;
      
      // Build stats from categories
      let totalComponents = 0;
      const categoryStats: Record<string, number> = {};
      
      for (const category of categories) {
        const response = await sveService.getComponents(category);
        const count = response.data.components?.length || 0;
        totalComponents += count;
        categoryStats[category] = count;
      }
      
      setStats({
        total_components: totalComponents,
        categories: categoryStats,
        avg_quality: 0.85,
        total_usage: 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRegenerate = async (componentId: string, componentType: string) => {
    setRegenerating(prev => new Set(prev).add(componentId));
    
    try {
      // Create new SVG symbol (regenerate)
      // Since sveService doesn't have a regenerate method, we'll call the service directly
      const response = await fetch(
        `${process.env.REACT_APP_SVE_URL || 'http://sve:8005'}/api/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            component_type: componentType,
            style: 'technical',
            force_regenerate: true
          })
        }
      ).then(r => r.json());
      
      // Update component in list
      setComponents(prev =>
        prev.map(c => c.id === componentId ? { ...c, ...response } : c)
      );
      
      await loadStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to regenerate component:', error);
    } finally {
      setRegenerating(prev => {
        const next = new Set(prev);
        next.delete(componentId);
        return next;
      });
    }
  };

  const handleBulkRegenerate = async () => {
    if (selectedComponents.size === 0) return;
    
    const componentsToRegen = components.filter(c => selectedComponents.has(c.id));
    
    for (const comp of componentsToRegen) {
      await handleRegenerate(comp.id, comp.component_type);
    }
    
    setSelectedComponents(new Set());
  };

  const handleDelete = async (componentId: string) => {
    if (!window.confirm('Delete this component? This cannot be undone.')) return;
    
    try {
      const sveUrl = (globalThis as any).REACT_APP_SVE_URL || 'http://sve:8005';
      await fetch(
        `${sveUrl}/api/components/${componentId}`,
        { method: 'DELETE' }
      );
      setComponents(prev => prev.filter(c => c.id !== componentId));
      await loadStats();
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  };

  const handleExportAll = async () => {
    try {
      const sveUrl = (globalThis as any).REACT_APP_SVE_URL || 'http://sve:8005';
      const response = await fetch(
        `${sveUrl}/api/components/export`
      );
      const data = await response.blob();
      
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `synthra-components-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export components:', error);
    }
  };

  const toggleSelection = (componentId: string) => {
    setSelectedComponents(prev => {
      const next = new Set(prev);
      if (next.has(componentId)) {
        next.delete(componentId);
      } else {
        next.add(componentId);
      }
      return next;
    });
  };

  const categories = Array.from(new Set(components.map(c => c.category))).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SVE Studio</h1>
              <p className="text-sm text-gray-500">AI Component Management</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadComponents}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleExportAll}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Components</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_components}</p>
                </div>
                <Grid3x3 className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Quality</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats.avg_quality * 100).toFixed(1)}%
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usage</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_usage}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(stats.categories).length}
                  </p>
                </div>
                <Filter className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedComponents.size > 0 && (
              <button
                onClick={handleBulkRegenerate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate ({selectedComponents.size})
              </button>
            )}
          </div>
        </div>

        {/* Components Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
            {filteredComponents.map(component => (
              <div
                key={component.id}
                className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
                  selectedComponents.has(component.id) ? 'ring-2 ring-blue-500' : ''
                } ${viewMode === 'list' ? 'flex items-center gap-4 p-4' : 'p-4'}`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedComponents.has(component.id)}
                  onChange={() => toggleSelection(component.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />

                {/* SVG Preview */}
                <div className={`${viewMode === 'grid' ? 'w-full h-32 mb-3' : 'w-24 h-24'} bg-gray-50 rounded flex items-center justify-center overflow-hidden`}>
                  <div
                    dangerouslySetInnerHTML={{ __html: component.svg_content }}
                    className="w-full h-full flex items-center justify-center"
                  />
                </div>

                {/* Component Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {component.component_type}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {component.category}
                    </span>
                    {component.quality_score > 0.8 && (
                      <Zap className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Quality: {(component.quality_score * 100).toFixed(0)}%</div>
                    <div>Usage: {component.usage_count}x</div>
                    <div>Pins: {component.pins}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleRegenerate(component.id, component.component_type)}
                    disabled={regenerating.has(component.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${regenerating.has(component.id) ? 'animate-spin' : ''}`} />
                    Regen
                  </button>
                  <button
                    onClick={() => handleDelete(component.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredComponents.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No components found</p>
          </div>
        )}
      </div>
    </div>
  );
};
