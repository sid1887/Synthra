/**
 * B3: Documentation and Export Engine
 * Export analyses to JSON, TXT, Markdown, and PDF formats
 */

import { AnalysisResponse } from '../types/schemas.js';

/**
 * Export to JSON (full data)
 */
export function exportToJSON(analysis: AnalysisResponse): string {
  return JSON.stringify(analysis, null, 2);
}

/**
 * Export to TXT (human-readable text)
 */
export function exportToTXT(analysis: AnalysisResponse): string {
  let text = '';
  text += '═══════════════════════════════════════════════════════════════\n';
  text += 'SYNTHRA CIRCUIT ANALYSIS REPORT\n';
  text += '═══════════════════════════════════════════════════════════════\n\n';
  text += `Report ID: ${analysis.requestId}\n`;
  text += `Timestamp: ${analysis.timestamp}\n`;
  text += `Processing Time: ${analysis.processingTimeMs}ms\n\n`;
  text += '───────────────────────────────────────────────────────────────\n';
  text += 'CIRCUIT IDENTIFICATION\n';
  text += '───────────────────────────────────────────────────────────────\n\n';
  text += `Circuit Type: ${analysis.circuit.label.replace(/_/g, ' ').toUpperCase()}\n`;
  text += `Family: ${analysis.circuit.family}\n`;
  text += `Complexity: ${analysis.circuit.complexity}\n`;
  text += `Confidence: ${(analysis.circuit.confidence * 100).toFixed(1)}%\n`;
  text += `Description: ${analysis.circuit.description || 'N/A'}\n\n`;

  if (analysis.circuit.power_path) {
    text += 'Power Path:\n';
    analysis.circuit.power_path.forEach((p, i) => {
      text += `  ${i + 1}. ${p}\n`;
    });
    text += '\n';
  }

  text += '───────────────────────────────────────────────────────────────\n';
  text += 'DETECTED COMPONENTS\n';
  text += '───────────────────────────────────────────────────────────────\n\n';
  text += `Total Components: ${analysis.components.length}\n\n`;

  analysis.components.forEach((comp) => {
    text += `[${comp.id}] ${comp.canonicalLabel.toUpperCase()}\n`;
    text += `  Label: ${comp.label}\n`;
    text += `  Confidence: ${(comp.confidence * 100).toFixed(1)}%\n`;
    text += `  Orientation: ${comp.orientation}\n`;
    text += `  Polarity: ${comp.polarity}\n`;
    text += `  Role: ${comp.role || 'unknown'}\n`;
    text += `  Position: (${comp.bbox.x}, ${comp.bbox.y}) Size: ${comp.bbox.w}x${comp.bbox.h}px\n`;
    if (comp.value) text += `  Value: ${comp.value}\n`;
    if (comp.unknown) text += '  ⚠️ LOW CONFIDENCE / UNKNOWN\n';
    text += '\n';
  });

  text += '───────────────────────────────────────────────────────────────\n';
  text += 'EXPLANATION\n';
  text += '───────────────────────────────────────────────────────────────\n\n';
  text += 'Quick Summary:\n';
  text += analysis.explanation.short + '\n\n';
  text += 'Beginner-Friendly Explanation:\n';
  text += analysis.explanation.student + '\n\n';
  text += 'Technical Explanation:\n';
  text += analysis.explanation.engineer + '\n\n';

  if (analysis.warnings.length > 0) {
    text += '───────────────────────────────────────────────────────────────\n';
    text += 'WARNINGS & DIAGNOSTICS\n';
    text += '───────────────────────────────────────────────────────────────\n\n';
    analysis.warnings.forEach((w) => {
      text += `[${w.severity.toUpperCase()}] ${w.code}\n`;
      text += `  Message: ${w.message}\n`;
      text += `  Action: ${w.action}\n`;
      if (w.componentIds) text += `  Components Affected: ${w.componentIds.join(', ')}\n`;
      text += '\n';
    });
  }

  if (analysis.suggestions.length > 0) {
    text += '───────────────────────────────────────────────────────────────\n';
    text += 'RECOMMENDATIONS\n';
    text += '───────────────────────────────────────────────────────────────\n\n';
    analysis.suggestions.forEach((s) => {
      text += `[${s.type.toUpperCase()}] ${s.title}\n`;
      text += `  ${s.description}\n`;
      text += `  Action: ${s.action}\n`;
      text += `  Impact: ${s.estimatedImpact}\n`;
      text += '\n';
    });
  }

  if (analysis.guidance.reasons.length > 0) {
    text += '───────────────────────────────────────────────────────────────\n';
    text += 'IMAGE QUALITY GUIDANCE\n';
    text += '───────────────────────────────────────────────────────────────\n\n';
    analysis.guidance.reasons.forEach((r) => {
      text += `• ${r}\n`;
    });
    text += '\n';
  }

  if (analysis.simulation) {
    text += '───────────────────────────────────────────────────────────────\n';
    text += 'SIMULATION RESULTS (DC ANALYSIS)\n';
    text += '───────────────────────────────────────────────────────────────\n\n';
    text += `Power Supply: ${analysis.simulation.power_voltage || 'N/A'}V\n\n`;
    text += 'Component Power Characteristics:\n\n';

    analysis.simulation.components.forEach((comp) => {
      const compName =
        analysis.components.find((c) => c.id === comp.componentId)?.canonicalLabel || comp.componentId;
      text += `• ${compName}\n`;
      text += `  Status: ${comp.status}\n`;
      text += `  Voltage: ${comp.voltage.toFixed(2)}V\n`;
      text += `  Current: ${comp.current.toFixed(2)}mA\n`;
      text += `  Power: ${comp.power.toFixed(2)}mW\n`;
    });

    if (analysis.simulation.warnings.length > 0) {
      text += '\nSimulation Warnings:\n';
      analysis.simulation.warnings.forEach((w) => {
        text += `• ${w}\n`;
      });
    }

    text += `\n${analysis.simulation.notes}\n\n`;
  }

  text += '═══════════════════════════════════════════════════════════════\n';
  text += 'END OF REPORT\n';
  text += `Generated by Synthra v1.0 | ${new Date().toLocaleString()}\n`;
  text += '═══════════════════════════════════════════════════════════════\n';

  return text;
}

