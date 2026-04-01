# Bidirectional Circuit Design System - Implementation Guide

## Overview

Synthra now has a **complete bidirectional circuit design system** where users can edit circuits either:
1. **Visually** (drag-drop components) OR
2. **Via Code** (Verilog/SPICE)

Both editors stay **automatically synchronized** through a central **Circuit AST (Abstract Syntax Tree)**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CIRCUIT AST                              │
│        (Central, language-agnostic representation)          │
│  - Components with parameters                              │
│  - Nets (electrical connections)                           │
│  - Metadata                                                 │
└─────────────────────────────────────────────────────────────┘
         ↑                                    ↑
         │                                    │
    ┌────┴─────────────────┐    ┌───────────┴────┐
    │                      │    │                │
    │   Verilog Generator  │    │  Verilog Parser│
    │   SPICE Generator    │    │  SPICE Parser  │
    │                      │    │  JSON Parser   │
    └────┬─────────────────┘    └────┬───────────┘
         │                           │
         └──→ CODE EDITORS ←─────────┘
            (Monaco Editor)
            - Verilog
            - SPICE
            - JSON
```

---

## Key Components

### 1. **CircuitAST** (`services/core/circuit_ast.py`)

The central data model representing circuits:

```python
# Core classes
CircuitAST              # Complete circuit definition
├── CircuitComponent    # Individual component (R1, Q1, etc.)
│   ├── ports          # Pin connections (node names)
│   ├── parameters     # Component values (R, C, V, etc.)
│   └── metadata       # Position, rotation, description
├── Net                # Electrical connection (wire)
├── Parameter          # Global or component parameters
└── Port               # Pin definition

# Features
- Export to JSON
- Import from JSON
- Validation
- Change tracking
```

### 2. **Code Generators**

#### VerilogGenerator (`services/core/verilog_generator.py`)
Converts AST → Synthesizable Verilog modules:
```python
circuit = CircuitAST(...)
gen = VerilogGenerator()
verilog_code = gen.generate(circuit)
# Output: Valid Verilog module with proper syntax
```

#### SPICEGenerator (`services/core/spice_generator.py`)
Converts AST → SPICE netlists for analog simulation:
```python
spice = SPICEGenerator()
netlist = spice.generate(circuit, sim_params={
    'type': 'transient',
    'duration': '1m',
    'step': '1u'
})
# Output: ngspice-compatible netlist
```

### 3. **Code Parsers**

#### VerilogParser (`services/core/verilog_parser.py`)
Parses Verilog code → Circuit AST:
```python
parser = VerilogParser()
circuit = parser.parse(verilog_code)
# Extracts: components, connections, parameters
```

#### SPICEParser
Parses SPICE netlists → Circuit AST:
```python
parser = SPICEParser()
circuit = parser.parse(netlist_string)
# Understands SPICE component naming: R, C, L, D, V, I, X, Q, M
```

### 4. **CircuitSync Manager** (`services/core/circuit_sync.py`)

**The heart of bidirectional synchronization**:

```python
sync = CircuitSync(initial_circuit)

# From GUI (visual editor)
sync.on_gui_change({
    'type': 'component_added',
    'component': {...}
})
# → Auto-generates new Verilog/SPICE
# → Notifies code editor to update

# From Code (text editor)
sync.on_code_change(verilog_code, language='verilog')
# → Parses code to AST
# → Updates circuit
# → Notifies GUI to re-render
```

**Features:**
- Real-time change tracking
- Undo/Redo support
- Error handling & validation
- Observable pattern (listeners)
- State management

---

## Frontend Implementation

### Split View Editor (`frontend/src/pages/SplitEditorPage.tsx`)

**Three editing modes:**

```
Visual Only          Code Only          Split View
┌──────────────┐    ┌──────────────┐    ┌────────┬────────┐
│              │    │              │    │        │        │
│  Schematic   │    │  Verilog/    │    │Visual  │ Verilog│
│  Editor      │    │  SPICE/JSON  │    │Editor  │ Editor │
│              │    │  Editor      │    │        │        │
└──────────────┘    └──────────────┘    └────────┴────────┘
```

### Code Editor Component (`frontend/src/components/CodeEditor.tsx`)

Features:
- Syntax highlighting (Verilog, SPICE)
- Real-time error display
- Copy to clipboard
- Auto-formatting
- Line numbers
- Bracket matching

```tsx
<CodeEditor
  language="verilog"
  value={verilogCode}
  onChange={handleCodeChange}
  errors={parseErrors}
  readOnly={false}
