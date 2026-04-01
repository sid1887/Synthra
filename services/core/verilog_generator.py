"""
Verilog HDL Generator
Converts Circuit AST to synthesizable Verilog modules
"""

from circuit_ast import CircuitAST, CircuitComponent, ComponentType, Port
from typing import Dict, List, Set, Tuple
import re


class VerilogGenerator:
    """Convert Circuit AST to Verilog HDL"""

    def __init__(self):
        self.indent = "    "
        self.generated_modules = set()

    def generate(self, circuit: CircuitAST) -> str:
        """Generate complete Verilog module from circuit AST"""

        # Collect all nets and their connections
        nets = circuit.collect_nets()

        # Identify primary ports (inputs, outputs, power)
        primary_ports = self._identify_primary_ports(circuit, nets)

        # Generate header
        lines = [
            f"// {circuit.name}",
            f"// Auto-generated from Synthra Circuit AST",
            f"// Created: {circuit.created_at}",
            f"// Description: {circuit.description}",
            ""
        ]

        # Generate module declaration
        lines.append(self._generate_module_header(circuit, primary_ports))

        # Generate internal nets
        lines.append("")
        lines.append(self.indent + "// Internal nets")
        for net_name in nets:
            if net_name not in ['gnd', 'ground', 'vcc', 'vdd', 'vss'] and \
               not any(net_name.startswith(prefix) for prefix in ['in_', 'out_']):
                lines.append(f"{self.indent}wire {net_name};")

        # Generate component instantiations
        lines.append("")
        lines.append(self.indent + "// Component instantiations")
        for comp in circuit.components:
            if comp.type == ComponentType.CUSTOM_HDL:
                lines.append(f"{self.indent}{comp.hdl_definition}")
            else:
                lines.append(self.indent + self._generate_component_instance(comp))

        # Generate behavioral logic (for non-basic components)
        behavioral = self._generate_behavioral_logic(circuit)
        if behavioral:
            lines.append("")
            lines.append(self.indent + "// Behavioral logic")
            lines.extend([self.indent + line for line in behavioral.split('\n') if line])

        # Generate end statement
        lines.append("")
        lines.append("endmodule")

        return "\n".join(lines)

    def _identify_primary_ports(self, circuit: CircuitAST, nets: Dict) -> Dict[str, str]:
        """Identify which nets are primary I/O ports"""
        primary_ports = {}

        # Nets starting with 'in_' or 'out_' are ports
        for net_name in nets:
            if net_name.startswith('in_'):
                primary_ports[net_name] = 'input'
            elif net_name.startswith('out_'):
                primary_ports[net_name] = 'output'
            elif net_name in ['vcc', 'vdd', '5v']:
                primary_ports[net_name] = 'input'
            elif net_name in ['gnd', 'ground']:
                primary_ports[net_name] = 'input'

        # Also check source components
        for comp in circuit.components:
            if comp.type == ComponentType.VOLTAGE_SOURCE:
                for port_name, port in comp.ports.items():
                    if port.node and port.node not in primary_ports:
                        primary_ports[port.node] = 'input'

        return primary_ports

    def _generate_module_header(self, circuit: CircuitAST, ports: Dict[str, str]) -> str:
        """Generate module declaration with ports"""
        lines = [f"module {self._sanitize_name(circuit.name)} ("]

        # Add clock and reset if any sequential components
        has_sequential = any(comp.type in [ComponentType.IC_DIGITAL]
                           for comp in circuit.components)

        port_lines = []
        if has_sequential:
            port_lines.append("input wire clk")
            port_lines.append("input wire rst")

        # Add primary ports
        for net_name, direction in ports.items():
            port_lines.append(f"{direction} wire [{self._infer_width(net_name)}-1:0] {net_name}")

        # Join port declarations
        for i, port in enumerate(port_lines):
            suffix = "," if i < len(port_lines) - 1 else ""
            lines.append(f"{self.indent}{port}{suffix}")

        lines.append(");")
        return "\n".join(lines)

    def _generate_component_instance(self, comp: CircuitComponent) -> str:
        """Generate component instantiation"""

        # Generate port connections
        port_connections = []
        for port_name, port in comp.ports.items():
            port_connections.append(f".{port_name}({port.node})")

        # Generate parameter overrides
        param_overrides = []
        for param_name, param in comp.parameters.items():
            # Convert parameter value to safe Verilog syntax
            value = self._format_verilog_value(param.value)
            param_overrides.append(f".{param_name}({value})")

        all_connections = port_connections + param_overrides

        # Format instantiation
        if len(all_connections) <= 2:
            return f"{comp.component_model} {comp.name} ({', '.join(all_connections)});"
        else:
            lines = [f"{comp.component_model} {comp.name} ("]
            for i, conn in enumerate(all_connections):
                suffix = "," if i < len(all_connections) - 1 else ""
                lines.append(f"{self.indent}{self.indent}{conn}{suffix}")
            lines.append(f"{self.indent});")
            return "\n".join(lines)

    def _generate_behavioral_logic(self, circuit: CircuitAST) -> str:
        """Generate behavioral logic for complex components"""
        lines = []

        # Add logic for measuring components
        for comp in circuit.components:
            if comp.type == ComponentType.OSCILLOSCOPE:
                lines.append(f"// Oscilloscope {comp.name} measurement")
                lines.append(f"always @(posedge clk) begin")
                lines.append(f"{self.indent}// Capture waveform data")
                lines.append(f"end")

        return "\n".join(lines)

    @staticmethod
    def _sanitize_name(name: str) -> str:
        """Convert name to valid Verilog identifier"""
        # Remove spaces and special chars
        name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
        # Ensure starts with letter or underscore
        if name[0].isdigit():
            name = '_' + name
        return name

    @staticmethod
    def _format_verilog_value(value: str) -> str:
        """Format value for Verilog code"""
        # Handle numeric values
        try:
            float(value)
            return f"{value}"
        except:
            pass

        # Handle strings
        if value.startswith('"') and value.endswith('"'):
            return value

        # Handle suffixes (k, m, u, n, p)
        if any(value.lower().endswith(suffix) for suffix in ['k', 'm', 'u', 'n', 'p']):
            return f'"{value}"'

        return f'"{value}"'

    @staticmethod
    def _infer_width(net_name: str) -> int:
        """Infer bus width from net name"""
        # Check if name contains width hint
        match = re.search(r'(\d+)', net_name)
        if match:
            width = int(match.group(1))
            return max(1, width)
        return 1


