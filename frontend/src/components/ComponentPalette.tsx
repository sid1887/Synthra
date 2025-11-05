/**
 * Component Palette - Loads components from SVE and displays them
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Zap, Circle, Square, Triangle } from 'lucide-react';

interface SVEComponent {
  component_type: string;
  category: string;
  svg_content: string;
  quality_score: number;
  usage_count: number;
}

interface ComponentPaletteProps {
  onComponentSelect: (componentType: string) => void;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const SVE_URL = process.env.REACT_APP_SVE_URL || 'http://localhost:8005';

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onComponentSelect
}) => {
  const [components, setComponents] = useState<SVEComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Load popular components from SVE
  useEffect(() => {
    const loadComponents = async () => {
      try {
        const response = await axios.get(`${SVE_URL}/api/components/popular`);
        setComponents(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load components:', error);
        setLoading(false);
      }
    };
    
    loadComponents();
  }, []);
  
  // Filter components
  const filteredComponents = components.filter(comp => {
    const matchesSearch = comp.component_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || comp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Get unique categories
  const categories = ['all', ...Array.from(new Set(components.map(c => c.category)))];
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Components</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Category Tabs */}
      <div className="flex gap-1 p-2 border-b border-slate-200 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredComponents.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-8">
            No components found
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredComponents.map(comp => (
              <button
                key={comp.component_type}
                onClick={() => onComponentSelect(comp.component_type)}
                className="group relative p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                title={comp.component_type}
              >
                {/* Component Icon/SVG Preview */}
                <div className="h-12 flex items-center justify-center mb-2">
                  {comp.svg_content ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: comp.svg_content }}
                      className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                    />
                  ) : (
                    <ComponentIcon category={comp.category} />
                  )}
                </div>
                
                {/* Component Name */}
                <div className="text-xs font-medium text-slate-700 text-center truncate">
                  {formatComponentName(comp.component_type)}
                </div>
                
                {/* Quality Badge */}
                {comp.quality_score > 0.8 && (
                  <div className="absolute top-1 right-1">
                    <Zap className="h-3 w-3 text-yellow-500" fill="currentColor" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 text-xs text-slate-500">
        {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
};

// Helper: Component icon based on category
const ComponentIcon: React.FC<{ category: string }> = ({ category }) => {
  switch (category) {
    case 'passive':
      return <Circle className="h-8 w-8 text-slate-400" />;
    case 'active':
      return <Triangle className="h-8 w-8 text-slate-400" />;
    case 'digital':
      return <Square className="h-8 w-8 text-slate-400" />;
    default:
      return <Circle className="h-8 w-8 text-slate-400" />;
  }
};

// Helper: Format component name for display
const formatComponentName = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
