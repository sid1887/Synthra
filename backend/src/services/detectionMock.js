const keywordMap = {
  led: ["led", "lamp", "light"],
  resistor: ["res", "resistor", "ohm"],
  battery: ["battery", "cell", "9v", "power"],
  switch: ["switch", "button", "toggle"],
  diode: ["diode"],
  capacitor: ["capacitor", "cap"],
  transistor: ["transistor", "bjt", "mosfet"],
  wire: ["wire", "jumper", "cable"]
};

function hasAnyKeyword(text, keywords) {
  return keywords.some((k) => text.includes(k));
}

function fakeBox(index) {
  const x = 40 + index * 42;
  const y = 60 + (index % 2) * 38;
  return { x, y, w: 70, h: 26 };
}

export function inferRawDetections({ fileName, quality }) {
  const source = (fileName || "").toLowerCase();
  const raw = [];
  let idx = 0;

  for (const [label, keys] of Object.entries(keywordMap)) {
    if (hasAnyKeyword(source, keys)) {
      raw.push({
        label,
        confidence: 0.72 + (idx % 3) * 0.08,
        bbox: fakeBox(idx)
      });
      idx += 1;
    }
  }

  if (!raw.length && !(quality.dark && quality.blurry)) {
    raw.push({
      label: "unknown_object",
      confidence: 0.38,
      bbox: fakeBox(0)
    });
  }

  if (raw.find((item) => item.label === "led")) {
    raw.push({
      label: "light_emitting_diode",
      confidence: 0.61,
      bbox: fakeBox(idx + 1)
    });
  }

  return raw;
}
