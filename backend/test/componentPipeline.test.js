import test from "node:test";
import assert from "node:assert/strict";
import { cleanDetections, normalizeLabel } from "../src/services/componentPipeline.js";

test("normalizeLabel resolves aliases", () => {
  assert.equal(normalizeLabel("light emitting diode"), "led");
  assert.equal(normalizeLabel("unknown_object"), "unknown");
});

test("cleanDetections merges duplicates and keeps supported labels", () => {
  const input = [
    { label: "led", confidence: 0.7, bbox: { x: 0, y: 0, w: 10, h: 10 } },
    { label: "light_emitting_diode", confidence: 0.8, bbox: { x: 2, y: 2, w: 10, h: 10 } },
    { label: "resistor", confidence: 0.9, bbox: { x: 5, y: 5, w: 10, h: 10 } },
    { label: "strange_ic", confidence: 0.6, bbox: { x: 9, y: 9, w: 10, h: 10 } }
  ];

  const result = cleanDetections(input);

  const names = result.components.map((c) => c.canonicalLabel);
  assert.ok(names.includes("led"));
  assert.ok(names.includes("resistor"));
  assert.ok(names.includes("unknown"));

  const led = result.components.find((c) => c.canonicalLabel === "led");
  assert.equal(led.count, 2);
  assert.equal(led.confidence, 0.8);
});
