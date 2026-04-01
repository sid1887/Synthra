# Data Collection Guide: How to Help Improve Synthra

## Overview

The bidirectional circuit system is fully functional and ready to use. To make it truly professional and production-grade, you can provide the following data.

---

## 1. Component Database (HIGHEST PRIORITY)

### What We Need
A structured list of 50+ real electronic components with their specifications.

### Format (YAML)
Create `services/sve/components_database.yaml`:

```yaml
# Passive Components - Resistors
resistors:
  carbon_film:
    - id: "res_cf_100r_1/4w"
      name: "Carbon Film Resistor 100Ω 1/4W"
      value: 100
      unit: "Ω"
      tolerance: "±5%"
      power_rating: "0.25W"
      temp_coeff: "±100ppm/°C"
      manufacturers: ["Vishay", "Yageo", "TE Connectivity"]
      part_numbers:
        vishay: "CFR-25JB-100R"
        yageo: "CFR-25JT-100R"
      spice_model: "R generic"
      datasheet_url: "https://..."

    - id: "res_cf_1k_1/4w"
      name: "Carbon Film Resistor 1kΩ 1/4W"
      value: 1000
      unit: "Ω"
      tolerance: "±5%"
      power_rating: "0.25W"
      temp_coeff: "±100ppm/°C"
      manufacturers: ["Vishay", "Yageo"]
      part_numbers:
        vishay: "CFR-25JB-1K"
      spice_model: "R generic"

  metal_film:
    - id: "res_mf_10k_1/4w"
      name: "Metal Film Resistor 10kΩ 1/4W"
      value: 10000
      unit: "Ω"
      tolerance: "±1%"
      power_rating: "0.25W"
      temp_coeff: "±25ppm/°C"
      manufacturers: ["Vishay", "Yageo"]
      part_numbers:
        vishay: "MFR-25FBF52-10K"

# Passive Components - Capacitors
capacitors:
  ceramic:
    - id: "cap_cer_100n_50v"
      name: "Ceramic Capacitor 100nF 50V"
      value: 100e-9
      unit: "F"
      voltage_rating: "50V"
      tolerance: "±10%"
      dielectric: "X7R"
      manufacturers: ["TDK", "Murata", "Yageo"]
      part_numbers:
        tdk: "FK18X7R1H104K"
      spice_model: "C"
      esr: "5mΩ"
      esl: "0.1nH"

  aluminum_electrolytic:
    - id: "cap_ael_10u_25v"
      name: "Aluminum Electrolytic 10µF 25V"
      value: 10e-6
      unit: "F"
      voltage_rating: "25V"
      tolerance: "±20%"
      temperature_range: "-40°C to 105°C"
      manufacturers: ["Nichicon", "Panasonic"]
      part_numbers:
        nichicon: "UPW1E100MDD1TP"
      spice_model: "C"
      esr: "0.5Ω"

# Semiconductors - Diodes
diodes:
  general_purpose:
    - id: "diode_1n4148"
      name: "1N4148 Silicon Diode"
      voltage_reverse: "100V"
      current_forward: "200mA"
      forward_voltage: "0.7V"
      reverse_recovery: "4ns"
      manufacturers: ["ON Semiconductor", "Fairchild"]
      part_numbers:
        on_semi: "1N4148"
      spice_model: |
        .model 1N4148 D IS=5.84n N=1.94 RS=0.7017 IKF=44.17m XTB=1.5 BV=110 IBV=100u CJO=0.95p VJ=0.75 M=0.33 FC=0.5
      package: "DO-35"
      datasheet_url: "https://..."

  schottky:
    - id: "diode_1n5819"
      name: "1N5819 Schottky Diode"
      voltage_reverse: "40V"
      current_forward: "1A"
      forward_voltage: "0.55V @ 1A"
      reverse_recovery: "0ns"
      manufacturers: ["ON Semiconductor", "Vishay"]
      package: "DO-41"

# Semiconductors - Transistors
transistors:
  bjt:
    - id: "bjt_2n2222"
      name: "2N2222 NPN Transistor"
      type: "NPN"
      max_vceo: "30V"
      max_ic: "800mA"
      beta: "100-200"
      ft: "300MHz"
      manufacturers: ["ON Semiconductor", "Fairchild"]
      package: "TO-39"
      spice_model: |
        .model 2N2222 NPN(IS=23.2P NF=1 VAF=74.03 IKF=0.2847 X ISE=11.07P NE=1.307 BR=0.75 NR=1 VAR=24 IKR=0 ISC=0 NC=2 RB=0.1 IRB=0.1 RBM=0.1 RE=0 RC=1 CJE=25.89P VJE=0.75 MJE=0.25 TF=0.3ns TR=11.07ns EG=1.11)
      datasheet_url: "https://..."

    - id: "bjt_2n3904"
      name: "2N3904 NPN Transistor"
      type: "NPN"
      max_vceo: "40V"
      max_ic: "200mA"
      beta: "100-200"
      ft: "300MHz"
      manufacturers: ["ON Semiconductor", "Fairchild"]
      package: "TO-92"

  fet:
    - id: "fet_2n7000"
      name: "2N7000 N-Channel MOSFET"
      type: "N-Channel"
      vds_max: "20V"
      id_max: "200mA"
      rds_on: "100Ω @ 5V"
      vgs_threshold: "2.1V"
      manufacturers: ["Fairchild", "ON Semiconductor"]
      package: "TO-92"

# ICs - Operational Amplifiers
ics:
  opamp:
    - id: "opamp_ua741"
      name: "µA741 General Purpose Op-Amp"
      pins: 8
      supply_voltage: "±5V to ±18V"
      gain_bandwidth: "1MHz"
      slew_rate: "0.5V/µs"
      output_swing: "±13V"
      manufacturers: ["Texas Instruments", "ON Semiconductor"]
      part_numbers:
        ti: "UA741CP"
      package: "DIP-8"
      spice_model: |
        .subckt uA741 1 2 3 4 5
        * Connections: non-inverting input
        *              | inverting input
        *              | | positive power supply
        *              | | | negative power supply
        *              | | | | output
        *              | | | | |
        * ... full subcircuit definition
        .ends uA741
      datasheet_url: "https://..."

    - id: "opamp_lm358"
      name: "LM358 Dual Op-Amp"
      pins: 8
      supply_voltage: "5V to 32V"
      gain_bandwidth: "1MHz"
      rail_to_rail: false
      manufacturers: ["Texas Instruments", "ON Semiconductor"]

  comparator:
    - id: "comp_lm393"
      name: "LM393 Dual Comparator"
      pins: 8
      supply_voltage: "2V to 36V"
      response_time: "300ns"
      manufacturers: ["Texas Instruments"]

  timer:
    - id: "ic_ne555"
      name: "NE555 Timer IC"
      pins: 8
      supply_voltage: "4.5V to 16V"
      max_frequency: "500kHz"
      manufacturers: ["Texas Instruments", "NXP"]

# Connectors (if used)
connectors:
  standard:
    - id: "conn_usb_micro"
      name: "Micro USB Connector"
      pins: 5
      current_rating: "500mA"
      voltage_rating: "5V"

# SPICE Models (organized by type)
spice_models:
  transistor_models:
    2N2222: |
      .model 2N2222 NPN(IS=23.2P NF=1 VAF=74.03 IKF=0.2847 X ISE=11.07P NE=1.307 BR=0.75 NR=1 VAR=24 IKR=0 ISC=0 NC=2 RB=0.1 IRB=0.1 RBM=0.1 RE=0 RC=1 CJE=25.89P VJE=0.75 MJE=0.25 TF=0.3ns TR=11.07ns EG=1.11)
```

