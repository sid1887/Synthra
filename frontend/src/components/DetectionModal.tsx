import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

export interface DetectedComponent {
  id: string;
  name: string;
  type: string;
  confidence: number;
  bounds: { x: number; y: number; width: number; height: number };
  position: { x: number; y: number };
}

interface DetectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: DetectedComponent[];
  onAccept?: (components: DetectedComponent[]) => void;
  onReject?: (componentIds: string[]) => void;
  isLoading?: boolean;
}

const DetectionModal: React.FC<DetectionModalProps> = ({
  open,
  onOpenChange,
  components = [],
  onAccept,
  onReject,
  isLoading = false,
}) => {
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(
    new Set(components.map((c) => c.id))
  );
  const [rejectedComponents, setRejectedComponents] = useState<Set<string>>(
    new Set()
  );

  const toggleComponent = (id: string) => {
    const updated = new Set(selectedComponents);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedComponents(updated);
  };

  const handleAccept = () => {
    const accepted = components.filter((c) => selectedComponents.has(c.id));
    onAccept?.(accepted);
    onOpenChange(false);
  };

  const handleReject = (id: string) => {
    const updated = new Set(rejectedComponents);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setRejectedComponents(updated);

    // Also deselect from main selection
    const selected = new Set(selectedComponents);
    if (updated.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    setSelectedComponents(selected);
  };

  const selectedCount = selectedComponents.size;
  const rejectedCount = rejectedComponents.size;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Schematic Detection Results"
      size="lg"
      footer={
        <div className="flex justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              const rejected = Array.from(rejectedComponents);
              onReject?.(rejected);
              onOpenChange(false);
            }}
          >
            Reject Selected
          </Button>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAccept}
              disabled={selectedCount === 0 || isLoading}
              isLoading={isLoading}
            >
              Accept {selectedCount > 0 ? `(${selectedCount})` : ''}
            </Button>
          </div>
        </div>
      }
    >
      <div className="detection-content">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Analyzing schematic...
            </p>
          </div>
        ) : components.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <AlertCircle className="text-[var(--color-warning)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              No components detected
            </p>
          </div>
        ) : (
          <>
            <div className="detection-summary">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Detected {components.length} component
                {components.length !== 1 ? 's' : ''} • Selected: {selectedCount}
                {rejectedCount > 0 && ` • Rejected: ${rejectedCount}`}
              </p>
            </div>

            <div className="detection-list">
              {components.map((component) => {
                const isSelected = selectedComponents.has(component.id);
                const isRejected = rejectedComponents.has(component.id);

                return (
                  <div
                    key={component.id}
                    className={`detection-item ${
                      isRejected ? 'rejected' : isSelected ? 'selected' : ''
                    }`}
                    onClick={() => toggleComponent(component.id)}
                  >
                    <div className="detection-icon">
                      {isSelected && (
                        <CheckCircle2
                          size={18}
                          className="text-[var(--color-success)]"
                        />
                      )}
                      {isRejected && (
                        <AlertCircle
                          size={18}
                          className="text-[var(--color-warning)]"
                        />
                      )}
                      {!isSelected && !isRejected && (
                        <div className="w-5 h-5 border-2 border-[var(--color-border)] rounded" />
                      )}
                    </div>

                    <div className="detection-details">
                      <div className="detection-name">{component.name}</div>
                      <div className="detection-type">{component.type}</div>
                    </div>

                    <div className="detection-confidence">
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{
                            width: `${component.confidence * 100}%`,
                          }}
                        />
                      </div>
                      <span className="confidence-text">
                        {Math.round(component.confidence * 100)}%
                      </span>
                    </div>

                    <button
                      className="detection-reject"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(component.id);
                      }}
                      title="Reject this component"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="detection-info">
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Click on components to select/deselect them. Low confidence items
                are marked with ⚠️ and may need manual verification.
              </p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default DetectionModal;
