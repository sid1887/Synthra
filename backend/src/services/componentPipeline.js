const SUPPORTED_COMPONENTS = new Set([
  "resistor",
  "led",
  "battery",
  "switch",
  "diode",
  "capacitor",
  "transistor",
  "wire",
  "unknown"
]);

const ALIASES = {
  light_emitting_diode: "led",
  lamp_led: "led",
  res: "resistor",
  cell: "battery",
  jumper_wire: "wire",
  unknown_object: "unknown"
};

const COMPONENT_COLORS = {
  resistor: "amber",
  led: "red",
  battery: "green",
  switch: "blue",
  diode: "purple",
  capacitor: "teal",
  transistor: "orange",
  wire: "slate",
  unknown: "gray"
};

function normalizeToken(label) {
  return String(label || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

export function normalizeLabel(label) {
  const token = normalizeToken(label);
  return ALIASES[token] || token;
}

function groupAndMerge(items) {
  const grouped = new Map();
  for (const item of items) {
    const key = item.canonicalLabel;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        id: `cmp_${grouped.size + 1}`,
        label: key,
        canonicalLabel: key,
        confidence: item.confidence,
        bbox: item.bbox,
        count: 1,
        colorTag: COMPONENT_COLORS[key] || "gray"
      });
      continue;
    }
    existing.confidence = Math.max(existing.confidence, item.confidence);
    existing.count += 1;
  }

  return Array.from(grouped.values()).sort((a, b) => b.confidence - a.confidence);
}

export function cleanDetections(rawDetections) {
  const normalized = (rawDetections || []).map((item) => ({
    canonicalLabel: normalizeLabel(item.label),
    confidence: Number(item.confidence || 0),
    bbox: item.bbox || { x: 0, y: 0, w: 1, h: 1 }
  }));

  const supported = normalized.filter((item) => SUPPORTED_COMPONENTS.has(item.canonicalLabel));
  const merged = groupAndMerge(supported);

  const hasUnknown = merged.some((item) => item.canonicalLabel === "unknown");
  const unsupportedCount = normalized.length - supported.length;

  if (unsupportedCount > 0 && !hasUnknown) {
    merged.push({
      id: `cmp_${merged.length + 1}`,
      label: "unknown",
      canonicalLabel: "unknown",
      confidence: 0.4,
      bbox: { x: 0, y: 0, w: 1, h: 1 },
      count: unsupportedCount,
      colorTag: COMPONENT_COLORS.unknown
    });
  }

  return {
    components: merged,
    componentNames: merged.map((item) => item.canonicalLabel)
  };
}
