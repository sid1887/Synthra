/**
 * Code Preview Component - Shows live netlist and HDL code
 */

import React, { useState, useEffect } from 'react';
import { FileCode, FileText, Copy, Check } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';

interface CodePreviewProps {
  roomId: string;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ roomId }) => {
  const [activeTab, setActiveTab] = useState<'netlist' | 'hdl'>('netlist');
  const [netlistCode, setNetlistCode] = useState('* Netlist will appear here\n* Make changes in the editor to see live updates');
  const [hdlCode, setHdlCode] = useState('// HDL code will appear here\n// Make changes in the editor to see live updates');
  const [copied, setCopied] = useState(false);
  
  // Listen for code updates from WebSocket
  useEffect(() => {
    const handleCodeUpdate = (event: any) => {
      const { code_type, content } = event.detail;
      
      if (code_type === 'netlist') {
        setNetlistCode(content);
      } else if (code_type === 'hdl') {
        setHdlCode(content);
      }
    };
    
    window.addEventListener('code_update', handleCodeUpdate as EventListener);
    
    return () => {
      window.removeEventListener('code_update', handleCodeUpdate as EventListener);
    };
  }, []);
  
  const copyToClipboard = () => {
    const code = activeTab === 'netlist' ? netlistCode : hdlCode;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === 'netlist'}
            onClick={() => setActiveTab('netlist')}
            icon={<FileText className="h-4 w-4" />}
            label="SPICE"
          />
          <TabButton
            active={activeTab === 'hdl'}
            onClick={() => setActiveTab('hdl')}
            icon={<FileCode className="h-4 w-4" />}
            label="Verilog"
          />
        </div>
        
        <button
          onClick={copyToClipboard}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      
      {/* Code Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          value={activeTab === 'netlist' ? netlistCode : hdlCode}
          language={activeTab === 'netlist' ? 'plaintext' : 'verilog'}
          theme="vs-light"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
            lineNumbers: 'on',
            wordWrap: 'on',
            folding: true,
            automaticLayout: true
          }}
        />
      </div>
      
      {/* Status Bar */}
      <div className="h-8 px-3 flex items-center justify-between bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
        <span>Live Preview</span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Synced
        </span>
      </div>
    </div>
  );
};

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-500 text-white'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};