### What to Include for Each Component

```yaml
component:
  id: "unique_identifier"
  name: "Display name"
  value: "Default value (if applicable)"
  unit: "Measurement unit"
  tolerance: "±percentage or range"
  manufacturers: ["Manufacturer 1", "Manufacturer 2"]
  part_numbers:
    manufacturer1: "PN-12345"
    manufacturer2: "PN-67890"
  spice_model: "SPICE model string"
  datasheet_url: "https://link-to-datasheet"
  # Additional specs based on component type
```

---

## 2. MultiSim Component Mappings

### What We Need
Map between MultiSim internal IDs and our ComponentType enum.

### Format (JSON/YAML)

Create `services/core/multisim_component_map.json`:

```json
{
  "mappings": [
    {
      "multisim_id": "com.ni.schematic.part.resistor",
      "multisim_name": "Resistor",
      "our_type": "resistor",
      "our_model": "generic_resistor",
      "parameter_map": {
        "resistance": "R",
        "tolerance": "tolerance"
      }
    },
    {
      "multisim_id": "com.ni.schematic.part.capacitor",
      "multisim_name": "Capacitor",
      "our_type": "capacitor",
      "our_model": "generic_capacitor",
      "parameter_map": {
        "capacitance": "C",
        "voltage_rating": "V_rating"
      }
    },
    {
      "multisim_id": "com.ni.schematic.part.opamp",
      "multisim_name": "Op-Amp",
      "our_type": "op_amp",
      "parameter_map": {
        "model": "MODEL"
      },
      "models": ["uA741", "LM358", "LM741"]
    },
    {
      "multisim_id": "com.ni.schematic.part.voltage_source",
      "multisim_name": "Voltage Source",
      "our_type": "voltage_source",
      "parameter_map": {
        "voltage": "V",
        "dc_offset": "V"
      }
    }
  ]
}
```

### How to Extract
1. Open MultiSim
2. Look at part library properties
3. Note the internal part ID (hover over component)
4. Add mapping to file

---

## 3. Professional SVG Symbols

### What We Need
SVG drawings for each component type following IEEE/IEC standards.

