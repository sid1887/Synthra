import React, { useState } from 'react';
import Input from './ui/Input';

export interface ComponentProperty {
  id: string;
  name: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'select';
  unit?: string;
  min?: number;
  max?: number;
  options?: Array<{ label: string; value: string }>;
  editable: boolean;
}

interface PropertiesEditorProps {
  properties?: ComponentProperty[];
  onPropertyChange?: (propertyId: string, newValue: unknown) => void;
}

const PropertiesEditor: React.FC<PropertiesEditorProps> = ({
  properties = [],
  onPropertyChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleChange = (property: ComponentProperty, newValue: unknown) => {
    onPropertyChange?.(property.id, newValue);
  };

  const renderPropertyInput = (property: ComponentProperty) => {
    if (!property.editable) {
      return (
        <div className="property-read-only">
          {String(property.value)}
          {property.unit && <span className="property-unit">{property.unit}</span>}
        </div>
      );
    }

    switch (property.type) {
      case 'number':
        return (
          <Input
            type="number"
            value={String(property.value)}
            onChange={(e) => handleChange(property, parseFloat(e.target.value))}
            min={property.min}
            max={property.max}
            onFocus={() => setEditingId(property.id)}
            onBlur={() => setEditingId(null)}
          />
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(property.value)}
            onChange={(e) => handleChange(property, e.target.checked)}
            className="property-checkbox"
          />
        );

      case 'select':
        return (
          <select
            value={String(property.value)}
            onChange={(e) => handleChange(property, e.target.value)}
            className="property-select"
          >
            {property.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <Input
            type="text"
            value={String(property.value)}
            onChange={(e) => handleChange(property, e.target.value)}
            onFocus={() => setEditingId(property.id)}
            onBlur={() => setEditingId(null)}
          />
        );
    }
  };

  if (properties.length === 0) {
    return (
      <div className="properties-empty">
        <p className="text-sm text-[var(--color-text-tertiary)]">
          No properties to edit
        </p>
      </div>
    );
  }

  return (
    <div className="properties-editor">
      {properties.map((property) => (
        <div key={property.id} className="property-row">
          <div className="property-label-wrapper">
            <label className="property-label">{property.name}</label>
            {property.unit && <span className="property-hint">{property.unit}</span>}
          </div>
          <div className="property-input-wrapper">
            {renderPropertyInput(property)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertiesEditor;
