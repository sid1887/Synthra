import React, { useState } from 'react';
import {
  Copy,
  Trash2,
  Settings,
  Grid3x3,
  Maximize2,
  Layers,
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  items?: MenuItem[];
  x?: number;
  y?: number;
  visible?: boolean;
  onClose?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  items = [],
  x = 0,
  y = 0,
  visible = false,
  onClose,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  if (!visible) return null;

  const handleItemClick = (item: MenuItem) => {
    if (!item.disabled && !item.separator) {
      item.onClick();
      onClose?.();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="context-menu-backdrop"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Menu */}
      <div
        className="context-menu"
        style={{
          top: `${y}px`,
          left: `${x}px`,
        }}
      >
        {items.map((item) => (
          <div key={item.id}>
            {item.separator ? (
              <div className="context-menu-separator" />
            ) : (
              <button
                className={`context-menu-item ${
                  item.disabled ? 'disabled' : ''
                } ${hoveredItem === item.id ? 'hovered' : ''}`}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                disabled={item.disabled}
              >
                {item.icon && (
                  <span className="context-menu-icon">{item.icon}</span>
                )}
                <span className="context-menu-label">{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

// Helper to generate common context menu items
export const canvasContextMenu = (
  onNew: () => void,
  onDelete: () => void,
  onSelectAll: () => void,
  onCopy: () => void
): MenuItem[] => [
  { id: 'select-all', label: 'Select All', icon: <Layers size={16} />, onClick: onSelectAll },
  { id: 'copy', label: 'Copy', icon: <Copy size={16} />, onClick: onCopy },
  { separator: true, id: 'sep1', onClick: () => {} },
  { id: 'align', label: 'Align', icon: <Grid3x3 size={16} />, onClick: () => {} },
  { id: 'distribute', label: 'Distribute', icon: <Maximize2 size={16} />, onClick: () => {} },
  { separator: true, id: 'sep2', onClick: () => {} },
  { id: 'delete', label: 'Delete', icon: <Trash2 size={16} />, onClick: onDelete },
];

export const componentContextMenu = (
  onCopy: () => void,
  onDelete: () => void,
  onProperties: () => void
): MenuItem[] => [
  { id: 'copy', label: 'Copy', icon: <Copy size={16} />, onClick: onCopy },
  { separator: true, id: 'sep1', onClick: () => {} },
  { id: 'properties', label: 'Properties', icon: <Settings size={16} />, onClick: onProperties },
  { separator: true, id: 'sep2', onClick: () => {} },
  { id: 'delete', label: 'Delete', icon: <Trash2 size={16} />, onClick: onDelete },
];

export default ContextMenu;
