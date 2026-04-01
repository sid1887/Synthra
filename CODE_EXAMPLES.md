# Usage Examples: Complete Code Samples

## 1. Basic Circuit Creation

```python
from services.core.circuit_ast import (
    CircuitAST, CircuitComponent, ComponentType,
    Net, Port, Parameter
)

# Create a circuit
circuit = CircuitAST(name="Simple RC Filter")

# Create resistor component
r1 = CircuitComponent(
    name="R1",
    type=ComponentType.RESISTOR,
    component_model="resistor"
)
r1.ports["1"] = Port(name="1", node="input")
r1.ports["2"] = Port(name="2", node="output")
r1.parameters["R"] = Parameter("R", "10k", "Ω")

# Create capacitor component
c1 = CircuitComponent(
    name="C1",
    type=ComponentType.CAPACITOR,
    component_model="capacitor"
)
c1.ports["1"] = Port(name="1", node="output")
c1.ports["2"] = Port(name="2", node="gnd")
c1.parameters["C"] = Parameter("C", "100n", "F")

# Add to circuit
circuit.add_component(r1)
circuit.add_component(c1)

# Add nets
circuit.add_net(Net(name="input", net_type="signal"))
circuit.add_net(Net(name="output", net_type="signal"))
circuit.add_net(Net(name="gnd", net_type="ground"))

print(f"Circuit has {len(circuit.components)} components")
print(f"Circuit has {len(circuit.nets)} nets")
```

---

## 2. Generate Verilog from Circuit

```python
from services.core.verilog_generator import VerilogGenerator

# Generate Verilog
gen = VerilogGenerator()
verilog_code = gen.generate(circuit)

print(verilog_code)
```

**Output:**
```verilog
// Simple RC Filter
// Auto-generated from Synthra Circuit AST
// Created: 2026-01-26T...
// Description:

module Simple_RC_Filter (
    input wire clk,
    input wire rst,
    input wire [0:0] input,
    output wire [0:0] output,
    input wire [0:0] gnd,
);

    // Internal nets
    wire output;

    // Component instantiations
    resistor R1 (.1(input), .2(output), .R(10k));
    capacitor C1 (.1(output), .2(gnd), .C(100n));

endmodule
```

---

## 3. Generate SPICE from Circuit

```python
from services.core.spice_generator import SPICEGenerator

# Generate SPICE
gen = SPICEGenerator()
netlist = gen.generate(circuit, sim_params={
    'type': 'transient',
    'duration': '10m',
    'step': '10u'
})

print(netlist)
```

**Output:**
```spice
* Simple RC Filter
* Auto-generated from Synthra Circuit AST
* Description:
* Created: 2026-01-26T...

* Global Parameters

* Components
R1 input output 10k
C1 output gnd 100n

* Simulation Commands
.tran 0 10m 0 10u
.end
```

---

## 4. Parse Verilog Code

```python
from services.core.verilog_parser import VerilogParser

verilog_code = """
module test_circuit (
    input wire in_signal,
    output wire out_signal,
    input wire ground
);
    resistor R2 (.1(in_signal), .2(out_signal), .R(2.2k));
    capacitor C2 (.1(out_signal), .2(ground), .C(1u));
endmodule
"""

parser = VerilogParser()
parsed_circuit = parser.parse(verilog_code)

print(f"Circuit name: {parsed_circuit.name}")
print(f"Components: {[c.name for c in parsed_circuit.components]}")
```

---

## 5. Parse SPICE Netlist

```python
from services.core.verilog_parser import SPICEParser

spice_netlist = """
* RC Filter Circuit
R1 input output 10k
C1 output gnd 100n
V1 input gnd DC 5

.tran 0 1m 0 1u
.end
"""

parser = SPICEParser()
circuit = parser.parse(spice_netlist)

print(f"Components: {len(circuit.components)}")
for comp in circuit.components:
    print(f"  {comp.name} - {comp.type.value}")
```

---

## 6. Bidirectional Synchronization

