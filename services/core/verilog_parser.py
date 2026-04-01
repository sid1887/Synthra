"""
Verilog Parser
Parses Verilog code back to Circuit AST for bidirectional sync
"""

from circuit_ast import CircuitAST, CircuitComponent, ComponentType, Port, Parameter, Net
import re
from typing import Dict, List, Tuple, Optional


class VerilogParser:
    """Parse Verilog code and convert to Circuit AST"""

    def __init__(self):
        self.circuit = None
        self.current_line = 0
        self.errors = []

    def parse(self, verilog_code: str, circuit_name: str = "Parsed Circuit") -> CircuitAST:
        """Parse Verilog code and return Circuit AST"""
        self.errors = []
        self.circuit = CircuitAST(name=circuit_name)

        lines = verilog_code.split('\n')

        i = 0
        while i < len(lines):
            line = lines[i].strip()

            # Skip comments and empty lines
            if not line or line.startswith('//') or line.startswith('*'):
                i += 1
                continue

            # Parse module header
            if line.startswith('module '):
                module_info = self._parse_module_header(lines, i)
                if module_info:
                    i = module_info[0]
                    self.circuit.name = module_info[1]['name']
                    # Add ports as nets
                    for port_name, port_type in module_info[1]['ports'].items():
                        net = Net(name=port_name, net_type='signal')
                        self.circuit.add_net(net)

            # Parse instantiations
            elif any(line.startswith(prefix) for prefix in ['R', 'C', 'L', 'D', 'Q', 'M', 'X']):
                comp_info = self._parse_component_instance(line)
                if comp_info:
                    self.circuit.add_component(comp_info)

            # Parse wire declarations
            elif line.startswith('wire '):
                net = self._parse_wire_declaration(line)
                if net:
                    self.circuit.add_net(net)

            i += 1

        return self.circuit

    def _parse_module_header(self, lines: List[str], start_idx: int) -> Optional[Tuple[int, Dict]]:
        """Parse module declaration and port list"""
        current_idx = start_idx
        module_line = lines[current_idx].strip()

        # Extract module name
        match = re.match(r'module\s+(\w+)\s*\(', module_line)
        if not match:
            return None

        module_name = match.group(1)
        ports = {}

        # Collect port lines
        port_lines = []
        in_ports = True

        # Check if module header ends on same line
        if module_line.endswith(');'):
            port_text = module_line[match.end():-2].strip()
            if port_text:
                port_lines.append(port_text)
            in_ports = False
        else:
            port_text = module_line[match.end():].strip()
            if port_text and not port_text.startswith(')'):
                port_lines.append(port_text)

        # Collect continuation lines
        current_idx += 1
        while current_idx < len(lines) and in_ports:
            line = lines[current_idx].strip()
            if line.endswith(');'):
                if not line.startswith(')'):
                    port_lines.append(line[:-2].strip())
                in_ports = False
                break
            elif line and not line.startswith('//'):
                port_lines.append(line)
            current_idx += 1

        # Parse port declarations
        port_text = ' '.join(port_lines)
        ports = self._parse_ports(port_text)

        return (current_idx, {
            'name': module_name,
            'ports': ports
        })

    def _parse_ports(self, port_text: str) -> Dict[str, str]:
        """Parse port declarations"""
        ports = {}

        # Split by comma, but be careful with nested brackets
        port_items = self._split_respecting_brackets(port_text, ',')

        for port_item in port_items:
            port_item = port_item.strip()
            if not port_item:
                continue

            # Extract direction and name
            match = re.match(r'(input|output|inout)(?:\s+wire)?(?:\s+\[[\d-]+:[\d-]+\])?\s+(\w+)', port_item)
            if match:
                direction = match.group(1)
                name = match.group(2)
                ports[name] = direction

        return ports

    def _parse_wire_declaration(self, line: str) -> Optional[Net]:
        """Parse wire declaration"""
        match = re.match(r'wire\s+(?:\[\d+:\d+\])?\s*(\w+)', line)
        if match:
            return Net(name=match.group(1), net_type='signal')
        return None

    def _parse_component_instance(self, line: str) -> Optional[CircuitComponent]:
        """Parse component instantiation"""

        # Try to match common SPICE-style instantiation
        # Format: component_type name (connections and parameters)

        # Handle multiple assignment styles
        patterns = [
            r'(\w+)\s+(\w+)\s+\(([^)]+)\)',  # Normal: type name (ports)
            r'(\w+)\s+(\w+)\s+([^;]+);',      # Without parens
        ]

        for pattern in patterns:
            match = re.match(pattern, line)
            if match:
                component_type = match.group(1)
                component_name = match.group(2)
                connections = match.group(3)

                # Determine component type from first character
                comp_type = self._infer_component_type(component_type, component_name)

                # Parse connections
                ports, params = self._parse_connections(connections)

                comp = CircuitComponent(
                    name=component_name,
                    type=comp_type,
                    component_model=component_type
                )

                # Add ports
                for port_name, node in ports.items():
                    comp.ports[port_name] = Port(name=port_name, node=node)

                # Add parameters
                for param_name, param_value in params.items():
                    comp.parameters[param_name] = Parameter(
                        name=param_name,
                        value=param_value
                    )

                return comp

        return None

    def _infer_component_type(self, type_str: str, name: str) -> ComponentType:
        """Infer component type from identifier"""

        # SPICE naming convention: R=resistor, C=capacitor, L=inductor, etc.
        first_char = name[0].upper() if name else type_str[0].upper()

        type_map = {
            'R': ComponentType.RESISTOR,
            'C': ComponentType.CAPACITOR,
            'L': ComponentType.INDUCTOR,
            'D': ComponentType.DIODE,
            'Q': ComponentType.TRANSISTOR_BJT,
            'M': ComponentType.TRANSISTOR_FET,
            'V': ComponentType.VOLTAGE_SOURCE,
            'I': ComponentType.CURRENT_SOURCE,
            'X': ComponentType.IC_ANALOG,  # Subcircuit
        }

        return type_map.get(first_char, ComponentType.IC_DIGITAL)

    def _parse_connections(self, connection_str: str) -> Tuple[Dict[str, str], Dict[str, str]]:
        """Parse port connections and parameters"""
        ports = {}
        params = {}

        # Split connections
        items = self._split_respecting_brackets(connection_str, ',')

        for i, item in enumerate(items):
            item = item.strip()

            # Check if it's a named connection (.name(value))
            if '.' in item:
                match = re.match(r'\.(\w+)\s*\(\s*([^)]+)\s*\)', item)
                if match:
                    conn_name = match.group(1)
                    conn_value = match.group(2).strip()

                    # Is it a port or parameter?
                    if conn_name.isupper() or conn_name in ['anode', 'cathode', 'gate', 'drain', 'source']:
                        ports[conn_name] = conn_value
                    else:
                        params[conn_name] = conn_value
            else:
                # Positional argument - assume it's a port
                ports[f'port{i}'] = item

        return ports, params

    @staticmethod
    def _split_respecting_brackets(text: str, delimiter: str = ',') -> List[str]:
        """Split text by delimiter, respecting nested brackets"""
        parts = []
        current = []
        bracket_depth = 0

        for char in text:
            if char in '([{':
                bracket_depth += 1
                current.append(char)
            elif char in ')]}':
                bracket_depth -= 1
                current.append(char)
            elif char == delimiter and bracket_depth == 0:
                parts.append(''.join(current))
                current = []
            else:
                current.append(char)

        if current:
            parts.append(''.join(current))

        return parts


