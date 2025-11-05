/**
 * Toolbar Component - Main editor toolbar with tools and actions
 */

import React from 'react';
import { 
  MousePointer2, 
  Cable, 
  Hand, 
  Save, 
  Download,
  Play,
  Users,
  Settings,
  Undo,
  Redo
} from 'lucide-react';

interface ToolbarProps {
  currentTool: 'select' | 'wire' | 'pan';
  onToolChange: (tool: 'select' | 'wire' | 'pan') => void;
  isConnected: boolean;
  userCount: number;
  onSave: () => void;
  onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  isConnected,
  userCount,
  onSave,
  onExport
}) => {
  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm">
      {/* Left: Tool Selection */}
      <div className="flex items-center gap-1">
        <ToolButton
          icon={<MousePointer2 className="h-4 w-4" />}
          active={currentTool === 'select'}
          onClick={() => onToolChange('select')}
          tooltip="Select (V)"
        />
        <ToolButton
          icon={<Cable className="h-4 w-4" />}
          active={currentTool === 'wire'}
          onClick={() => onToolChange('wire')}
          tooltip="Draw Wire (W)"
        />
        <ToolButton
          icon={<Hand className="h-4 w-4" />}
          active={currentTool === 'pan'}
          onClick={() => onToolChange('pan')}
          tooltip="Pan (Space)"
        />
        
        <div className="w-px h-6 bg-slate-300 mx-2" />
        
        <ToolButton
          icon={<Undo className="h-4 w-4" />}
          onClick={() => {}}
          tooltip="Undo (Ctrl+Z)"
        />
        <ToolButton
          icon={<Redo className="h-4 w-4" />}
          onClick={() => {}}
          tooltip="Redo (Ctrl+Shift+Z)"
        />
      </div>
      
      {/* Center: Title */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-800">Synthra Editor</h1>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Users className="h-3 w-3" />
            <span>{userCount}</span>
          </div>
        </div>
      </div>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
        
        <button
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
        >
          <Play className="h-4 w-4" />
          Simulate
        </button>
        
        <div className="w-px h-6 bg-slate-300 mx-2" />
        
        <ToolButton
          icon={<Settings className="h-4 w-4" />}
          onClick={() => {}}
          tooltip="Settings"
        />
      </div>
    </div>
  );
};

// Reusable Tool Button
interface ToolButtonProps {
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  tooltip: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  active = false,
  onClick,
  tooltip
}) => {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`p-2 rounded-lg transition-colors ${
        active
          ? 'bg-blue-500 text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
    </button>
  );
};
