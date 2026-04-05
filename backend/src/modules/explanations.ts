/**
 * A7: Explanation + Diagnostics Engine
 * Generates multi-level explanations and identifies issues
 */

import { ComponentDetection, CircuitIdentification, Explanation, Suggestion } from '../types/schemas.js';

// Explanation templates by circuit type
const EXPLANATION_TEMPLATES: Record<string, Explanation> = {
  battery_resistor_led: {
    short: 'Basic LED circuit powered by battery with resistor protection',
    student: `This is a simple LED circuit. Electricity flows from the positive (+) end of the battery through the resistor, which slows the current to protect the LED. The LED lights up, and electricity returns to the negative (-) end of the battery. The resistor is essential—without it, too much current would burn out the LED.`,
    engineer: `Standard LED driver circuit: battery powers an LED with series resistor (ILIM). Resistor value set by Ohm\'s law: VRES = VBATT - VLED, RMIN = VRES / ILED(max). Current limiting prevents LED junction degradation. For typical 2V LED on 9V supply: R ≥ (9-2)/20mA = 350Ω; use 470Ω ±5%.`,
  },
  parallel_led_output: {
    short: 'Multiple LEDs in parallel branches, all powered together',
    student: `This circuit has several LEDs connected in parallel (side-by-side). They all turn on and off together. Each LED gets the same voltage from the battery, but the resistor controls how bright they are.`,
    engineer: `Parallel LED array topology: Branch impedance R_branch ≈ 10-50Ω per LED + RLED(≈20Ω). Global current ITOT = N × ILED. Ensure RTOTAL×ITOT + N×VLED ≤ VBATT to prevent over-voltage dropout. Monitor total dissipation P = VBATT × ITOT.`,
  },
  resistor_divider: {
    short: 'Voltage divider: resistors in series split the battery voltage',
    student: `When resistors are connected in a line (series), the battery voltage gets split across them. This is used to create specific voltage levels at different points in a circuit, like for sensor inputs or tuning circuits.`,
    engineer: `Classic voltage divider: VOUT = VIN × R2 / (R1 + R2). Output impedance ZOUT = R1 || R2 = R1×R2/(R1+R2). For precise divisions (analog input), ensure R1+R2 >> load impedance; typical bias resistors 10k-100k. Power dissipation P = VIN²/(R1+R2).`,
  },
  transistor_switch_circuit: {
    short: 'Transistor switches a circuit on/off or amplifies a signal',
    student: `A transistor is like an electronic switch or amplifier. A small signal at the control pin turns a larger current on or off. This is how circuits can be controlled automatically or amplified.`,
    engineer: `BJT switch topology (common-emitter): VCE_sat ≈ 0.2V, IB_min = IC / hFE_min for saturation. Base resistor RB = (VBE_src - VBE_on) / IB_needed. Switching time dominated by C_junction and RB. For audio: ensure linear region operation, RC × IC = VCC - VCE_desired.`,
  },
  rc_low_pass_filter: {
    short: 'RC filter: capacitor and resistor reduce high-frequency noise',
    student: `A resistor and capacitor connected together form a filter. It blocks fast changes (high frequencies) while letting slow changes (low frequencies) through. This smooths out noise in circuits.`,
    engineer: `First-order RC low-pass: corner frequency f_c = 1/(2πRC). Attenuation @ 10×f_c ≈ -20dB. Impedance Z(ω) = R + (1/jωC). Time-constant τ = RC determines settling (5τ for 99% settling). For typical 10kΩ resistor: C = 1/(2π×10k×1kHz) ≈ 16nF.`,
  },
  diode_protection_circuit: {
    short: 'Diode protects circuit from reverse voltage or spikes',
    student: `A diode allows current to flow in one direction only. It\'s used to protect circuits—if voltage suddenly spikes or gets reversed, the diode blocks it and saves the rest of the circuit.`,
    engineer: `Flywheel/protection diode (reverse-biased): VF ≈ 0.6-0.7V forward drop. Reverse leakage IR (nA @ VR << VBR). Placement: parallel (reverse polarity clamp) or series (current blocking). For inductive kickback: diode rating must exceed peak current and reverse breakdown voltage must be safe margin above normal supply.`,
  },
  switch_controlled_circuit: {
    short: 'Manual switch to turn the circuit on and off',
    student: `A switch breaks or connects the circuit. When open, no current flows. When closed, current flows and the circuit works. Simple on/off control.`,
    engineer: `Switch contact resistance RCE < 100mΩ (typical). Switch current rating IC_switch must exceed max circuit current; arcing risk at I×R contact jump above 200mA. Debounce time 10-50ms for mechanical switches; consider RC snubber for noise immunity.`,
  },
  unidentified_topology: {
    short: 'Circuit topology not yet recognized',
    student: `This circuit is not matching known patterns. It might be a custom circuit or use components we need more information about.`,
    engineer: `Circuit classification confidence below threshold. Possible causes: (1) unusual component combination, (2) image quality or angle prevents confident detection, (3) partially visible topology. Recommendation: retake image from top-down orthogonal view with uniform lighting.`,
  },
};

