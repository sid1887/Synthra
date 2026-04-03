export function simulateStaticCircuit(components, circuit) {
  const labels = new Set(components.map((c) => c.canonicalLabel));

  if (!labels.has("battery")) {
    return {
      mode: "static",
      status: "incomplete",
      error: "No power source found",
      components_state: [],
      summary: "Cannot simulate without a battery or power source."
    };
  }

  const battery = components.find((c) => c.canonicalLabel === "battery");
  const voltage = estimateBatteryVoltage(battery);

  const state = {
    powerSource: {
      type: "battery",
      voltage,
      isActive: true
    },
    components_state: []
  };

  let pathVoltage = voltage;
  let pathCurrent = 0;
  let totalResistance = 0;

  let ledCount = 0;
  let resistorCount = 0;

  for (const component of components) {
    if (component.canonicalLabel === "battery") continue;

    if (component.canonicalLabel === "resistor") {
      const ohms = estimateResistance(component);
      totalResistance += ohms;
      resistorCount += 1;

      state.components_state.push({
        id: component.id,
        type: "resistor",
        resistance: ohms,
        voltage: 0,
        current: 0,
        power: 0,
        status: "nominal"
      });
    } else if (component.canonicalLabel === "led") {
      ledCount += 1;
      state.components_state.push({
        id: component.id,
        type: "led",
        voltage: 0,
        current: 0,
        power: 0,
        brightness: 0,
        status: "off",
        nominal_voltage: 2.0,
        max_current: 0.02
      });
    } else if (component.canonicalLabel === "switch") {
      state.components_state.push({
        id: component.id,
        type: "switch",
        state: "closed",
        status: "operational"
      });
    } else if (component.canonicalLabel === "diode") {
      state.components_state.push({
        id: component.id,
        type: "diode",
        conduct: true,
        voltage_drop: 0.7,
        status: "forward_biased"
      });
    } else {
      state.components_state.push({
        id: component.id,
        type: component.canonicalLabel,
        status: "present"
      });
    }
  }

  const switchOpen = !labels.has("switch");

  if (switchOpen) {
    state.circuit_state = "open";
    state.summary = "Circuit is open (switch off or missing). No current flows.";
    state.is_powered = false;
    return {
      mode: "static",
      status: "ok",
      ...state
    };
  }

  state.circuit_state = "closed";

  if (ledCount > 0 && !resistorCount) {
    const riskStatus = voltage > 5 ? "danger_overvoltage" : "risk_no_current_limit";
    state.warning = `LED without resistor - ${riskStatus}`;
    state.components_state = state.components_state.map((c) =>
      c.type === "led" ? { ...c, status: "at_risk" } : c
    );
  }

  if (totalResistance > 0) {
    pathCurrent = voltage / (totalResistance + 10);
  } else {
    pathCurrent = voltage / 50;
  }

  pathCurrent = Math.min(pathCurrent, 0.5);

  state.components_state = state.components_state.map((c) => {
    if (c.type === "resistor") {
      return {
        ...c,
        current: pathCurrent,
        voltage: pathCurrent * c.resistance,
        power: pathCurrent * pathCurrent * c.resistance
      };
    } else if (c.type === "led") {
      const isSafe = pathCurrent <= c.max_current;
      const brightness = isSafe ? pathCurrent * 50 : 100;
      return {
        ...c,
        current: pathCurrent,
        voltage: c.nominal_voltage,
        power: pathCurrent * c.nominal_voltage,
        brightness,
        status: isSafe ? "on" : "over_current"
      };
    } else if (c.type === "diode") {
      return { ...c, current: pathCurrent };
    }
    return c;
  });

  state.is_powered = true;
  state.path_current_amps = Number(pathCurrent.toFixed(3));
  state.total_resistance_ohms = Number(totalResistance.toFixed(2));
  state.summary = `${ledCount} LED(s) receiving ~${pathCurrent.toFixed(2)}A, ${resistorCount} resistor(s) limiting current.`;

  return {
    mode: "static",
    status: "ok",
    confidence: circuit.confidence,
    ...state
  };
}

function estimateBatteryVoltage(battery) {
  if (!battery) return 9;
  const label = (battery.canonicalLabel || "").toLowerCase();
  if (label.includes("9v")) return 9;
  if (label.includes("5v")) return 5;
  if (label.includes("3v")) return 3;
  return 9;
}

function estimateResistance(resistor) {
  if (!resistor) return 220;
  const label = (resistor.canonicalLabel || "").toLowerCase();
  if (label.includes("10k")) return 10000;
  if (label.includes("1k")) return 1000;
  if (label.includes("470")) return 470;
  if (label.includes("220")) return 220;
  if (label.includes("100")) return 100;
  return 220;
}