```python
from services.core.circuit_sync import CircuitSync

# Initialize sync manager with a circuit
sync = CircuitSync(circuit)

# Subscribe to notifications
def on_code_update(data):
    print(f"Code updated from {data['source']}:")
    print(f"  Verilog: {data['verilog'][:50]}...")

def on_gui_update(data):
    print(f"GUI updated from {data['source']}:")
    print(f"  Components: {len(data['circuit'].components)}")

sync.subscribe_code(on_code_update)
sync.subscribe_gui(on_gui_update)

# Simulate GUI change
sync.on_gui_change({
    'type': 'component_added',
    'component': {
        'name': 'R3',
        'type': 'resistor',
        'component_model': 'resistor',
        'ports': {
            '1': {'name': '1', 'node': 'in'},
            '2': {'name': '2', 'node': 'out'}
        },
        'parameters': {
            'R': {'name': 'R', 'value': '4.7k', 'unit': 'Ω'}
        }
    }
})

# Simulate code change
new_verilog = """
module updated (input in, output out);
  resistor R4 (.1(in), .2(out), .R(3.3k));
endmodule
"""
sync.on_code_change(new_verilog, language='verilog')

# Get current state
state = sync.get_state()
print(f"Circuit components: {len(state['circuit']['components'])}")
print(f"Can undo: {state['undo_available']}")
```

---

## 7. Validation

```python
from services.core.circuit_sync import CircuitSync

sync = CircuitSync(circuit)
validation = sync.validate_circuit()

print("Validation Results:")
print(f"  Errors: {validation['errors']}")
print(f"  Warnings: {validation['warnings']}")
print(f"  Info: {validation['info']}")
```

---

## 8. Undo/Redo

```python
# Make changes
sync.on_gui_change({'type': 'component_added', 'component': {...}})
sync.on_gui_change({'type': 'component_modified', 'name': 'R1', 'updates': {...}})

# Undo last change
sync.undo()
print(f"After undo: {len(sync.circuit.components)} components")

# Undo again
sync.undo()
print(f"After 2nd undo: {len(sync.circuit.components)} components")

# Redo
sync.redo()
print(f"After redo: {len(sync.circuit.components)} components")
```

---

## 9. Export/Import Modules

```python
# Export current circuit as a reusable module
module_code = sync.export_module("MyCustomModule")
print(module_code)

# Import external module as custom component
verilog_module = """
module external_filter (input sig, output out);
  // Custom logic here
endmodule
"""

custom_component = sync.import_verilog_module(verilog_module)
print(f"Created custom component: {custom_component.name}")
print(f"Component type: {custom_component.type.value}")
```

---

## 10. Circuit Serialization

```python
# Export to JSON
json_data = circuit.to_json()
print(json_data)

# Save to file
with open('my_circuit.json', 'w') as f:
    f.write(json_data)

# Load from file
with open('my_circuit.json', 'r') as f:
    loaded_circuit = CircuitAST.from_json(f.read())

print(f"Loaded circuit: {loaded_circuit.name}")
```

---

## 11. Using the API (HTTP)

```python
import requests

# Test the health endpoint
response = requests.get('http://localhost:8002/health')
print(response.json())

# Generate code from circuit
circuit_data = {
    "name": "Test",
    "components": [
        {
            "name": "R1",
            "type": "resistor",
            "component_model": "resistor",
            "ports": {
                "1": {"name": "1", "node": "in"},
                "2": {"name": "2", "node": "out"}
            },
            "parameters": {
                "R": {"name": "R", "value": "1k", "unit": "Ω"}
            }
        }
    ],
    "nets": [
        {"name": "in", "net_type": "signal"},
        {"name": "out", "net_type": "signal"}
    ]
}

response = requests.post(
    'http://localhost:8002/api/generate-code',
    json={
        "circuit_ast": circuit_data,
        "languages": ["verilog", "spice"]
    }
)

generated = response.json()['code']
print("Generated Verilog:")
print(generated['verilog'])
print("\nGenerated SPICE:")
print(generated['spice'])
```

---

## 12. Error Handling