### Example: Resistor Symbol

```svg
<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
  <!-- Resistor symbol (rectangular) -->
  <line x1="10" y1="20" x2="20" y2="20" stroke="black" stroke-width="2"/>
  <rect x="20" y="15" width="30" height="10" stroke="black" fill="none" stroke-width="2"/>
  <line x1="50" y1="20" x2="90" y2="20" stroke="black" stroke-width="2"/>
  <!-- Pins -->
  <circle cx="10" cy="20" r="3" fill="black"/>
  <circle cx="90" cy="20" r="3" fill="black"/>
  <!-- Label -->
  <text x="50" y="35" font-size="10" text-anchor="middle">R</text>
</svg>
```

Store in: `frontend/public/symbols/resistor.svg`

**Symbols needed for:**
- Resistor
- Capacitor
- Inductor
- Diode
- Transistors (NPN, PNP, N-FET, P-FET)
- Op-amp
- Voltage source
- Current source
- Ground
- Switches
- Transformers

---

## 4. Design Guidelines & Best Practices

### What We Need
Document your design guidelines:

```yaml
design_standards:
  preferred_resistor_values:
    e6_series: [10, 15, 22, 33, 47, 68]
    e12_series: [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82]
    e24_series: [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]

  preferred_capacitor_values:
    - value: 10n
      tolerance: "±10%"
      voltage: "50V"
    - value: 100n
      tolerance: "±10%"
      voltage: "50V"
    - value: 1u
      tolerance: "±10%"
      voltage: "25V"

  design_rules:
    - "Always use 0.1µF bypass capacitor near IC power pins"
    - "Keep signal traces away from power traces"
    - "Use at least 2 ground vias per signal via"
    - "Minimum trace width: 10mil (254µm)"
    - "Minimum trace spacing: 10mil (254µm)"

  simulation_defaults:
    transient_duration: "1ms"
    transient_step: "1µs"
    ac_start_freq: "10Hz"
    ac_stop_freq: "1MHz"
    ac_points: "100"
```

---

## 5. Example Circuits for Testing

### What We Need
Real, tested circuits that users can use as examples.

Create `examples/circuits/`:

```
examples/circuits/
├── rc_lowpass_filter.json
├── rc_lowpass_filter.v
├── rc_lowpass_filter.cir
├── active_amplifier.json
├── integrator.json
├── timing_circuit.json
└── power_supply.json
```

**Example Format** (rc_lowpass_filter.json):
```json
{
  "name": "RC Low-Pass Filter",
  "description": "Simple RC low-pass filter (1kHz cutoff)",
  "circuit": {
    "components": [
      {
        "name": "R1",
        "type": "resistor",
        "value": "1k",
        "notes": "Cutoff frequency = 1/(2πRC)"
      },
      {
        "name": "C1",
        "type": "capacitor",
        "value": "100n",
        "notes": "Ceramic or film, 50V rating"
      }
    ],
    "simulation": {
      "type": "ac",
      "start_freq": "10Hz",
      "stop_freq": "100kHz",
      "points": "100"
    }
  }
}
```

---

## 6. Real Waveforms/Measurements

### What We Need
Screenshots or CSV data of real circuit behavior from oscilloscope/multimeter.

**Helpful for:**
- Validating simulation accuracy
- Providing reference waveforms
- Creating realistic visualizations
- Testing measurement components

---

## How to Provide Data

### Option 1: Create Pull Request
1. Fork repository
2. Add YAML files to `services/sve/`
3. Submit PR with documentation

### Option 2: Share Directly
Send as:
- YAML/JSON files (easiest to parse)
- Excel sheets (will convert)
- Screenshots (manual entry)
- Email

### Option 3: Integration
If you have MultiSim:
1. Export component library
2. Share XML/data export
3. We'll create automatic parser

---

## Priority Order

### Phase 1 (Essential)
- [ ] 30 common passive components (resistors, capacitors)
- [ ] 10 common transistors & diodes
- [ ] 5 common ICs (741, 555, 393, LM358, comparators)
- [ ] SPICE models for above

### Phase 2 (Important)
- [ ] MultiSim component mappings
- [ ] SVG symbols for Phase 1 components
- [ ] 5 example circuits
- [ ] Design guidelines

### Phase 3 (Nice to Have)
- [ ] 100+ additional components
- [ ] All standard symbols
- [ ] Real waveform data
- [ ] Advanced design rules

---

## Template Files to Get Started

We can provide template files for you to fill in:
- `component_database_template.yaml` (blank YAML structure)
- `multisim_mapper_template.json` (blank mappings)
- `svge_symbol_template.svg` (blank SVG example)

Just let us know!

---

## Contact & Questions

For any data format questions or clarifications:
- Refer to `CODE_EXAMPLES.md`
- Check `QUICK_REFERENCE.md`
- Review existing component examples

**The more data you provide, the more powerful Synthra becomes!** 🚀