/>
```

---

## API Endpoints (Core Service)

### Generation

**POST `/api/generate-code`**
```json
Request:
{
  "circuit_ast": {...},
  "languages": ["verilog", "spice", "json"]
}

Response:
{
  "success": true,
  "code": {
    "verilog": "module ...",
    "spice": "* netlist ...",
    "json": "{...}"
  }
}
```

### Parsing

**POST `/api/parse-code`**
```json
Request:
{
  "code": "module test(...);",
  "language": "verilog"
}

Response:
{
  "success": true,
  "circuit_ast": {...},
  "errors": []
}
```

### Synchronization

**POST `/api/apply-change`** (from GUI)
```json
Request:
{
  "type": "component_added",
  "data": {
    "component": {...}
  }
}

Response:
{
  "success": true,
  "verilog": "...",
  "spice": "..."
}
```

### Validation

**POST `/api/validate-circuit`**
```json
Response:
{
  "success": true,
  "validation": {
    "errors": ["..."],
    "warnings": ["..."],
    "info": ["..."]
  }
}
```

### Export

**POST `/api/export-module`**
```json
Request:
{
  "circuit": {...},
  "module_name": "MyFilter"
}

Response:
{
  "success": true,
  "code": "module MyFilter(...); ..."
}
```

---

## Usage Examples

### Example 1: Create Circuit Visually, Export as Verilog

```typescript
// User places components in GUI
onSchematicChange({
  type: 'component_added',
  component: { name: 'R1', type: 'resistor', value: '1k' }
});

// Auto-generated Verilog:
// module NewCircuit (
//   input wire vcc,
//   output wire out,
//   input wire gnd
// );
//   resistor R1 (.1(vcc), .2(out));
// endmodule
```

### Example 2: Write Verilog, View in GUI

```verilog
module filter (
  input wire in,
  output wire out,
  input wire gnd
);
  resistor R1 (in, out);
  capacitor C1 (out, gnd);
endmodule
```

**Auto-updates GUI:**
- Adds R1 (resistor from in→out)
- Adds C1 (capacitor from out→gnd)
- Creates nets: in, out, gnd

### Example 3: Modify Component, See Code Change

```typescript
// GUI: User changes R1 from 1kΩ to 2.2kΩ
handleComponentModified({
  name: 'R1',
  updates: { parameters: { R: '2.2k' } }
});

// Verilog auto-updates:
// resistor R1 (.1(vcc), .2(out), .R(2.2k));

// SPICE auto-updates:
// R1 vcc out 2.2k
```

---

## Data Flow: Complete Cycle

### GUI → Code (Visual Edit)

```
1. User places "R2" component on canvas
   ↓
2. GUI calls: sync.on_gui_change({type: 'component_added', ...})
   ↓
3. CircuitSync:
   - Adds component to CircuitAST
   - Regenerates Verilog code
   - Regenerates SPICE netlist
   - Notifies code editor listeners
   ↓
4. Code editor updates display (syntax highlighted)
   ↓
5. Status bar shows: "Components: 2" (updated count)
```

### Code → GUI (Text Edit)

```
1. User types new resistor in Verilog editor:
   "resistor R3 (.1(node1), .2(node2));"
   ↓
2. Code editor calls: sync.on_code_change(code, 'verilog')
   ↓
3. CircuitSync:
   - Parses Verilog with VerilogParser
   - Extracts "R3" as new component
   - Merges with existing circuit (preserves positions)
   - Validates against errors
   - Notifies GUI listeners
   ↓
4. Schematic editor updates:
   - Adds R3 to canvas (centered, default position)
   - Draws connections (in→out)
   ↓
5. Other code formats auto-update:
   - SPICE: "R3 in out [value]"
   - JSON: Updated circuit definition
