import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanDetections,
  normalizeLabel
} from "../src/services/componentPipeline.js";
import { identifyCircuit } from "../src/services/circuitEngine.js";
import { buildSchematicFromComponents } from "../src/services/reconstructionEngine.js";
import { simulateStaticCircuit } from "../src/services/simulationEngine.js";

function component(name, confidence = 0.8) {
  return { id: `cmp_${name}`, canonicalLabel: name, confidence, count: 1 };
}

test("Full pipeline: LED with battery and resistor", () => {
  const components = [
    component("battery", 0.9),
    component("resistor", 0.85),
    component("led", 0.88)
  ];

  const circuit = identifyCircuit(components);
  assert.equal(circuit.label, "battery_resistor_led");

  const recon = buildSchematicFromComponents(components, circuit);
  assert.equal(recon.nodes.length, 3);
  assert.equal(recon.edges.length > 0, true);

  const sim = simulateStaticCircuit(components, circuit);
  assert.equal(sim.status, "ok");
  assert.equal(sim.circuit_state, "open");
  assert.equal(sim.is_powered, false);
});

test("Pipeline: Circuit with switch (closed)", () => {
  const components = [
    component("battery", 0.9),
    component("resistor", 0.85),
    component("led", 0.88),
    component("switch", 0.82)
  ];

  const circuit = identifyCircuit(components);
  assert.equal(circuit.label, "switch_controlled_led");

  const sim = simulateStaticCircuit(components, circuit);
  assert.equal(sim.status, "ok");
  assert.equal(sim.circuit_state, "closed");
  assert.equal(sim.is_powered, true);
  assert.ok(sim.path_current_amps > 0);
});

test("Pipeline: Incomplete circuit (no power)", () => {
  const components = [component("led", 0.88), component("resistor", 0.75)];

  const circuit = identifyCircuit(components);
  assert.equal(circuit.label, "simple_circuit");

  const sim = simulateStaticCircuit(components, circuit);
  assert.equal(sim.status, "incomplete");
  assert.equal(sim.error, "No power source found");
});
