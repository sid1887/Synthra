import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface NetlistIssue {
  id: string;
  type: 'warning' | 'error';
  message: string;
  affectedComponents?: string[];
}

interface NetlistVerifierProps {
  issues: NetlistIssue[];
  totalComponents: number;
  totalWires: number;
  onSelectComponent?: (componentId: string) => void;
}

const NetlistVerifier: React.FC<NetlistVerifierProps> = ({
  issues = [],
  totalComponents = 0,
  totalWires = 0,
  onSelectComponent,
}) => {
  const errorCount = issues.filter((i) => i.type === 'error').length;
  const warningCount = issues.filter((i) => i.type === 'warning').length;
  const isValid = errorCount === 0;

  return (
    <div className="netlist-verifier">
      {/* Summary */}
      <div className={`verifier-summary ${isValid ? 'valid' : 'invalid'}`}>
        <div className="summary-icon">
          {isValid ? (
            <CheckCircle2 size={20} className="text-[var(--color-success)]" />
          ) : (
            <AlertCircle size={20} className="text-[var(--color-error)]" />
          )}
        </div>

        <div className="summary-content">
          <div className="summary-status">
            {isValid
              ? 'Netlist is valid'
              : `${errorCount} error${errorCount !== 1 ? 's' : ''} found`}
          </div>
          {warningCount > 0 && (
            <div className="summary-warnings">
              and {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="verifier-stats">
        <div className="stat-box">
          <span className="stat-label">Components</span>
          <span className="stat-value">{totalComponents}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Wires</span>
          <span className="stat-value">{totalWires}</span>
        </div>
      </div>

      {/* Issues List */}
      {issues.length > 0 && (
        <div className="verifier-issues">
          <div className="issues-title">Issues</div>
          <div className="issues-list">
            {issues.map((issue) => (
              <div key={issue.id} className={`issue-item ${issue.type}`}>
                <div className="issue-icon">
                  {issue.type === 'error' ? (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-error)]" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
                  )}
                </div>

                <div className="issue-content">
                  <div className="issue-message">{issue.message}</div>
                  {issue.affectedComponents && issue.affectedComponents.length > 0 && (
                    <div className="issue-components">
                      {issue.affectedComponents.map((compId) => (
                        <button
                          key={compId}
                          className="component-link"
                          onClick={() => onSelectComponent?.(compId)}
                        >
                          {compId}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Issues */}
      {issues.length === 0 && (
        <div className="verifier-empty">
          <p className="text-sm text-[var(--color-text-secondary)]">
            No issues found
          </p>
        </div>
      )}
    </div>
  );
};

export default NetlistVerifier;