class SPICEParser:
    """Parse SPICE netlists to Circuit AST"""

    def parse(self, spice_code: str, circuit_name: str = "Parsed Circuit") -> CircuitAST:
        """Parse SPICE netlist and return Circuit AST"""

        circuit = CircuitAST(name=circuit_name)

        lines = spice_code.split('\n')

        for line in lines:
            line = line.strip()

            # Skip comments and empty lines
            if not line or line.startswith('*') or line.startswith('.'):
                continue

            # Parse component line
            comp = self._parse_spice_line(line)
            if comp:
                circuit.add_component(comp)

        return circuit

    def _parse_spice_line(self, line: str) -> Optional[CircuitComponent]:
        """Parse single SPICE component line"""

        parts = line.split()
        if not parts:
            return None

        comp_id = parts[0]

        # Determine component type from first character
        first_char = comp_id[0].upper()

        type_map = {
            'R': ComponentType.RESISTOR,
            'C': ComponentType.CAPACITOR,
            'L': ComponentType.INDUCTOR,
            'D': ComponentType.DIODE,
            'Q': ComponentType.TRANSISTOR_BJT,
            'M': ComponentType.TRANSISTOR_FET,
            'V': ComponentType.VOLTAGE_SOURCE,
            'I': ComponentType.CURRENT_SOURCE,
            'X': ComponentType.IC_ANALOG,
        }

        comp_type = type_map.get(first_char, ComponentType.IC_DIGITAL)

        # Parse based on component type
        if first_char == 'R':
            return self._parse_spice_resistor(comp_id, parts[1:])
        elif first_char == 'C':
            return self._parse_spice_capacitor(comp_id, parts[1:])
        elif first_char == 'L':
            return self._parse_spice_inductor(comp_id, parts[1:])
        elif first_char == 'V':
            return self._parse_spice_voltage(comp_id, parts[1:])
        elif first_char == 'I':
            return self._parse_spice_current(comp_id, parts[1:])
        else:
            # Generic component
            comp = CircuitComponent(
                name=comp_id,
                type=comp_type,
                component_model=parts[-1] if len(parts) > 2 else "generic"
            )

            # Add ports
            if len(parts) > 2:
                for i, node in enumerate(parts[1:-1]):
                    comp.ports[f'port{i}'] = Port(name=f'port{i}', node=node)

            return comp

    def _parse_spice_resistor(self, comp_id: str, parts: List[str]) -> CircuitComponent:
        """Parse SPICE resistor"""
        comp = CircuitComponent(
            name=comp_id,
            type=ComponentType.RESISTOR,
            component_model='resistor'
        )

        if len(parts) >= 2:
            comp.ports['1'] = Port(name='1', node=parts[0])
            comp.ports['2'] = Port(name='2', node=parts[1])

        if len(parts) >= 3:
            comp.parameters['R'] = Parameter('R', parts[2], 'Ω')

        return comp

    def _parse_spice_capacitor(self, comp_id: str, parts: List[str]) -> CircuitComponent:
        """Parse SPICE capacitor"""
        comp = CircuitComponent(
            name=comp_id,
            type=ComponentType.CAPACITOR,
            component_model='capacitor'
        )

        if len(parts) >= 2:
            comp.ports['1'] = Port(name='1', node=parts[0])
            comp.ports['2'] = Port(name='2', node=parts[1])

        if len(parts) >= 3:
            comp.parameters['C'] = Parameter('C', parts[2], 'F')

        return comp

    def _parse_spice_inductor(self, comp_id: str, parts: List[str]) -> CircuitComponent:
        """Parse SPICE inductor"""
        comp = CircuitComponent(
            name=comp_id,
            type=ComponentType.INDUCTOR,
            component_model='inductor'
        )

        if len(parts) >= 2:
            comp.ports['1'] = Port(name='1', node=parts[0])
            comp.ports['2'] = Port(name='2', node=parts[1])

        if len(parts) >= 3:
            comp.parameters['L'] = Parameter('L', parts[2], 'H')

        return comp

    def _parse_spice_voltage(self, comp_id: str, parts: List[str]) -> CircuitComponent:
        """Parse SPICE voltage source"""
        comp = CircuitComponent(
            name=comp_id,
            type=ComponentType.VOLTAGE_SOURCE,
            component_model='voltage_source'
        )

        if len(parts) >= 2:
            comp.ports['pos'] = Port(name='pos', node=parts[0])
            comp.ports['neg'] = Port(name='neg', node=parts[1])

        # Find DC value
        if len(parts) >= 4 and parts[2].upper() == 'DC':
            comp.parameters['V'] = Parameter('V', parts[3], 'V')
        elif len(parts) >= 3:
            comp.parameters['V'] = Parameter('V', parts[2], 'V')

        return comp

    def _parse_spice_current(self, comp_id: str, parts: List[str]) -> CircuitComponent:
        """Parse SPICE current source"""
        comp = CircuitComponent(
            name=comp_id,
            type=ComponentType.CURRENT_SOURCE,
            component_model='current_source'
        )

        if len(parts) >= 2:
            comp.ports['pos'] = Port(name='pos', node=parts[0])
            comp.ports['neg'] = Port(name='neg', node=parts[1])

        # Find DC value
        if len(parts) >= 4 and parts[2].upper() == 'DC':
            comp.parameters['I'] = Parameter('I', parts[3], 'A')
        elif len(parts) >= 3:
            comp.parameters['I'] = Parameter('I', parts[2], 'A')

        return comp
