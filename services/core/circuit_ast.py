"""
Circuit AST (Abstract Syntax Tree)
Core data model representing a circuit independent of GUI or code representation
Enables bidirectional sync between visual editor and HDL code
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
from enum import Enum
import uuid
from datetime import datetime
import json


class ComponentType(Enum):
    """All supported component types"""
    # Passive Components
    RESISTOR = "resistor"
    CAPACITOR = "capacitor"
    INDUCTOR = "inductor"

    # Sources
    VOLTAGE_SOURCE = "voltage_source"
    CURRENT_SOURCE = "current_source"

    # Semiconductors
    TRANSISTOR_BJT = "transistor_bjt"
    TRANSISTOR_FET = "transistor_fet"
    DIODE = "diode"
    THYRISTOR = "thyristor"

    # ICs
    OP_AMP = "op_amp"
    IC_DIGITAL = "ic_digital"
    IC_ANALOG = "ic_analog"

    # Measurement
    AMMETER = "ammeter"
    VOLTMETER = "voltmeter"
    OHMMETER = "ohmmeter"
    OSCILLOSCOPE = "oscilloscope"
    FUNCTION_GEN = "function_generator"

    # Other
    SWITCH = "switch"
    CUSTOM_HDL = "custom_hdl"


@dataclass
class Port:
    """Component port/pin"""
    name: str
    node: str = ""  # Connected net name
    direction: str = "inout"  # in, out, inout
    pin_number: Optional[int] = None

    def to_dict(self):
        return asdict(self)


@dataclass
class Parameter:
    """Component parameter (value, unit, etc.)"""
    name: str
    value: str
    unit: str = ""
    datatype: str = "string"  # string, float, int, enum
    range_min: Optional[float] = None
    range_max: Optional[float] = None

    def to_dict(self):
        return asdict(self)


@dataclass
class CircuitComponent:
    """Single component instance in circuit"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""  # e.g., "R1", "U1"
    type: ComponentType = ComponentType.RESISTOR
    component_model: str = ""  # e.g., "resistor_1k", "op_amp_741"

    # Electrical connectivity
    ports: Dict[str, Port] = field(default_factory=dict)

    # Component parameters
    parameters: Dict[str, Parameter] = field(default_factory=dict)

    # Visual representation (for GUI)
    position: tuple = (0, 0)  # (x, y)
    rotation: int = 0  # 0, 90, 180, 270

    # Custom HDL definition (if type == CUSTOM_HDL)
    hdl_definition: Optional[str] = None

    # Metadata
    description: str = ""
    tags: List[str] = field(default_factory=list)

    def to_dict(self):
        data = asdict(self)
        data['type'] = self.type.value
        data['ports'] = {k: v.to_dict() for k, v in self.ports.items()}
        data['parameters'] = {k: v.to_dict() for k, v in self.parameters.items()}
        return data

    def to_spice_line(self) -> str:
        """Generate SPICE netlist line for this component"""
        if self.type == ComponentType.RESISTOR:
            r_value = self._format_spice_value(self.parameters.get('R', Parameter('R', '1000', 'Ω')).value)
            ports = list(self.ports.keys())
            return f"{self.name} {self.ports[ports[0]].node} {self.ports[ports[1]].node} {r_value}"

        elif self.type == ComponentType.CAPACITOR:
            c_value = self._format_spice_value(self.parameters.get('C', Parameter('C', '1u', 'F')).value)
            ports = list(self.ports.keys())
            return f"{self.name} {self.ports[ports[0]].node} {self.ports[ports[1]].node} {c_value}"

        elif self.type == ComponentType.VOLTAGE_SOURCE:
            v_value = self.parameters.get('V', Parameter('V', '5', 'V')).value
            ports = list(self.ports.keys())
            return f"{self.name} {self.ports[ports[0]].node} {self.ports[ports[1]].node} DC {v_value}"

        else:
            # Generic line
            port_nodes = " ".join(p.node for p in self.ports.values())
            params = " ".join(f"{p.name}={p.value}" for p in self.parameters.values())
            return f"{self.name} {port_nodes} {self.component_model} {params}".strip()

    @staticmethod
    def _format_spice_value(value: str) -> str:
        """Convert value to SPICE format (e.g., "1k" -> "1k", "1000" -> "1k")"""
        try:
            # Handle suffixes
            if 'k' in value.lower():
                return value
            if 'm' in value.lower():
                return value
            if 'u' in value.lower():
                return value
            if 'n' in value.lower():
                return value
            if 'p' in value.lower():
                return value
            # Convert numeric to kilo if large
            num = float(value.replace('Ω', '').replace('V', '').replace('A', '').strip())
            if num >= 1000:
                return f"{num/1000}k"
            return value
        except:
            return value

    def to_verilog_instance(self) -> str:
        """Generate Verilog instantiation"""
        if self.hdl_definition:
            return self.hdl_definition

        # Generate port connections
        port_connections = []
        for port_name, port in self.ports.items():
            port_connections.append(f".{port_name}({port.node})")

        # Generate parameter overrides
        param_overrides = []
        for param_name, param in self.parameters.items():
            param_overrides.append(f".{param_name}({param.value})")

        all_connections = port_connections + param_overrides
        return f"{self.component_model} {self.name} ({', '.join(all_connections)});"


