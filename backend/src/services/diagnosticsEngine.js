export function generateDiagnostics({ components, circuit, quality, minConfidence }) {
  const labels = new Set((components || []).map((c) => c.canonicalLabel));

  const warnings = [];
  const fixes = [];
  const suggestions = [];

  const lowConfidenceComponents = (components || []).filter((c) => c.confidence < minConfidence);
  if (lowConfidenceComponents.length > 0) {
    warnings.push({
      code: "LOW_CONFIDENCE",
      severity: "medium",
      message: "Some components are below confidence threshold.",
      action: "Retake a top-down photo with better lighting."
    });
  }

  if (labels.has("battery") && labels.has("led") && !labels.has("resistor")) {
    warnings.push({
      code: "MISSING_RESISTOR",
      severity: "high",
      message: "LED appears to be missing a current-limiting resistor.",
      action: "Add a resistor in series with the LED."
    });

    fixes.push({
      title: "Add current-limiting resistor",
      reason: "Protects LED from overcurrent.",
      priority: "high"
    });
  }

  if (!labels.has("battery")) {
    warnings.push({
      code: "MISSING_POWER_SOURCE",
      severity: "medium",
      message: "No clear power source found.",
      action: "Ensure the battery or supply is visible in the frame."
    });
  }

  if (quality.dark) {
    suggestions.push({
      code: "INCREASE_LIGHTING",
      message: "Increase lighting for clearer detection."
    });
  }

  if (quality.blurry) {
    suggestions.push({
      code: "MOVE_CLOSER",
      message: "Move closer and hold the camera steady."
    });
  }

  if (quality.anglePoor) {
    suggestions.push({
      code: "TRY_TOP_DOWN",
      message: "Capture a top-down angle to improve connectivity interpretation."
    });
  }

  return {
    warnings,
    fixes,
    suggestions,
    guidance: {
      askSecondAngle: quality.anglePoor || circuit.confidence < 0.55,
      askCloserShot: quality.blurry,
      askTopDown: quality.anglePoor
    }
  };
}
