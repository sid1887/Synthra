import test from "node:test";
import assert from "node:assert/strict";
import { identifyCircuit } from "../src/services/circuitEngine.js";

function component(name) {
  return { canonicalLabel: name, confidence: 0.8 };
}

test("identify switch controlled LED", () => {
  const result = identifyCircuit([
    component("battery"),
    component("resistor"),
    component("led"),
    component("switch")
  ]);

  assert.equal(result.label, "switch_controlled_led");
  assert.equal(result.family, "simple_dc");
});

test("identify unknown on empty or unknown components", () => {
  const resultUnknown = identifyCircuit([component("unknown")]);
  const resultEmpty = identifyCircuit([]);
  assert.equal(resultUnknown.label, "unknown_incomplete");
  assert.equal(resultEmpty.label, "unknown_incomplete");
});
