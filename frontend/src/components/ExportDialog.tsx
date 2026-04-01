import React, { useState } from 'react';
import { Download } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  icon: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF Document',
    description: 'Schematic, BOM, and netlist combined',
    extension: '.pdf',
    icon: '📄',
  },
  {
    id: 'png',
    name: 'PNG Image',
    description: 'High-resolution raster image',
    extension: '.png',
    icon: '🖼',
  },
  {
    id: 'svg',
    name: 'SVG Vector',
    description: 'Scalable vector format',
    extension: '.svg',
    icon: '✏️',
  },
  {
    id: 'json',
    name: 'JSON Data',
    description: 'Full schematic data format',
    extension: '.json',
    icon: '{ }',
  },
  {
    id: 'verilog',
    name: 'Verilog HDL',
    description: 'Hardware description language',
    extension: '.v',
    icon: '⚙️',
  },
  {
    id: 'vhdl',
    name: 'VHDL HDL',
    description: 'Hardware description language',
    extension: '.vhd',
    icon: '⚙️',
  },
  {
    id: 'gerber',
    name: 'Gerber Files',
    description: 'PCB manufacturing format',
    extension: '.gbr',
    icon: '🔧',
  },
  {
    id: 'kicad',
    name: 'KiCAD Schematic',
    description: 'KiCAD native format',
    extension: '.sch',
    icon: '📐',
  },
];

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport?: (format: string) => void;
  isExporting?: boolean;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  onExport,
  isExporting = false,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [includeOptions, setIncludeOptions] = useState({
    bom: true,
    netlist: true,
    annotations: true,
    measurements: true,
  });

  const handleExport = () => {
    onExport?.(selectedFormat);
  };

  const format = EXPORT_FORMATS.find((f) => f.id === selectedFormat);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Export Schematic"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<Download size={16} />}
            onClick={handleExport}
            isLoading={isExporting}
          >
            Export
          </Button>
        </div>
      }
    >
      <div className="export-dialog-content">
        {/* Format Selection Grid */}
        <div className="export-formats">
          {EXPORT_FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              className={`export-format-card ${
                selectedFormat === fmt.id ? 'selected' : ''
              }`}
              onClick={() => setSelectedFormat(fmt.id)}
            >
              <div className="format-icon">{fmt.icon}</div>
              <div className="format-name">{fmt.name}</div>
              <div className="format-description">{fmt.description}</div>
              <div className="format-extension">{fmt.extension}</div>
            </button>
          ))}
        </div>

        {/* Export Options */}
        {selectedFormat === 'pdf' && (
          <div className="export-options">
            <h4 className="options-header">Include in Export</h4>
            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={includeOptions.bom}
                onChange={(e) =>
                  setIncludeOptions((prev) => ({
                    ...prev,
                    bom: e.target.checked,
                  }))
                }
              />
              <span>Bill of Materials (BOM)</span>
            </label>
            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={includeOptions.netlist}
                onChange={(e) =>
                  setIncludeOptions((prev) => ({
                    ...prev,
                    netlist: e.target.checked,
                  }))
                }
              />
              <span>Netlist</span>
            </label>
            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={includeOptions.annotations}
                onChange={(e) =>
                  setIncludeOptions((prev) => ({
                    ...prev,
                    annotations: e.target.checked,
                  }))
                }
              />
              <span>Component Annotations</span>
            </label>
          </div>
        )}

        {(selectedFormat === 'png' || selectedFormat === 'svg') && (
          <div className="export-options">
            <h4 className="options-header">Image Settings</h4>
            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={includeOptions.measurements}
                onChange={(e) =>
                  setIncludeOptions((prev) => ({
                    ...prev,
                    measurements: e.target.checked,
                  }))
                }
              />
              <span>Include Measurements</span>
            </label>
          </div>
        )}

        {/* Format Info */}
        {format && (
          <div className="export-info">
            <p className="info-text">
              <strong>{format.name}:</strong> {format.description}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExportDialog;
