function listComponents(components) {
  return (components || []).map((c) => c.canonicalLabel).join(", ") || "no recognized components";
}

export function buildExplanation({ circuit, components, warnings }) {
  const componentText = listComponents(components);
  const warningText = warnings.length
    ? `Key warning: ${warnings[0].message}`
    : "No critical issues detected in this pass.";

  return {
    short: `${circuit.summary} Components: ${componentText}.`,
    student: `This looks like ${circuit.label.replace(/_/g, " ")}. I can see ${componentText}. ${warningText}`,
    engineer: `Classification=${circuit.label}, family=${circuit.family}, confidence=${circuit.confidence}. Parsed components=[${componentText}]. ${warningText}`,
    beginner: `Synthra thinks this is likely a ${circuit.label.replace(/_/g, " ")}. ${warningText}`,
    troubleshooting: warningText
  };
}