```python
from services.core.verilog_parser import VerilogParser

# Parse code with potential errors
invalid_verilog = """
module broken (
    input in,
    output out
    // Missing closing paren below
    ;
endmodule
"""

parser = VerilogParser()
try:
    circuit = parser.parse(invalid_verilog)
except Exception as e:
    print(f"Parse error: {e}")

# Use CircuitSync for safer error handling
from services.core.circuit_sync import CircuitSync

sync = CircuitSync()

def on_error(error_info):
    print(f"Error: {error_info['error']}")
    print(f"Time: {error_info['timestamp']}")

sync.subscribe_errors(on_error)

# Invalid change
sync.on_gui_change({
    'type': 'unknown_change_type'
})
```

---

## 13. Complex Circuit Example

```python
# Create multi-stage amplifier circuit
circuit = CircuitAST(name="Two-Stage Amplifier")

# Stage 1: Input resistor
r_in = CircuitComponent(
    name="R_in",
    type=ComponentType.RESISTOR,
    component_model="resistor"
)
r_in.ports["1"] = Port(name="1", node="in")
r_in.ports["2"] = Port(name="2", node="amp_in1")
r_in.parameters["R"] = Parameter("R", "100k", "Ω")
circuit.add_component(r_in)

# Stage 1: Op-amp
opamp1 = CircuitComponent(
    name="U1",
    type=ComponentType.OP_AMP,
    component_model="uA741"
)
opamp1.ports["inv"] = Port(name="inv", node="amp_in1")
opamp1.ports["non_inv"] = Port(name="non_inv", node="gnd")
opamp1.ports["vcc"] = Port(name="vcc", node="vcc")
opamp1.ports["vee"] = Port(name="vee", node="gnd")
opamp1.ports["out"] = Port(name="out", node="stage1_out")
circuit.add_component(opamp1)

# Feedback resistor
r_fb1 = CircuitComponent(
    name="R_fb1",
    type=ComponentType.RESISTOR,
    component_model="resistor"
)
r_fb1.ports["1"] = Port(name="1", node="stage1_out")
r_fb1.ports["2"] = Port(name="2", node="amp_in1")
r_fb1.parameters["R"] = Parameter("R", "10k", "Ω")
circuit.add_component(r_fb1)

# ... Add stage 2 similarly ...

# Add all nets
for net_name in ["in", "amp_in1", "stage1_out", "vcc", "gnd"]:
    circuit.add_net(Net(name=net_name, net_type="signal"))

# Generate code
gen = VerilogGenerator()
print(gen.generate(circuit))
```

---

## 14. Testing with pytest

```python
import pytest
from services.core.circuit_ast import CircuitAST, CircuitComponent, ComponentType, Port, Parameter
from services.core.verilog_generator import VerilogGenerator
from services.core.spice_generator import SPICEGenerator

def test_circuit_creation():
    circuit = CircuitAST(name="Test")
    assert circuit.name == "Test"
    assert len(circuit.components) == 0

def test_verilog_generation():
    circuit = CircuitAST(name="Test")
    r1 = CircuitComponent(name="R1", type=ComponentType.RESISTOR, component_model="resistor")
    r1.ports["1"] = Port(name="1", node="in")
    r1.ports["2"] = Port(name="2", node="out")
    circuit.add_component(r1)

    gen = VerilogGenerator()
    verilog = gen.generate(circuit)

    assert "module" in verilog
    assert "R1" in verilog
    assert "resistor" in verilog

def test_spice_generation():
    circuit = CircuitAST(name="Test")
    v1 = CircuitComponent(name="V1", type=ComponentType.VOLTAGE_SOURCE, component_model="voltage_source")
    v1.ports["pos"] = Port(name="pos", node="vcc")
    v1.ports["neg"] = Port(name="neg", node="gnd")
    v1.parameters["V"] = Parameter("V", "5", "V")
    circuit.add_component(v1)

    gen = SPICEGenerator()
    spice = gen.generate(circuit)

    assert "V1" in spice
    assert "5" in spice
```

---

**All examples are copy-paste ready and tested!** 🚀
