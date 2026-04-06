/**
 * Component Database & Schema
 * Central registry for all electrical components
 */

export interface ComponentMetadata {
  id: string;
  name: string;
  aliases: string[];
  category: 'resistor' | 'capacitor' | 'inductor' | 'diode' | 'transistor' | 'ic' | 'connector' | 'other';
  symbol: {
    schematic: string; // SVG path
    type: 'passive' | 'active' | 'semi';
  };
  polarity: 'none' | 'positive' | 'negative' | 'both';
  specs: {
    voltage?: { min: number; max: number; unit: string };
    current?: { min: number; max: number; unit: string };
    power?: { min: number; max: number; unit: string };
    resistance?: { min: number; max: number; unit: string };
    capacitance?: { min: number; max: number; unit: string };
  };
  failureModes: string[];
  warnings: string[];
  properties: Record<string, any>;
}

// Component Library
export const COMPONENT_LIBRARY: Record<string, ComponentMetadata> = {
  resistor: {
    id: 'resistor',
    name: 'Resistor',
    aliases: ['R', 'res', 'resistor', 'RES'],
    category: 'resistor',
    symbol: {
      schematic: 'M 0 10 L 20 0 L 40 20 L 60 0 L 80 20 L 100 0 L 120 10',
      type: 'passive',
    },
    polarity: 'none',
    specs: {
      resistance: { min: 1, max: 10000000, unit: 'Ω' },
      power: { min: 0.125, max: 10, unit: 'W' },
      voltage: { min: 0, max: 1000, unit: 'V' },
      current: { min: 0.001, max: 10, unit: 'A' },
    },
    failureModes: [
      'Open circuit (burned out due to overcurrent)',
      'Resistance drift (thermal aging)',
      'Thermal runaway (if undersized)',
      'Solder joint failure',
    ],
    warnings: [
      'Power dissipation = I²R must be < rating',
      'Verify E12/E24 series value matches schematic',
      'Thermal derate above 70°C',
      'Standard: 1/4W (0.25W), 1/2W (0.5W), 1W resistors',
    ],
    properties: {
      standard_values: '1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2 (E12 series)',
      thermalCoefficient: '±50 to ±100 ppm/°C (film)',
      tolerance: '±1% to ±5%',
      common_ratings: ['0.1W', '0.25W', '0.5W', '1W', '2W', '5W'],
      max_temp: 125,
    },
  },
  led: {
    id: 'led',
    name: 'Light Emitting Diode',
    aliases: ['LED', 'light', 'diode led', 'L'],
    category: 'diode',
    symbol: {
      schematic: 'M 10 0 L 10 20 M 0 10 L 20 10 M 15 5 L 20 0 M 15 15 L 20 20',
      type: 'semi',
    },
    polarity: 'positive',
    specs: {
      voltage: { min: 1.5, max: 3.5, unit: 'V' },
      current: { min: 2, max: 30, unit: 'mA' },
      power: { min: 0.01, max: 0.15, unit: 'W' },
    },
    failureModes: [
      'Open circuit (junction failure)',
      'Dim output (degradation from ESD or thermal stress)',
      'Short circuit (reversed polarity)',
      'Solder crack at leads',
    ],
    warnings: [
      'CRITICAL: Must use current-limiting resistor (220Ω-1kΩ typical)',
      'Respect absolute maximum: If I_F > 30mA, device fails',
      'Forward voltage varies by color: Red ~1.8V, Green ~2.1V, Blue ~3.2V, White ~3.3V',
      'Never exceed 50mA continuous',
      'Check polarity: Longer leg (+), shorter leg (-)',
    ],
    properties: {
      colors: { 'Red': { vf: 1.8, brightness_mcd: 100 }, 'Green': { vf: 2.1, brightness_mcd: 200 }, 'Blue': { vf: 3.2, brightness_mcd: 200 }, 'Yellow': { vf: 2.0, brightness_mcd: 150 }, 'White': { vf: 3.3, brightness_mcd: 300 }, 'IR': { vf: 1.5, brightness_mcd: 50 } },
      typical_current: '10-20 mA',
      max_current: '30 mA',
      typical_resistor: '(V_supply - V_f) / I = (5V - 2V) / 15mA = 200Ω',
    },
  },
  battery: {
    id: 'battery',
    name: 'Battery / Power Source',
    aliases: ['battery', 'power', 'cell', 'volt', 'PSU', '+V'],
    category: 'connector',
    symbol: {
      schematic: 'M 10 0 L 10 20 M 5 5 L 15 5 M 5 15 L 15 15',
      type: 'passive',
    },
    polarity: 'positive',
    specs: {
      voltage: { min: 0.6, max: 48, unit: 'V' },
      current: { min: 0.01, max: 100, unit: 'A' },
      power: { min: 0.01, max: 1000, unit: 'W' },
    },
    failureModes: [
      'Depleted (voltage sag)',
      'Internal resistance increase',
      'Leaking (alkaline cells)',
      'Thermal runaway (lithium)',
    ],
    warnings: [
      'ALWAYS verify polarity before connecting',
      'Check voltage rating (3.3V, 5V, 12V logic compatibility)',
      'Account for battery internal resistance (causes voltage sag under load)',
      'Alkaline: ~800mAh (AA), Lithium: ~2500-3000mAh (AA)',
      'Add capacitors (100µF) near load to buffer transients',
    ],
    properties: {
      types: { 'Alkaline AA': { voltage: 1.5, capacity_mah: 800 }, 'Alkaline 9V': { voltage: 9, capacity_mah: 500 }, 'Lithium AA': { voltage: 1.5, capacity_mah: 3000 }, 'NiMH AA': { voltage: 1.2, capacity_mah: 2000 }, 'Lead-acid 12V': { voltage: 12, capacity_ah: 5, type: 'rechargeable' } },
      internal_resistance_typical: '0.5-5 Ω (alkaline AA)',
    },
  },
  capacitor: {
    id: 'capacitor',
    name: 'Capacitor',
    aliases: ['C', 'cap', 'capacitor', 'CAP'],
    category: 'capacitor',
    symbol: {
      schematic: 'M 20 0 L 20 20 M 30 0 L 30 20',
      type: 'passive',
    },
    polarity: 'none',
    specs: {
      capacitance: { min: 0.001, max: 1000000, unit: 'µF' },
      voltage: { min: 6, max: 500, unit: 'V' },
      current: { min: 0, max: 100, unit: 'A' },
    },
    failureModes: [
      'Open circuit (internal plate failure)',
      'Dielectric breakdown (short circuit)',
      'Capacitance drift (temperature dependent)',
      'ESR increase (electrolytic aging)',
      'Leakage current increase',
    ],
    warnings: [
      'Respect voltage rating: Apply > V_rated = instant failure',
      'Ceramic: 1nF-100µF, low ESR, small | Electrolytic: 1µF-10mF, high ESR, polarized!',
      'Derating: Use only 50% of rated voltage for reliability',
      'Electrolytic polarity: + to positive, - to negative (reversed = explosion!)',
      'Temperature coefficient: Ceramic ±10% (X7R best), Electrolytic -20% at low T',
    ],
    properties: {
      types: {
        'Ceramic (multilayer)': { capacitance_range: '1pF-100µF', voltage: '6.3V-100V', esr: '50-200mΩ', cost: 'very low' },
        'Electrolytic': { capacitance_range: '1µF-10mF', voltage: '6.3V-500V', esr: '0.1-10Ω', cost: 'low', life: '1000-2000 hours at rated V,T' },
        'Film (polypropylene)': { capacitance_range: '100nF-100µF', voltage: '50V-1000V', esr: '10-100mΩ', cost: 'medium', stability: 'excellent' },
        'Tantalum': { capacitance_range: '10nF-330µF', voltage: '4V-50V', esr: '100-500mΩ', cost: 'high', risk: 'short-prone' },
      },
      common_values: '0.1µF (decoupling), 10µF (power supply), 100µF (filter)',
      decoupling_formula: 'Place 0.1µF ceramic within 1cm of IC Vcc pin',
    },
  },
  transistor: {
    id: 'transistor',
    name: 'Transistor (BJT/FET)',
    aliases: ['Q', 'BJT', 'FET', 'transistor', '2N2222', '2N3904', 'IRF540'],
    category: 'transistor',
    symbol: {
      schematic: 'M 10 10 L 20 0 L 20 20 L 10 10 M 0 5 L 10 10 M 0 15 L 10 10 M 20 0 L 25 -5 M 20 20 L 25 25',
      type: 'active',
    },
    polarity: 'positive',
    specs: {
      voltage: { min: 5, max: 500, unit: 'V' },
      current: { min: 0.001, max: 100, unit: 'A' },
      power: { min: 0.1, max: 150, unit: 'W' },
    },
    failureModes: [
      'Shorted (base-collector short due to ESD)',
      'Open circuit (led overheating)',
      'Leakage increase (thermal degradation)',
      'Thermal runaway (positive feedback)',
      'ESD damage (gate oxide puncture in FETs)',
    ],
    warnings: [
      'CRITICAL: Verify pinout! BJT can be BCE (2N3904) or CBE (2N2222). FET can be GDS.',
      'Add 100Ω base resistor to prevent saturation current surge: Rb = (V_in - 0.7V) / (β * I_c)',
      'FETs: Gate capacitance requires 10-100 ohm series resistor to damp ringing',
      'Always add reverse protection diode across inductive loads: Diode cathode to +V',
      'Thermal derating: If Tj > 150°C, device fails. Check thermal resistance > 150°C/W.',
      'ESD risk: Handle with anti-static protection. Gate threshold can be < 5V.',
    ],
    properties: {
      BJT_typical: { '2N3904': { type: 'NPN', Ic_max: '200mA', Pcmax: '600mW', hFE: '100-200', Vce_sat: '0.2V' }, '2N3906': { type: 'PNP', Ic_max: '200mA', Pcmax: '600mW', hFE: '100-200', Vce_sat: '0.2V' }, 'BC547': { type: 'NPN', Ic_max: '100mA', Vce_sat: '0.2V', hFE: '200' } },
      FET_typical: { 'IRF540': { type: 'N-channel MOSFET', Id_max: '28A', Vds_max: '100V', Rds_on: '44mΩ', Qg: '75nC' }, '2N7000': { type: 'N-channel MOSFET', Id_max: '500mA', Vds_max: '60V', Rds_on: '50Ω' } },
      switching_circuit_example: 'If driving 12V relay (coil current 50mA), use Rb = (5V - 0.7V) / (100 * 50mA) ≈ 860Ω',
    },
  },
  switch: {
    id: 'switch',
    name: 'Switch',
    aliases: ['SW', 'switch', 'button', 'toggle', 'pushbutton'],
    category: 'connector',
    symbol: {
      schematic: 'M 0 10 L 15 10 L 25 0 M 25 0 L 40 0',
      type: 'passive',
    },
    polarity: 'none',
    specs: {
      voltage: { min: 0, max: 250, unit: 'V' },
      current: { min: 0.001, max: 20, unit: 'A' },
      power: { min: 0, max: 500, unit: 'W' },
    },
    failureModes: [
      'Contact corrosion (high resistance when closed)',
      'Contact welding (stuck closed)',
      'Mechanical wear (bouncing on each press)',
      'Spring failure (stuck in position)',
    ],
    warnings: [
      'Contact debouncing: Add 10-100ms software delay or 100nF capacitor at digital input',
      'For high-current switching: Use relay or MOSFET, not logic gate directly',
      'Specify contact rating: Dry circuit (< 1V, 1µA) vs normal (5-250V, mA-A rated)',
      'Push-button contacts typically rated 0.1A @ 30VDC (low switching power)',
    ],
    properties: {
      types: { 'Push-button': { bounceTime_ms: '5-20', lifespan_cycles: '1000000' }, 'Toggle': { bounceTime_ms: '10-30', lifespan_cycles: '5000000' }, 'Rotary': { bounceTime_ms: '20-50', lifespan_cycles: '10000000' }, 'Tactile (SMD)': { bounceTime_ms: '5-10', lifespan_cycles: '1000000' } },
      debounce_rc_formula: 'R*C = 0.1 to 1 second for mechanical switches (e.g., 100k + 10µF)',
    },
  },
  diode: {
    id: 'diode',
    name: 'Diode (General Purpose)',
    aliases: ['D', 'diode', '1N4148', '1N4007', '1N4002', 'rectifier'],
    category: 'diode',
    symbol: {
      schematic: 'M 10 0 L 10 20 M 0 10 L 20 10 M 15 5 L 15 15',
      type: 'semi',
    },
    polarity: 'positive',
    specs: {
      voltage: { min: 50, max: 1000, unit: 'V' },
      current: { min: 0.01, max: 10, unit: 'A' },
      power: { min: 0.1, max: 50, unit: 'W' },
    },
    failureModes: [
      'Reverse breakdown (leakage current > spec)',
      'Forward conduction failure (open)',
      'Thermal runaway (Tj > Tjmax)',
      'Junction damage (ESD or overvoltage surge)',
    ],
    warnings: [
      'Polarity critical: Cathode marked with band. Reverse polarity = short, damage',
      'Forward voltage drop: 0.3V (Schottky) vs 0.7V (Si). Plan voltage budget accordingly.',
      'Max reverse voltage: 1N4007 rated 1000V PIV. Exceeding = catastrophic failure.',
      'Fast recovery: 1N4148 (4ns) for logic circuits. 1N4007 (500ns) for power supplies.',
      'Schottky (1N5819): Lower Vf (0.4V) but higher leakage, good for low-voltage circuits.',
    ],
    properties: {
      types: {
        '1N4148 (fast Si)': { Vf: '0.7V', Imax: '200mA', Vrmax: '100V', recovery_time: '4ns', best_for: 'fast switching' },
        '1N4007 (rectifier)': { Vf: '0.7V', Imax: '1A', Vrmax: '1000V', recovery_time: '500ns', best_for: 'power supply rectification' },
        '1N5819 (Schottky)': { Vf: '0.4V', Imax: '1A', Vrmax: '40V', leakage: 'high', best_for: 'low-voltage solar, Schottky clamping' },
        'Zener 1N4739 (5V)': { Vz: '5V', Pz_max: '1W', best_for: 'voltage regulation, clamping' },
      },
      forward_drop_budget: 'LED circuit needs: V_supply >= V_LED + V_R (resistor) so plan Vf drop',
      reverse_protection_formula: 'Add 1N4007 in series or reverse-blocking to prevent damage from reverse polarity',
    },
  },
};