// Suggestion templates by issue type
const SUGGESTION_LIBRARY: Suggestion[] = [
  {
    id: 'add_resistor_led',
    type: 'fix',
    title: 'Add Current-Limiting Resistor',
    description: 'LEDs can be damaged by excessive current. A resistor limits current to safe levels.',
    affectedComponents: undefined,
    estimatedImpact: 'prevents_led_burnout',
    action: 'Insert a 220Ω - 470Ω resistor in series with each LED',
  },
  {
    id: 'verify_polarity',
    type: 'fix',
    title: 'Verify Component Polarity',
    description: 'Some components (diodes, LEDs, capacitors) only work in one direction.',
    affectedComponents: undefined,
    estimatedImpact: 'component_function',
    action: 'Check that positive leads connect to positive power rails; negative to ground',
  },
  {
    id: 'add_decoupling_cap',
    type: 'enhancement',
    title: 'Add Decoupling Capacitor (Optional)',
    description:
      'A small capacitor near power pins can reduce noise and improve stability, especially with ICs.',
    affectedComponents: undefined,
    estimatedImpact: 'signal_quality',
    action: 'Optional: Add 0.1µF ceramic capacitor as close as possible to IC power pins',
  },
  {
    id: 'check_power_budget',
    type: 'warning',
    title: 'Check Power Budget',
    description: 'Ensure the battery can provide enough current for all components.',
    affectedComponents: undefined,
    estimatedImpact: 'circuit_reliability',
    action: 'Calculate total current draw; ensure battery mAh is at least 100× typical circuit current (mA)',
  },
  {
    id: 'add_protection_diode',
    type: 'enhancement',
    title: 'Add Protection Diode (Optional)',
    description: 'A protection diode prevents damage from reverse voltage or inductive spikes.',
    affectedComponents: undefined,
    estimatedImpact: 'robustness',
    action: 'Optional: Add 1N4148 protection diode to guard against inductive kickback',
  },
  {
    id: 'balance_parallel_leds',
    type: 'fix',
    title: 'Balance Parallel LED Branches',
    description: 'In parallel LED circuits, current divides unequally without individual resistors per branch.',
    affectedComponents: undefined,
    estimatedImpact: 'led_brightness_consistency',
    action: 'Add individual resistor (~220Ω) in series with each parallel LED branch to balance brightness',
  },
];

/**
 * Generate explanations at multiple levels
 */
export function generateExplanation(circuit: CircuitIdentification): Explanation {
  return EXPLANATION_TEMPLATES[circuit.label] || EXPLANATION_TEMPLATES['unidentified_topology'];
}

/**
 * Generate suggestions based on circuit and components
 */
export function generateSuggestions(
  components: ComponentDetection[],
  circuit: CircuitIdentification,
  diagnostics: any[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Auto-suggest based on detected issues
  const hasDiagnostic = (code: string) => diagnostics.some((d) => d.code === code);

  if (hasDiagnostic('MISSING_RESISTOR')) {
    suggestions.push(SUGGESTION_LIBRARY[0]); // add_resistor_led
  }

  if (components.some((c) => c.polarity && c.unknown)) {
    suggestions.push(SUGGESTION_LIBRARY[1]); // verify_polarity
  }

  // Suggest decoupling cap if IC present
  if (components.some((c) => c.canonicalLabel === 'ic')) {
    suggestions.push(SUGGESTION_LIBRARY[2]); // add_decoupling_cap
  }

  // Always suggest power budget check
  if (components.length > 3) {
    suggestions.push(SUGGESTION_LIBRARY[3]); // check_power_budget
  }

  // Suggest protection diode if inductive components or transistor
  if (components.some((c) => ['transistor', 'inductor'].includes(c.canonicalLabel))) {
    suggestions.push(SUGGESTION_LIBRARY[4]); // add_protection_diode
  }

  // Parallel LED balance check
  const ledCount = components.filter((c) => c.canonicalLabel === 'led').length;
  if (ledCount > 1) {
    suggestions.push(SUGGESTION_LIBRARY[5]); // balance_parallel_leds
  }

  return suggestions;
}

/**
 * Generate capture guidance based on quality
 */
export function generateCaptureGuidance(components: ComponentDetection[], imageQuality: any) {
  const lowConfidenceCount = components.filter((c) => c.confidence < 0.65).length;
  const lowConfidenceRatio = lowConfidenceCount / (components.length || 1);

  return {
    askSecondAngle: lowConfidenceRatio > 0.3 || imageQuality.anglePoor,
    askCloserShot: components.some((c) => c.bbox.w < 30) || imageQuality.blurry,
    askTopDown: imageQuality.anglePoor,
    askBetterLighting: imageQuality.dark,
    reasons: [
      imageQuality.blurry && 'Image appears blurry',
      imageQuality.dark && 'Low light detected',
      imageQuality.anglePoor && 'Non-orthogonal view angle',
      lowConfidenceRatio > 0.2 && 'Some components uncertain',
    ].filter(Boolean) as string[],
  };
}