@dataclass
class Net:
    """Electrical connection (wire)"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""  # e.g., "gnd", "vcc", "signal_1"
    nodes: List[tuple] = field(default_factory=list)  # Visual points for GUI rendering
    net_type: str = "signal"  # signal, power, ground
    voltage_constraint: Optional[float] = None  # Debugging annotation

    def to_dict(self):
        return asdict(self)


@dataclass
class CircuitAST:
    """Complete circuit representation - the source of truth"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Untitled Circuit"
    description: str = ""

    # Circuit elements
    components: List[CircuitComponent] = field(default_factory=list)
    nets: List[Net] = field(default_factory=list)

    # Global parameters
    parameters: Dict[str, Parameter] = field(default_factory=dict)

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    version: int = 1
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    modified_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'components': [c.to_dict() for c in self.components],
            'nets': [n.to_dict() for n in self.nets],
            'parameters': {k: v.to_dict() for k, v in self.parameters.items()},
            'metadata': self.metadata,
            'version': self.version,
            'created_at': self.created_at,
            'modified_at': self.modified_at
        }
        return data

    def to_json(self) -> str:
        """Export circuit as JSON"""
        return json.dumps(self.to_dict(), indent=2)

    @staticmethod
    def from_dict(data: Dict) -> 'CircuitAST':
        """Create CircuitAST from dictionary"""
        circuit = CircuitAST(
            id=data.get('id', str(uuid.uuid4())),
            name=data.get('name', 'Untitled'),
            description=data.get('description', ''),
            version=data.get('version', 1),
            created_at=data.get('created_at', datetime.now().isoformat()),
            modified_at=data.get('modified_at', datetime.now().isoformat())
        )

        # Add components
        for comp_data in data.get('components', []):
            comp = CircuitComponent(
                id=comp_data.get('id', str(uuid.uuid4())),
                name=comp_data.get('name', ''),
                type=ComponentType(comp_data.get('type', 'resistor')),
                component_model=comp_data.get('component_model', ''),
                position=tuple(comp_data.get('position', [0, 0])),
                rotation=comp_data.get('rotation', 0),
                hdl_definition=comp_data.get('hdl_definition')
            )

            # Add ports
            for port_name, port_data in comp_data.get('ports', {}).items():
                comp.ports[port_name] = Port(
                    name=port_data.get('name', port_name),
                    node=port_data.get('node', ''),
                    direction=port_data.get('direction', 'inout'),
                    pin_number=port_data.get('pin_number')
                )

            # Add parameters
            for param_name, param_data in comp_data.get('parameters', {}).items():
                comp.parameters[param_name] = Parameter(
                    name=param_data.get('name', param_name),
                    value=param_data.get('value', ''),
                    unit=param_data.get('unit', ''),
                    datatype=param_data.get('datatype', 'string'),
                    range_min=param_data.get('range_min'),
                    range_max=param_data.get('range_max')
                )

            circuit.components.append(comp)

        # Add nets
        for net_data in data.get('nets', []):
            net = Net(
                id=net_data.get('id', str(uuid.uuid4())),
                name=net_data.get('name', ''),
                nodes=net_data.get('nodes', []),
                net_type=net_data.get('net_type', 'signal'),
                voltage_constraint=net_data.get('voltage_constraint')
            )
            circuit.nets.append(net)

        return circuit

    @staticmethod
    def from_json(json_str: str) -> 'CircuitAST':
        """Import circuit from JSON"""
        data = json.loads(json_str)
        return CircuitAST.from_dict(data)

    def get_component(self, name: str) -> Optional[CircuitComponent]:
        """Find component by name"""
        return next((c for c in self.components if c.name == name), None)

    def get_net(self, name: str) -> Optional[Net]:
        """Find net by name"""
        return next((n for n in self.nets if n.name == name), None)

    def get_net_by_node(self, node: str) -> Optional[Net]:
        """Find net by node connection point"""
        return next((n for n in self.nets if node in [p.node for p in self._get_all_ports()]), None)

    def _get_all_ports(self) -> List[Port]:
        """Get all ports in circuit"""
        all_ports = []
        for comp in self.components:
            all_ports.extend(comp.ports.values())
        return all_ports

    def collect_nets(self) -> Dict[str, List[str]]:
        """Collect all nets and their connections"""
        nets = {}
        for net in self.nets:
            nets[net.name] = []

        # Add connections from component ports
        for comp in self.components:
            for port_name, port in comp.ports.items():
                if port.node:
                    if port.node not in nets:
                        nets[port.node] = []
                    nets[port.node].append(f"{comp.name}.{port_name}")

        return nets

    def add_component(self, comp: CircuitComponent):
        """Add component to circuit"""
        self.components.append(comp)
        self.modified_at = datetime.now().isoformat()

    def add_net(self, net: Net):
        """Add net to circuit"""
        self.nets.append(net)
        self.modified_at = datetime.now().isoformat()

    def remove_component(self, name: str):
        """Remove component by name"""
        self.components = [c for c in self.components if c.name != name]
        self.modified_at = datetime.now().isoformat()

    def remove_net(self, name: str):
        """Remove net by name"""
        self.nets = [n for n in self.nets if n.name != name]
        self.modified_at = datetime.now().isoformat()
