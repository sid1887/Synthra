function hasAll(set, list) {
  return list.every((name) => set.has(name));
}

export function identifyCircuit(components) {
  const labels = new Set((components || []).map((c) => c.canonicalLabel));

  if (hasAll(labels, ["battery", "resistor", "led", "switch"])) {
    return {
      label: "switch_controlled_led",
      family: "simple_dc",
      complexity: "simple",
      confidence: 0.88,
      summary: "A switch controls current to an LED through a resistor."
    };
  }

  if (hasAll(labels, ["battery", "resistor", "led"])) {
    return {
      label: "battery_resistor_led",
      family: "simple_dc",
      complexity: "simple",
      confidence: 0.84,
      summary: "A battery drives an LED with current limiting by resistor."
    };
  }

  if (hasAll(labels, ["battery", "led"])) {
    return {
      label: "led_circuit_incomplete",
      family: "simple_dc",
      complexity: "simple",
      confidence: 0.62,
      summary: "Likely LED circuit but missing one or more expected parts."
    };
  }

  if (labels.has("unknown") || labels.size === 0) {
    return {
      label: "unknown_incomplete",
      family: "unknown",
      complexity: "unknown",
      confidence: 0.35,
      summary: "Not enough reliable structure to classify the circuit."
    };
  }

  return {
    label: "simple_circuit",
    family: "general_dc",
    complexity: labels.size <= 4 ? "simple" : "moderate",
    confidence: 0.58,
    summary: "Simple circuit pattern detected but not matching a strict template."
  };
}