```

---

## Supported Components

### Passive
- Resistor (R)
- Capacitor (C)
- Inductor (L)

### Sources
- Voltage Source (V)
- Current Source (I)

### Semiconductors
- Diode (D)
- BJT Transistor (Q)
- FET Transistor (M)

### ICs
- Op-Amp (X + model)
- Digital IC (X + model)
- Analog IC (X + model)

### Measurement
- Ammeter
- Voltmeter
- Oscilloscope
- Function Generator

---

## Integration with Existing Services

### With Vision Service
When user uploads circuit image:
```
Image → Vision Service → Detected components →
Create CircuitAST → Auto-generate code
```

### With Simulator Service
User runs simulation:
```
CircuitAST → SPICE Generator → Netlist →
Simulator Service → Run ngspice → Waveforms
```

### With Docs Service
User exports documentation:
```
CircuitAST → Code + Schematic + Analysis →
Docs Service → PDF with code, schematics, waveforms
```

---

## Testing CircuitAST

**Test endpoint:** `GET /api/test-ast`

Creates example circuit with R-C filter:
```python
Circuit: RC Filter
├─ R1 (1kΩ): in → out
├─ C1 (1µF): out → gnd
└─ Nets: in, out, gnd

Generated Verilog:
module RC_Filter (...)
  resistor R1 (.1(in), .2(out));
  capacitor C1 (.1(out), .2(gnd));
endmodule

Generated SPICE:
R1 in out 1k
C1 out gnd 1u
```

---

## What Data You Can Provide

To improve the system further, you can provide:

### 1. **Component Definitions** (components.yaml)
```yaml
resistors:
  - id: res_carbon_film_1k
    name: Carbon Film 1kΩ
    tolerance: 5%
    power_rating: 0.25W
    temp_coeff: ±100ppm
    spice_model: "R generic"
    symbol_svg: "..."
```

### 2. **MultiSim Component Mappings**
Map NI MultiSim components to our ComponentType enum:
```python
MULTISIM_MAPPING = {
    'com.ni.schematic.part.resistor': ComponentType.RESISTOR,
    'com.ni.schematic.part.opamp_741': ComponentType.OP_AMP,
    # ...
}
```

### 3. **SPICE Models**
Provide SPICE subcircuit definitions:
```spice
.subckt uA741 1 2 3 4 5
* Connections: non-inverting input
*              | inverting input
*              | | positive power supply
*              | | | negative power supply
*              | | | | output
*              | | | | |
.model 1N4148 D IS=5.84n N=1.94 RS=0.7017 IKF=44.17m XTB=1.5 BV=110 IBV=100u CJO=0.95p VJ=0.75 M=0.33 FC=0.5
```

### 4. **Professional UI Screenshots**
Share MultiSim screenshots showing:
- Component symbols
- Measurement device layouts
- Waveform display formatting

---

## Next Steps

1. **Database Integration** - Store circuits in PostgreSQL
2. **Collaborative Editing** - Multi-user sync via WebSocket
3. **Advanced Components** - Auto-generate behavioral models
4. **Library Management** - Custom component libraries
5. **Constraint-Based Design** - Automatic value optimization

---

## File Summary

| File | Purpose |
|------|---------|
| `circuit_ast.py` | Core data model (AST) |
| `verilog_generator.py` | AST → Verilog |
| `spice_generator.py` | AST → SPICE |
| `verilog_parser.py` | Verilog/SPICE → AST |
| `circuit_sync.py` | Bidirectional sync manager |
| `core_api.py` | FastAPI endpoints |
| `CodeEditor.tsx` | Monaco editor component |
| `SplitEditorPage.tsx` | Split view UI |
| `SplitEditor.css` | Professional styling |

---

## Error Handling

All components handle errors gracefully:

```python
try:
    circuit = parser.parse(code)
except VerilogSyntaxError as e:
    return {
        'success': False,
        'errors': [{
            'line': e.line,
            'column': e.column,
            'message': e.message
        }]
    }
```

Frontend displays errors inline:
```
┌─────────────────────────────┐
│ Error at Line 5, Col 12:    │
│ "Expected ')' but found ';'"│
└─────────────────────────────┘
```

---

## Performance Considerations

- **AST Generation**: O(n) where n = number of components
- **Code Generation**: O(n)
- **Code Parsing**: O(n)
- **Diff-based Merge**: Only updates changed components

For circuits with 1000+ components, consider:
- Lazy loading (viewport-based)
- Pagination in component lists
- Incremental updates

---

**Ready to use! Start the split editor with the new UI and both modes are fully functional.** 🚀