/**
 * Export to Markdown (formatted for docs/sharing)
 */
export function exportToMarkdown(analysis: AnalysisResponse): string {
  let md = '';
  md += `# Circuit Analysis Report\n`;
  md += `**Synthra v1.0** | ${new Date().toLocaleString()}\n\n`;
  md += `**Report ID:** \`${analysis.requestId}\`  \n`;
  md += `**Processing Time:** ${analysis.processingTimeMs}ms\n\n`;

  md += '## 🎯 Circuit Identification\n\n';
  md += `| Property | Value |\n`;
  md += `|----------|-------|\n`;
  md += `| **Circuit Type** | ${analysis.circuit.label.replace(/_/g, ' ')} |\n`;
  md += `| **Family** | ${analysis.circuit.family} |\n`;
  md += `| **Complexity** | ${analysis.circuit.complexity} |\n`;
  md += `| **Confidence** | ${(analysis.circuit.confidence * 100).toFixed(1)}% |\n`;
  md += `| **Description** | ${analysis.circuit.description || '_No description_'} |\n\n`;

  if (analysis.circuit.power_path) {
    md += '### Power Flow Path\n\n';
    md += '```\n';
    md += analysis.circuit.power_path.join(' → ') + '\n';
    md += '```\n\n';
  }

  md += '## 🔧 Detected Components\n\n';
  md += `**Total:** ${analysis.components.length} components\n\n`;

  analysis.components.forEach((comp) => {
    md += `### ${comp.canonicalLabel.toUpperCase()} \`${comp.id}\`\n\n`;
    md += `- **Label:** ${comp.label}\n`;
    md += `- **Confidence:** ${(comp.confidence * 100).toFixed(1)}%\n`;
    md += `- **Role:** ${comp.role || 'unknown'}\n`;
    md += `- **Orientation:** ${comp.orientation}\n`;
    md += `- **Polarity:** ${comp.polarity}\n`;
    if (comp.value) md += `- **Value:** ${comp.value}\n`;
    md += `- **Position:** x=${comp.bbox.x}, y=${comp.bbox.y}, w=${comp.bbox.w}px, h=${comp.bbox.h}px\n`;
    if (comp.unknown) md += `\n⚠️ **Low confidence detected - may need verification**\n`;
    md += '\n';
  });

  md += '## 📖 Explanation\n\n';
  md += `### Quick Summary\n${analysis.explanation.short}\n\n`;
  md += `### Beginner-Friendly\n${analysis.explanation.student}\n\n`;
  md += `### Technical\n${analysis.explanation.engineer}\n\n`;

  if (analysis.warnings.length > 0) {
    md += '## ⚠️ Warnings & Issues\n\n';
    analysis.warnings.forEach((w) => {
      md += `### ${w.code} \`${w.severity}\`\n`;
      md += `${w.message}\n\n`;
      md += `**Action Required:** ${w.action}\n\n`;
    });
  }

  if (analysis.suggestions.length > 0) {
    md += '## 💡 Recommendations\n\n';
    analysis.suggestions.forEach((s) => {
      md += `### ${s.title}\n`;
      md += `**Type:** ${s.type}  \n`;
      md += `**Impact:** ${s.estimatedImpact}\n\n`;
      md += `${s.description}\n\n`;
      md += `**Action:** ${s.action}\n\n`;
    });
  }

  if (analysis.guidance.reasons.length > 0) {
    md += '## 📸 Image Quality\n\n';
    analysis.guidance.reasons.forEach((r) => {
      md += `- ${r}\n`;
    });
    md += '\n';
  }

  if (analysis.simulation) {
    md += '## ⚡ Simulation Results\n\n';
    md += `**Power Supply:** ${analysis.simulation.power_voltage || 'N/A'}V\n\n`;
    md += '### Component Status\n\n';
    md += '| Component | Status | Voltage (V) | Current (mA) | Power (mW) |\n';
    md += '|-----------|--------|------------|-------------|----------|\n';
    analysis.simulation.components.forEach((comp) => {
      const compName =
        analysis.components.find((c) => c.id === comp.componentId)?.canonicalLabel || comp.componentId;
      md += `| ${compName} | ${comp.status} | ${comp.voltage.toFixed(2)} | ${comp.current.toFixed(2)} | ${comp.power.toFixed(2)} |\n`;
    });
    md += '\n';

    if (analysis.simulation.warnings.length > 0) {
      md += '### ⚠️ Warnings\n';
      analysis.simulation.warnings.forEach((w) => {
        md += `- ${w}\n`;
      });
      md += '\n';
    }

    md += `**Note:** ${analysis.simulation.notes}\n\n`;
  }

  md += '---\n';
  md += '_Report generated by [Synthra](https://synthra.dev) - Circuit Photo Analysis Platform_\n';

  return md;
}

