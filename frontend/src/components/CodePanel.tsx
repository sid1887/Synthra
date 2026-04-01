import React, { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import Button from './ui/Button';

interface CodePanelProps {
  code?: string;
  language?: 'verilog' | 'vhdl' | 'systemverilog';
  onCopy?: (code: string) => void;
  onExport?: (code: string, format: string) => void;
}

const CodePanel: React.FC<CodePanelProps> = ({
  code = '',
  language = 'verilog',
  onCopy,
  onExport,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  const handleCopy = () => {
    onCopy?.(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    onExport?.(code, selectedLanguage);
  };

  // Simple syntax highlighting (basic)
  const highlightCode = (codeString: string, lang: string): JSX.Element => {
    // This is a very simplified highlighter - in production, use Prism.js
    const keywords =
      lang === 'verilog'
        ? ['module', 'input', 'output', 'wire', 'reg', 'always', 'begin', 'end', 'if', 'else']
        : ['entity', 'architecture', 'signal', 'process', 'begin', 'end', 'if', 'else'];

    let highlighted = codeString;
    keywords.forEach((kw) => {
      highlighted = highlighted.replace(
        new RegExp(`\\b${kw}\\b`, 'g'),
        `<span class="keyword">${kw}</span>`
      );
    });

    return (
      <div
        dangerouslySetInnerHTML={{ __html: highlighted }}
        className="code-highlight"
      />
    );
  };

  return (
    <div className="code-panel">
      {/* Toolbar */}
      <div className="code-toolbar">
        <div className="toolbar-group">
          <label className="language-label">Language:</label>
          <select
            value={selectedLanguage}
            onChange={(e) =>
              setSelectedLanguage(e.target.value as typeof language)
            }
            className="language-select"
          >
            <option value="verilog">Verilog</option>
            <option value="vhdl">VHDL</option>
            <option value="systemverilog">SystemVerilog</option>
          </select>
        </div>

        <div className="toolbar-group">
          <Button
            size="sm"
            variant="ghost"
            icon={<Copy size={16} />}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Download size={16} />}
            onClick={handleExport}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="code-editor">
        <pre className="code-pre">
          <code className={`language-${selectedLanguage}`}>
            {code || `// Generated HDL code will appear here\n// Your schematic components will be converted to code`}
          </code>
        </pre>
      </div>

      {/* Line Numbers */}
      <div className="code-line-numbers">
        {code
          .split('\n')
          .map((_, i) => (
            <div key={i} className="line-number">
              {i + 1}
            </div>
          ))}
      </div>
    </div>
  );
};

export default CodePanel;