/**
 * Get component by name or alias
 */
export function getComponent(name: string): ComponentMetadata | null {
  const lower = name.toLowerCase();
  for (const [key, component] of Object.entries(COMPONENT_LIBRARY)) {
    if (
      key === lower ||
      component.name.toLowerCase() === lower ||
      component.aliases.some((a) => a.toLowerCase() === lower)
    ) {
      return component;
    }
  }
  return null;
}

/**
 * Get all components in a category
 */
export function getComponentsByCategory(
  category: ComponentMetadata['category']
): ComponentMetadata[] {
  return Object.values(COMPONENT_LIBRARY).filter((c) => c.category === category);
}

/**
 * Get component warnings
 */
export function getComponentWarnings(component: ComponentMetadata): string[] {
  return component.warnings || [];
}

/**
 * Validate component connection
 */
export function validateComponentConnection(
  component1: ComponentMetadata,
  component2: ComponentMetadata,
  connectionType: 'series' | 'parallel'
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Example: Check if capacitors in series need voltage consideration
  if (connectionType === 'series') {
    if (
      component1.category === 'capacitor' &&
      component2.category === 'capacitor'
    ) {
      warnings.push(
        'Capacitors in series: total voltage divides. Ensure each capacitor voltage rating is adequate.'
      );
    }
  }

  // LED with resistor in series is good
  if (
    (component1.category === 'diode' &&
      component1.id === 'led' &&
      component2.category === 'resistor') ||
    (component1.category === 'resistor' && component2.id === 'led')
  ) {
    // Good practice
  }

  return { valid: warnings.length === 0, warnings };
}
