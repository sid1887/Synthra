"""
SPICE Netlist Generator
Converts Circuit AST to SPICE netlist for analog simulation with ngspice
"""

from circuit_ast import CircuitAST, CircuitComponent, ComponentType, Parameter
from typing import List, Dict, Optional
import re


class SPICEGenerator:
    """Convert Circuit AST to SPICE netlist"""

    def __init__(self):
        self.circuit_count = 0

    def generate(self, circuit: CircuitAST, sim_params: Optional[Dict] = None) -> str:
        """Generate complete SPICE netlist from circuit AST"""

        # Default simulation parameters
        if not sim_params:
            sim_params = {
                'type': 'transient',
                'duration': '1m',
                'step': '1u'
            }

        lines = [
            f"* {circuit.name}",
            f"* Auto-generated from Synthra Circuit AST",
            f"* Description: {circuit.description}",
            f"* Created: {circuit.created_at}",
            ""
        ]

        # Add circuit parameters as SPICE parameters
        if circuit.parameters:
            lines.append("* Global Parameters")
            for param_name, param in circuit.parameters.items():
                value = self._format_spice_value(param.value)
                lines.append(f".param {param_name}={value}")
            lines.append("")

        # Add component lines
        lines.append("* Components")
        for comp in circuit.components:
            spice_line = self._generate_component_line(comp)
            if spice_line:
                lines.append(spice_line)

        # Add simulation commands
        lines.append("")
        lines.append("* Simulation Commands")
        lines.extend(self._generate_simulation_commands(sim_params))

        # End netlist
        lines.append(".end")

        return "\n".join(lines)

    def _generate_component_line(self, comp: CircuitComponent) -> Optional[str]:
        """Generate SPICE line for a component"""

        if comp.type == ComponentType.RESISTOR:
            return self._generate_resistor(comp)

        elif comp.type == ComponentType.CAPACITOR:
            return self._generate_capacitor(comp)

        elif comp.type == ComponentType.INDUCTOR:
            return self._generate_inductor(comp)

        elif comp.type == ComponentType.VOLTAGE_SOURCE:
            return self._generate_voltage_source(comp)

        elif comp.type == ComponentType.CURRENT_SOURCE:
            return self._generate_current_source(comp)

        elif comp.type == ComponentType.DIODE:
            return self._generate_diode(comp)

        elif comp.type == ComponentType.TRANSISTOR_BJT:
            return self._generate_transistor_bjt(comp)

        elif comp.type == ComponentType.TRANSISTOR_FET:
            return self._generate_transistor_fet(comp)

        elif comp.type == ComponentType.OP_AMP:
            return self._generate_op_amp(comp)

        else:
            # Generic component
            return self._generate_generic_component(comp)

    def _generate_resistor(self, comp: CircuitComponent) -> str:
        """Generate SPICE resistor line"""
        ports = list(comp.ports.items())
        node1 = ports[0][1].node if len(ports) > 0 else "0"
        node2 = ports[1][1].node if len(ports) > 1 else "0"

        r_value = self._format_spice_value(
            comp.parameters.get('R', comp.parameters.get('resistance', Parameter('R', '1k', 'Ω'))).value
        )

        temp_coeff = ""
        if 'TC1' in comp.parameters and 'TC2' in comp.parameters:
            tc1 = comp.parameters['TC1'].value
            tc2 = comp.parameters['TC2'].value
            temp_coeff = f" TC1={tc1} TC2={tc2}"

        return f"R{comp.name} {node1} {node2} {r_value}{temp_coeff}"

    def _generate_capacitor(self, comp: CircuitComponent) -> str:
        """Generate SPICE capacitor line"""
        ports = list(comp.ports.items())
        node1 = ports[0][1].node if len(ports) > 0 else "0"
        node2 = ports[1][1].node if len(ports) > 1 else "0"

        c_value = self._format_spice_value(
            comp.parameters.get('C', comp.parameters.get('capacitance', Parameter('C', '1u', 'F'))).value
        )

        ic = ""
        if 'IC' in comp.parameters:
            ic_val = comp.parameters['IC'].value
            ic = f" IC={ic_val}"

        return f"C{comp.name} {node1} {node2} {c_value}{ic}"

    def _generate_inductor(self, comp: CircuitComponent) -> str:
        """Generate SPICE inductor line"""
        ports = list(comp.ports.items())
        node1 = ports[0][1].node if len(ports) > 0 else "0"
        node2 = ports[1][1].node if len(ports) > 1 else "0"

        l_value = self._format_spice_value(
            comp.parameters.get('L', comp.parameters.get('inductance', Parameter('L', '1u', 'H'))).value
        )

        ic = ""
        if 'IC' in comp.parameters:
            ic_val = comp.parameters['IC'].value
            ic = f" IC={ic_val}"

        return f"L{comp.name} {node1} {node2} {l_value}{ic}"

    def _generate_voltage_source(self, comp: CircuitComponent) -> str:
        """Generate SPICE voltage source line"""
        ports = list(comp.ports.items())
        pos_node = ports[0][1].node if len(ports) > 0 else "0"
        neg_node = ports[1][1].node if len(ports) > 1 else "0"

        voltage = comp.parameters.get('V', Parameter('V', '5', 'V')).value
        v_value = self._format_spice_value(voltage)

        # Check for AC specification
        ac_mag = comp.parameters.get('AC_MAG', None)
        ac_phase = comp.parameters.get('AC_PHASE', None)

        ac_spec = ""
        if ac_mag:
            ac_phase_val = ac_phase.value if ac_phase else "0"
            ac_spec = f" AC {ac_mag.value} {ac_phase_val}"

        return f"V{comp.name} {pos_node} {neg_node} DC {v_value}{ac_spec}"

    def _generate_current_source(self, comp: CircuitComponent) -> str:
        """Generate SPICE current source line"""
        ports = list(comp.ports.items())
        pos_node = ports[0][1].node if len(ports) > 0 else "0"
        neg_node = ports[1][1].node if len(ports) > 1 else "0"

        current = comp.parameters.get('I', Parameter('I', '1m', 'A')).value
        i_value = self._format_spice_value(current)

        return f"I{comp.name} {pos_node} {neg_node} DC {i_value}"

    def _generate_diode(self, comp: CircuitComponent) -> str:
        """Generate SPICE diode line"""
        ports = list(comp.ports.items())
        anode = ports[0][1].node if len(ports) > 0 else "0"
        cathode = ports[1][1].node if len(ports) > 1 else "0"

        model = comp.parameters.get('MODEL', Parameter('MODEL', 'D1N4148', '')).value

        return f"D{comp.name} {anode} {cathode} {model}"

    def _generate_transistor_bjt(self, comp: CircuitComponent) -> str:
        """Generate SPICE BJT transistor line"""
        ports = list(comp.ports.items())

        # Standard BJT: Base, Collector, Emitter
        collector = ports[0][1].node if len(ports) > 0 else "0"
        base = ports[1][1].node if len(ports) > 1 else "0"
        emitter = ports[2][1].node if len(ports) > 2 else "0"

        model = comp.parameters.get('MODEL', Parameter('MODEL', '2N2222', '')).value

        return f"Q{comp.name} {collector} {base} {emitter} {model}"

    def _generate_transistor_fet(self, comp: CircuitComponent) -> str:
        """Generate SPICE FET transistor line"""
        ports = list(comp.ports.items())

        # Standard FET: Drain, Gate, Source
        drain = ports[0][1].node if len(ports) > 0 else "0"
        gate = ports[1][1].node if len(ports) > 1 else "0"
        source = ports[2][1].node if len(ports) > 2 else "0"

        model = comp.parameters.get('MODEL', Parameter('MODEL', '2N7000', '')).value

        return f"M{comp.name} {drain} {gate} {source} {source} {model}"

    def _generate_op_amp(self, comp: CircuitComponent) -> str:
        """Generate SPICE op-amp subcircuit call"""
        ports = list(comp.ports.items())

        # Typical op-amp pins: Non-inv, Inv, +V, -V, Out
        non_inv = ports[0][1].node if len(ports) > 0 else "0"
        inv = ports[1][1].node if len(ports) > 1 else "0"
        vcc = ports[2][1].node if len(ports) > 2 else "vcc"
        vee = ports[3][1].node if len(ports) > 3 else "0"
        out = ports[4][1].node if len(ports) > 4 else "0"

        model = comp.parameters.get('MODEL', Parameter('MODEL', 'uA741', '')).value

        return f"X{comp.name} {non_inv} {inv} {vcc} {vee} {out} {model}"

    def _generate_generic_component(self, comp: CircuitComponent) -> str:
        """Generate generic SPICE line"""
        port_nodes = " ".join(port.node for port in comp.ports.values() if port.node)
        params = " ".join(f"{p.name}={self._format_spice_value(p.value)}"
                         for p in comp.parameters.values())

        return f"{comp.component_model} {port_nodes} {params}".strip()

    def _generate_simulation_commands(self, sim_params: Dict) -> List[str]:
        """Generate SPICE simulation commands"""
        lines = []

        sim_type = sim_params.get('type', 'transient')

        if sim_type == 'transient':
            duration = sim_params.get('duration', '1m')
            step = sim_params.get('step', '1u')
            lines.append(f".tran 0 {duration} 0 {step}")

        elif sim_type == 'ac':
            start_freq = sim_params.get('start_freq', '1')
            stop_freq = sim_params.get('stop_freq', '1M')
            points = sim_params.get('points', '100')
            lines.append(f".ac dec {points} {start_freq} {stop_freq}")

        elif sim_type == 'dc':
            source = sim_params.get('source', 'V1')
            start = sim_params.get('start', '0')
            stop = sim_params.get('stop', '5')
            step = sim_params.get('step', '0.1')
            lines.append(f".dc {source} {start} {stop} {step}")

        elif sim_type == 'op':
            lines.append(".op")

        return lines

    @staticmethod
    def _format_spice_value(value: str) -> str:
        """Convert value to SPICE format"""
        value = str(value).strip()

        # Handle common suffixes
        suffixes = {
            'k': 'e3',
            'm': 'e-3',
            'u': 'e-6',
            'n': 'e-9',
            'p': 'e-12',
            'meg': 'e6',
            'g': 'e9'
        }

        for suffix, exponent in suffixes.items():
            if value.lower().endswith(suffix):
                num = value[:-len(suffix)]
                try:
                    return f"{float(num)}{exponent}"
                except:
                    pass

        # Return as-is if already valid
        try:
            float(value)
            return value
        except:
            return value


class SPICESimulationConfig:
    """Helper class for configuring SPICE simulations"""

    def __init__(self, circuit: CircuitAST):
        self.circuit = circuit
        self.config = {
            'type': 'transient',
            'duration': '1m',
            'step': '1u',
            'max_step': '10u'
        }

    def set_transient(self, duration: str = '1m', step: str = '1u'):
        """Configure transient analysis"""
        self.config['type'] = 'transient'
        self.config['duration'] = duration
        self.config['step'] = step
        return self

    def set_ac(self, start_freq: str = '1', stop_freq: str = '1M', points: int = 100):
        """Configure AC analysis"""
        self.config['type'] = 'ac'
        self.config['start_freq'] = start_freq
        self.config['stop_freq'] = stop_freq
        self.config['points'] = points
        return self

    def set_dc(self, source: str = 'V1', start: str = '0', stop: str = '5', step: str = '0.1'):
        """Configure DC sweep"""
        self.config['type'] = 'dc'
        self.config['source'] = source
        self.config['start'] = start
        self.config['stop'] = stop
        self.config['step'] = step
        return self

    def generate_netlist(self) -> str:
        """Generate complete netlist with simulation"""
        generator = SPICEGenerator()
        return generator.generate(self.circuit, self.config)