/**
 * Export to HTML (for web sharing)
 */
export function exportToHTML(analysis: AnalysisResponse): string {
  const escaped = (text: string) => text.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]!));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Circuit Analysis Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 40px; max-width: 900px; margin: 0 auto; padding: 20px; }
        h1 { color: #0369a1; border-bottom: 3px solid #0369a1; padding-bottom: 10px; }
        h2 { color: #075985; margin-top: 30px; }
        .metadata { background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .metadata p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        table th, table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        table th { background: #f0f9ff; font-weight: bold; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
        .success { background: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin: 15px 0; }
        .component { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .component-id { font-weight: bold; color: #0369a1; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <h1>🔌 Circuit Analysis Report</h1>
    
    <div class="metadata">
        <p><strong>Report ID:</strong> <code>${escaped(analysis.requestId)}</code></p>
        <p><strong>Timestamp:</strong> ${new Date(analysis.timestamp).toLocaleString()}</p>
        <p><strong>Processing Time:</strong> ${analysis.processingTimeMs}ms</p>
    </div>

    <h2>🎯 Circuit Identification</h2>
    <table>
        <tr><th>Property</th><th>Value</th></tr>
        <tr><td>Circuit Type</td><td><strong>${escaped(analysis.circuit.label.replace(/_/g, ' '))}</strong></td></tr>
        <tr><td>Family</td><td>${escaped(analysis.circuit.family)}</td></tr>
        <tr><td>Complexity</td><td>${escaped(analysis.circuit.complexity)}</td></tr>
        <tr><td>Confidence</td><td>${(analysis.circuit.confidence * 100).toFixed(1)}%</td></tr>
        <tr><td>Description</td><td>${escaped(analysis.circuit.description || 'N/A')}</td></tr>
    </table>

    <h2>🔧 Detected Components</h2>
    <p>Total: <strong>${analysis.components.length}</strong> components</p>
    ${analysis.components
      .map(
        (comp) =>
          `<div class="component">
        <div class="component-id">${escaped(comp.id)} - ${escaped(comp.canonicalLabel.toUpperCase())}</div>
        <table>
            <tr><td>Label</td><td>${escaped(comp.label)}</td></tr>
            <tr><td>Confidence</td><td>${(comp.confidence * 100).toFixed(1)}%</td></tr>
            <tr><td>Role</td><td>${escaped(comp.role || 'unknown')}</td></tr>
            <tr><td>Orientation</td><td>${escaped(comp.orientation)}</td></tr>
            <tr><td>Polarity</td><td>${escaped(comp.polarity)}</td></tr>
            ${comp.value ? `<tr><td>Value</td><td>${escaped(comp.value)}</td></tr>` : ''}
            <tr><td>Position</td><td>x=${comp.bbox.x}, y=${comp.bbox.y} | w=${comp.bbox.w}px, h=${comp.bbox.h}px</td></tr>
        </table>
        ${comp.unknown ? '<div class="warning">⚠️ Low confidence - may need verification</div>' : ''}
    </div>`,
      )
      .join('')}

    <h2>📖 Explanation</h2>
    <div><strong>Summary:</strong> ${escaped(analysis.explanation.short)}</div>
    <div style="margin-top: 15px;"><strong>Beginner-Friendly:</strong></div>
    <div>${escaped(analysis.explanation.student)}</div>
    <div style="margin-top: 15px;"><strong>Technical:</strong></div>
    <div><pre>${escaped(analysis.explanation.engineer)}</pre></div>

    ${
      analysis.warnings.length > 0
        ? `<h2>⚠️ Warnings</h2>
        ${analysis.warnings
          .map(
            (w) =>
              `<div class="warning">
            <strong>${escaped(w.code)}</strong> (${escaped(w.severity)})<br>
            ${escaped(w.message)}<br>
            <strong>Action:</strong> ${escaped(w.action)}
        </div>`,
          )
          .join('')}`
        : ''
    }

    ${
      analysis.suggestions.length > 0
        ? `<h2>💡 Recommendations</h2>
        ${analysis.suggestions
          .map(
            (s) =>
              `<div class="success">
            <strong>${escaped(s.title)}</strong> (${escaped(s.type)})<br>
            ${escaped(s.description)}<br>
            <strong>Action:</strong> ${escaped(s.action)}
        </div>`,
          )
          .join('')}`
        : ''
    }

    ${
      analysis.simulation
        ? `<h2>⚡ Simulation Results</h2>
        <p><strong>Power Supply:</strong> ${analysis.simulation.power_voltage || 'N/A'}V</p>
        <table>
            <tr><th>Component</th><th>Status</th><th>Voltage (V)</th><th>Current (mA)</th><th>Power (mW)</th></tr>
            ${analysis.simulation.components
              .map(
                (comp) => `<tr>
                <td>${escaped(analysis.components.find((c) => c.id === comp.componentId)?.canonicalLabel || comp.componentId)}</td>
                <td>${escaped(comp.status)}</td>
                <td>${comp.voltage.toFixed(2)}</td>
                <td>${comp.current.toFixed(2)}</td>
                <td>${comp.power.toFixed(2)}</td>
            </tr>`,
              )
              .join('')}
        </table>
        <p><strong>Note:</strong> ${escaped(analysis.simulation.notes)}</p>`
        : ''
    }

    <footer>
        <p>Generated by <a href="https://synthra.dev">Synthra</a> v1.0 - Circuit Photo Analysis Platform</p>
        <p>${new Date().toLocaleString()}</p>
    </footer>
</body>
</html>`;

  return html;
}

/**
 * CSV export for component list
 */
export function exportToCSV(analysis: AnalysisResponse): string {
  const header = ['ID', 'Component', 'Label', 'Confidence', 'Role', 'Orientation', 'Polarity', 'Value', 'X', 'Y', 'Width', 'Height'];
  const rows = analysis.components.map((comp) => [
    comp.id,
    comp.canonicalLabel,
    comp.label,
    (comp.confidence * 100).toFixed(1),
    comp.role || 'unknown',
    comp.orientation,
    comp.polarity,
    comp.value || '',
    comp.bbox.x,
    comp.bbox.y,
    comp.bbox.w,
    comp.bbox.h,
  ]);

  return [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}
