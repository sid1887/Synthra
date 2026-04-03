export function buildSchematicFromComponents(components, circuit) {
  const nodes = [];
  const edges = [];

  const nodeMap = new Map();
  const roles = inferComponentRoles(components, circuit);

  let nodeId = 0;
  for (const component of components) {
    const role = roles.get(component.id) || "unknown";
    const node = {
      id: `node_${nodeId}`,
      componentId: component.id,
      label: component.canonicalLabel,
      role,
      x: 100 + nodeId * 60,
      y: 100 + (nodeId % 3) * 60,
      width: 80,
      height: 40
    };
    nodes.push(node);
    nodeMap.set(component.id, node.id);
    nodeId++;
  }

  if (nodes.length >= 2) {
    const labels = new Set(components.map((c) => c.canonicalLabel));

    if (labels.has("battery")) {
      const battery = nodes.find((n) => n.label === "battery");
      const nonBattery = nodes.filter((n) => n.label !== "battery");

      for (let i = 0; i < Math.min(nonBattery.length, 3); i++) {
        edges.push({
          id: `edge_${edges.length}`,
          from: battery.id,
          to: nonBattery[i].id,
          type: "connection"
        });
      }
    } else if (nodes.length >= 2) {
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
          id: `edge_${edges.length}`,
          from: nodes[i].id,
          to: nodes[i + 1].id,
          type: "connection"
        });
      }
    }
  }

  const isComplete = validateCircuitCompleteness(components, circuit);
  const confidence = isComplete ? circuit.confidence : circuit.confidence * 0.75;

  return {
    nodes,
    edges,
    layout: "hierarchical",
    isPartial: !isComplete,
    confidence,
    warnings: isComplete ? [] : ["Incomplete circuit topology - schematic is best-effort"],
    summary: `${nodes.length} nodes, ${edges.length} connections, layout=${nodes.length < 5 ? "simple" : "complex"}`
  };
}

function inferComponentRoles(components, circuit) {
  const roles = new Map();
  const labels = new Set(components.map((c) => c.canonicalLabel));

  for (const component of components) {
    if (component.canonicalLabel === "battery") {
      roles.set(component.id, "power_source");
    } else if (component.canonicalLabel === "led") {
      roles.set(component.id, labels.has("resistor") ? "load_protected" : "load");
    } else if (component.canonicalLabel === "resistor") {
      roles.set(component.id, labels.has("led") ? "current_limiter" : "load");
    } else if (component.canonicalLabel === "switch") {
      roles.set(component.id, "control");
    } else if (component.canonicalLabel === "diode") {
      roles.set(component.id, "protection");
    } else {
      roles.set(component.id, "passive_or_active");
    }
  }

  return roles;
}

function validateCircuitCompleteness(components, circuit) {
  if (!components || components.length === 0) return false;
  if (circuit.confidence < 0.50) return false;

  const labels = new Set(components.map((c) => c.canonicalLabel));
  const hasLoop = labels.has("battery") && components.length >= 2;

  return hasLoop;
}