class VerilogModuleBuilder:
    """Helper class for building custom Verilog modules"""

    def __init__(self, name: str):
        self.name = name
        self.ports = {}
        self.internals = []
        self.logic = []

    def add_input(self, name: str, width: int = 1):
        self.ports[name] = ('input', width)
        return self

    def add_output(self, name: str, width: int = 1):
        self.ports[name] = ('output', width)
        return self

    def add_internal_wire(self, name: str, width: int = 1):
        self.internals.append((name, width))
        return self

    def add_logic(self, code: str):
        self.logic.append(code)
        return self

    def build(self) -> str:
        """Generate Verilog module code"""
        lines = [f"module {self.name} ("]

        # Ports
        port_items = []
        for name, (direction, width) in self.ports.items():
            if width > 1:
                port_items.append(f"{direction} wire [{width-1}:0] {name}")
            else:
                port_items.append(f"{direction} wire {name}")

        for i, port in enumerate(port_items):
            suffix = "," if i < len(port_items) - 1 else ""
            lines.append(f"    {port}{suffix}")

        lines.append(");")

        # Internal wires
        if self.internals:
            lines.append("")
            for name, width in self.internals:
                if width > 1:
                    lines.append(f"    wire [{width-1}:0] {name};")
                else:
                    lines.append(f"    wire {name};")

        # Logic
        if self.logic:
            lines.append("")
            lines.extend(self.logic)

        lines.append("")
        lines.append("endmodule")

        return "\n".join(lines)
