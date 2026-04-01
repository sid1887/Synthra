import React, { useEffect, useState, useMemo } from 'react';
import { ChevronDown, Search, Zap } from 'lucide-react';
import Input from './ui/Input';

interface SVEComponent {
  component_type: string;
  category: string;
  svg_content: string;
  quality_score: number;
  usage_count: number;
}

interface ComponentPaletteProps {
  onComponentSelect?: (componentType: string) => void;
  onComponentDragStart?: (component: SVEComponent, e: React.DragEvent) => void;
}

const SVE_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_SVE_URL) 
  ? process.env.REACT_APP_SVE_URL 
  : 'http://localhost:8005';

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onComponentSelect,
  onComponentDragStart,
}) => {
  const [components, setComponents] = useState<SVEComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['all'])
  );

  // Load popular components from SVE
  useEffect(() => {
    const loadComponents = async () => {
      try {
        const response = await fetch(`${SVE_URL}/api/components/popular`);
        const data = await response.json();
        setComponents(data);
        const categories = Array.from(new Set(data.map((c: SVEComponent) => c.category))) as string[];
        setExpandedCategories(new Set(categories));
        setLoading(false);
      } catch (error) {
        console.error('Failed to load components:', error);
        setLoading(false);
      }
    };

    loadComponents();
  }, []);

  // Group components by category
  const groupedComponents = useMemo(() => {
    const groups: Record<string, SVEComponent[]> = {};
    components.forEach((comp) => {
      if (!groups[comp.category]) {
        groups[comp.category] = [];
      }
      groups[comp.category].push(comp);
    });
    return groups;
  }, [components]);

  // Filter components
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedComponents;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, SVEComponent[]> = {};
    Object.entries(groupedComponents).forEach(([category, comps]) => {
      const matched = comps.filter(
        (comp) =>
          comp.component_type.toLowerCase().includes(query) ||
          comp.category.toLowerCase().includes(query)
      );
      if (matched.length > 0) {
        filtered[category] = matched;
      }
    });
    return filtered;
  }, [groupedComponents, searchQuery]);

  const toggleCategory = (categoryId: string) => {
    const updated = new Set(expandedCategories);
    if (updated.has(categoryId)) {
      updated.delete(categoryId);
    } else {
      updated.add(categoryId);
    }
    setExpandedCategories(updated);
  };

  const handleDragStart = (component: SVEComponent, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('component', JSON.stringify(component));
    onComponentDragStart?.(component, e);
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      passive: '⚪',
      active: '●',
      digital: '◻',
      ic: '✣',
      logic: '◈',
      power: '⚡',
      connectors: '↔',
    };
    return icons[category] || '◯';
  };

  return (
    <div className="component-palette">
      <div className="palette-header">
        <h3 className="palette-title">Components</h3>
      </div>

      <div className="palette-search">
        <Input
          placeholder="Search components..."
          prefix={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="palette-categories">
        {loading ? (
          <div className="palette-loading">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[var(--color-text-secondary)]">Loading components...</p>
          </div>
        ) : Object.keys(filteredGroups).length === 0 ? (
          <div className="palette-empty">
            <p>No components found</p>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Try adjusting your search
            </span>
          </div>
        ) : (
          Object.entries(filteredGroups).map(([category, comps]) => (
            <div key={category} className="category-group">
              <button
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    expandedCategories.has(category) ? '' : '-rotate-90'
                  }`}
                />
                <span className="category-icon">{getCategoryIcon(category)}</span>
                <span className="category-name capitalize">{category}</span>
                <span className="category-count">({comps.length})</span>
              </button>

              {expandedCategories.has(category) && (
                <div className="category-items">
                  {comps.map((component) => (
                    <div
                      key={component.component_type}
                      className="component-item"
                      draggable
                      onDragStart={(e) => handleDragStart(component, e)}
                      onClick={() => onComponentSelect?.(component.component_type)}
                      title={component.component_type}
                    >
                      <div className="component-icon">
                        {component.svg_content ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: component.svg_content }}
                            className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                          />
                        ) : (
                          getCategoryIcon(component.category)
                        )}
                      </div>
                      <div className="component-info">
                        <div className="component-name">{formatComponentName(component.component_type)}</div>
                        <div className="component-desc text-xs">{component.category}</div>
                      </div>
                      {component.quality_score > 0.8 && (
                        <div className="ml-auto">
                          <Zap size={14} className="text-yellow-500" fill="currentColor" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!loading && (
        <div className="palette-footer">
          <span className="text-xs text-[var(--color-text-secondary)]">
            {Object.values(filteredGroups).reduce((a, b) => a + b.length, 0)} component
            {Object.values(filteredGroups).reduce((a, b) => a + b.length, 0) !== 1 ? 's' : ''} available
          </span>
        </div>
      )}
    </div>
  );
};

// Helper: Format component name for display
const formatComponentName = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
