import React, { useState, useCallback, useEffect } from 'react';
import { SchematicEditor } from '../components/SchematicEditor';
import CodeEditor from '../components/CodeEditor';
import { useToast } from '../hooks/useToast';
import axios from 'axios';
import '../styles/SplitEditor.css';

interface EditorPageProps {
  roomId?: string;
}

type EditorMode = 'visual' | 'code' | 'split';
type CodeLanguage = 'verilog' | 'spice' | 'json';

export default function SplitEditorPage({ roomId }: EditorPageProps) {
  const [mode, setMode] = useState<EditorMode>('split');
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>('verilog');
  const [circuit, setCircuit] = useState<any>(null);
  const [verilogCode, setVerilogCode] = useState('');
  const [spiceCode, setSpiceCode] = useState('');
  const [jsonCode, setJsonCode] = useState('');
  const [codeErrors, setCodeErrors] = useState<Array<{ line: number; message: string }>>([]);
  const toast = useToast();

  useEffect(() => {
    initializeCircuit();
  }, [roomId]);

  const initializeCircuit = async () => {
    try {
      const newCircuit = {
        id: generateId(),
        name: 'New Circuit',
        components: [],
        nets: [],
        parameters: {},
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString()
      };
      setCircuit(newCircuit);
    } catch (error) {
      toast.error('Failed to load circuit');
    }
  };

  const updateCodeFromAST = async (ast: any) => {
    try {
      setVerilogCode('module circuit();\nendmodule');
      setSpiceCode('* SPICE netlist');
      setJsonCode(JSON.stringify(ast, null, 2));
    } catch (error) {
      toast.error('Failed to generate code');
    }
  };

  const handleSchematicChange = useCallback(async (change: any) => {
    try {
      const updatedCircuit = applyChange(circuit, change);
      setCircuit(updatedCircuit);
      await updateCodeFromAST(updatedCircuit);
      toast.success('Circuit updated');
    } catch (error) {
      toast.error('Failed to update circuit');
    }
  }, [circuit, toast]);

  const handleCodeChange = useCallback(async (code: string) => {
    try {
      setCodeErrors([]);
      if (codeLanguage === 'verilog') {
        setVerilogCode(code);
      } else if (codeLanguage === 'spice') {
        setSpiceCode(code);
      } else {
        setJsonCode(code);
      }
      toast.success('Code updated');
    } catch (error) {
      toast.error('Failed to parse code');
    }
  }, [codeLanguage, toast]);

  const handleExportModule = async () => {
    try {
      const moduleName = prompt('Enter module name:', circuit?.name || 'module');
      if (!moduleName) return;

      const code = `module ${moduleName}();\nendmodule`;
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(code));
      element.setAttribute('download', `${moduleName}.v`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success('Module exported');
    } catch (error) {
      toast.error('Failed to export module');
    }
  };

  const getCurrentCode = () => {
    switch (codeLanguage) {
      case 'verilog':
        return verilogCode;
      case 'spice':
        return spiceCode;
      case 'json':
        return jsonCode;
      default:
        return '';
    }
  };

  if (!circuit) {
    return <div className="editor-loading">Loading circuit...</div>;
  }

  return (
    <div className="split-editor-container">
      <div className="editor-toolbar">
        <div className="toolbar-section">
          <h2 className="circuit-title">{circuit.name}</h2>
        </div>

        <div className="toolbar-section toolbar-center">
          <div className="mode-buttons">
            <button
              className={`mode-btn ${mode === 'visual' ? 'active' : ''}`}
              onClick={() => setMode('visual')}
              title="Visual editor only"
            >
              Visual
            </button>
            <button
              className={`mode-btn ${mode === 'code' ? 'active' : ''}`}
              onClick={() => setMode('code')}
              title="Code editor only"
            >
              Code
            </button>
            <button
              className={`mode-btn ${mode === 'split' ? 'active' : ''}`}
              onClick={() => setMode('split')}
              title="Split view"
            >
              Split
            </button>
          </div>
        </div>

        <div className="toolbar-section toolbar-right">
          {(mode === 'code' || mode === 'split') && (
            <div className="language-selector">
              <select
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value as CodeLanguage)}
                className="select-small"
              >
                <option value="verilog">Verilog</option>
                <option value="spice">SPICE</option>
                <option value="json">JSON</option>
              </select>
            </div>
          )}

          <button
            className="btn-primary btn-sm"
            onClick={handleExportModule}
            title="Export circuit as reusable module"
          >
            Export Module
          </button>
        </div>
      </div>

      <div className={`editor-content editor-mode-${mode}`}>
        {(mode === 'visual' || mode === 'split') && (
          <div className="editor-pane visual-pane">
            <SchematicEditor
              roomId={roomId || 'local'}
              userId="user-1"
              username="Anonymous"
            />
          </div>
        )}

        {(mode === 'code' || mode === 'split') && (
          <div className="editor-pane code-pane">
            <CodeEditor
              language={codeLanguage}
              value={getCurrentCode()}
              onChange={handleCodeChange}
              errors={codeErrors}
              theme="dark"
            />
          </div>
        )}
      </div>

      <div className="editor-statusbar">
        <div className="status-item">
          Components: <strong>{circuit.components?.length || 0}</strong>
        </div>
        <div className="status-item">
          Nets: <strong>{circuit.nets?.length || 0}</strong>
        </div>
        <div className="status-item">
          Mode: <strong>{mode.toUpperCase()}</strong>
        </div>
      </div>
    </div>
  );
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function applyChange(circuit: any, change: any): any {
  const updated = JSON.parse(JSON.stringify(circuit));
  if (change.type === 'component_added') {
    updated.components.push(change.component);
  } else if (change.type === 'component_modified') {
    const comp = updated.components.find((c: any) => c.name === change.name);
    if (comp) {
      Object.assign(comp, change.updates);
    }
  } else if (change.type === 'component_deleted') {
    updated.components = updated.components.filter((c: any) => c.name !== change.name);
  }
  updated.modified_at = new Date().toISOString();
  return updated;
}
