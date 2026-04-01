import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Save, FolderOpen, Play, Download, Settings, HelpCircle, MoreVertical
} from 'lucide-react';
import Button from './ui/Button';
import { ThemeToggle } from './ThemeToggle';

interface AppHeaderProps {
  fileName?: string;
  isModified?: boolean;
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onSimulate?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  fileName = 'Untitled Circuit',
  isModified = false,
  onNew,
  onOpen,
  onSave,
  onExport,
  onSimulate,
  onSettings,
  onHelp,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="header-logo">
          <Zap className="logo-icon" />
          <span>Synthra</span>
        </Link>
      </div>

      <div className="header-center">
        <span className="text-sm text-[var(--color-text-secondary)]">{fileName}</span>
        {isModified && (
          <div
            className="unsaved-indicator"
            title="Unsaved changes"
          />
        )}
      </div>

      <div className="header-right flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          title="New (Ctrl+N)"
          onClick={onNew}
        >
          <FolderOpen size={18} />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          title="Open (Ctrl+O)"
          onClick={onOpen}
        >
          <FolderOpen size={18} />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          title="Save (Ctrl+S)"
          onClick={onSave}
        >
          <Save size={18} />
        </Button>

        <div className="w-px h-6 bg-[var(--color-border)]" />

        <Button
          size="md"
          variant="primary"
          title="Run Simulation (Ctrl+R)"
          onClick={onSimulate}
          icon={<Play size={16} />}
        >
          Simulate
        </Button>

        <Button
          size="icon"
          variant="ghost"
          title="Export (Ctrl+E)"
          onClick={onExport}
        >
          <Download size={18} />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          title="Settings"
          onClick={onSettings}
        >
          <Settings size={18} />
        </Button>

        <ThemeToggle />

        <Button
          size="icon"
          variant="ghost"
          title="Help & Shortcuts (F1)"
          onClick={onHelp}
        >
          <HelpCircle size={18} />
        </Button>

        <Button
          size="icon"
          variant="ghost"
        >
          <MoreVertical size={18} />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
