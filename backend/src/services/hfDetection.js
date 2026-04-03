import { config } from "../config.js";

export async function detectObjectsFromHF(imageBuffer) {
  if (!config.hfToken || !config.hfModelId) {
    throw new Error("Missing HF_API_TOKEN or HF_MODEL_ID environment variables");
  }

  const prompt = [
    "resistor",
    "led",
    "battery",
    "switch",
    "diode",
    "capacitor",
    "transistor",
    "wire",
    "jumper wire",
    "connector"
  ];

  const base64Image = imageBuffer.toString("base64");

  try {
    const response = await fetch(`${config.hfApiUrl}/${config.hfModelId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.hfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: base64Image,
        candidate_labels: prompt,
        hypothesis_template: "This is a photo of a {}"
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HF API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return parseHFResponse(data);
  } catch (error) {
    throw new Error(`HF detection failed: ${error.message}`);
  }
}

function parseHFResponse(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  const results = [];

  for (const item of data) {
    if (!item.results || !Array.isArray(item.results)) continue;

    for (const result of item.results) {
      if (!result.label) continue;

      const confidence = Number(result.score || 0);
      if (confidence < 0.1) continue;

      const bbox = result.box || {
        xmin: Math.random() * 0.6,
        ymin: Math.random() * 0.6,
        xmax: Math.random() * 0.3 + 0.7,
        ymax: Math.random() * 0.3 + 0.7
      };

      results.push({
        label: normalizeHFLabel(result.label),
        confidence: Math.min(1, Math.max(0, confidence)),
        bbox: {
          x: Math.round((bbox.xmin || 0) * 1000),
          y: Math.round((bbox.ymin || 0) * 1000),
          w: Math.round(((bbox.xmax || 0.3) - (bbox.xmin || 0)) * 1000),
          h: Math.round(((bbox.ymax || 0.3) - (bbox.ymin || 0)) * 1000)
        }
      });
    }
  }

  return results.length > 0
    ? results
    : [
        {
          label: "unknown",
          confidence: 0.4,
          bbox: { x: 100, y: 100, w: 300, h: 300 }
        }
      ];
}

function normalizeHFLabel(label) {
  const normalized = String(label || "").toLowerCase().trim();

  const mapping = {
    resistor: "resistor",
    "resistor (r)": "resistor",
    led: "led",
    "led (d)": "led",
    "light emitting diode": "led",
    battery: "battery",
    "battery (b)": "battery",
    "power source": "battery",
    switch: "switch",
    diode: "diode",
    capacitor: "capacitor",
    "capacitor (c)": "capacitor",
    transistor: "transistor",
    "transistor (q)": "transistor",
    wire: "wire",
    "jumper wire": "wire",
    "jumper": "wire",
    connector: "connector"
  };

  return mapping[normalized] || normalized.replace(/[^a-z0-9_]/g, "");
}
