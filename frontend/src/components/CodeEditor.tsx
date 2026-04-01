import React, { useState, useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useToast } from '../hooks/useToast';

interface CodeEditorProps {
  language: 'verilog' | 'spice' | 'json';
  value: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
  errors?: Array<{ line: number; message: string }>;
  theme?: 'light' | 'dark';
}

export default function CodeEditor({
  language,
  value,
  onChange,
  readOnly = false,
  errors = [],
  theme = 'dark'
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const toast = useToast();

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = useCallback((code: string | undefined) => {
    if (code !== undefined) {
      onChange(code);
    }
  }, [onChange]);

  // Monaco language mapping
  const languageMap: Record<string, string> = {
    verilog: 'systemverilog',
    spice: 'plaintext', // or custom syntax highlighting
    json: 'json'
  };

  const editorLanguage = languageMap[language] || 'plaintext';

  return (
    <div className="code-editor-container">
      <div className="code-editor-header">
        <div className="code-editor-title">
          {language.toUpperCase()} Code
          {readOnly && <span className="read-only-badge">Read-only</span>}
        </div>
        <div className="code-editor-actions">
          <button
            className="btn-small"
            onClick={() => {
              if (editorRef.current) {
                const code = editorRef.current.getValue();
                navigator.clipboard.writeText(code);
                toast.success('Code copied to clipboard');
              }
            }}
          >
            Copy
          </button>
          <button
            className="btn-small"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.getAction('editor.action.formatDocument').run();
              }
            }}
          >
            Format
          </button>
        </div>
      </div>

      <div className="code-editor-wrapper">
        <Editor
          height="100%"
          language={editorLanguage}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          options={{
            readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            fontSize: 13,
            lineHeight: 1.6
          }}
        />
      </div>

      {/* Error/Warning display */}
      {errors.length > 0 && (
        <div className="code-editor-errors">
          {errors.map((err, idx) => (
            <div key={idx} className="error-item">
              <span className="error-line">Line {err.line}:</span>
              <span className="error-message">{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
