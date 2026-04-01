"""
Circuit Synchronization Manager
Keeps Circuit AST in sync between GUI and Code editors
Enables bidirectional editing - edit GUI OR code, both stay synchronized
"""

from circuit_ast import CircuitAST, CircuitComponent, Net, Port, Parameter, ComponentType
from verilog_generator import VerilogGenerator
from spice_generator import SPICEGenerator
from verilog_parser import VerilogParser, SPICEParser
from typing import Callable, List, Dict, Any, Optional
from enum import Enum
from datetime import datetime
import difflib


class ChangeType(Enum):
    """Types of changes to circuit"""
    COMPONENT_ADDED = "component_added"
    COMPONENT_MODIFIED = "component_modified"
    COMPONENT_DELETED = "component_deleted"
    NET_ADDED = "net_added"
    NET_MODIFIED = "net_modified"
    NET_DELETED = "net_deleted"
    PARAMETER_CHANGED = "parameter_changed"
    FULL_SYNC = "full_sync"


class CircuitChange:
    """Represents a single change to the circuit"""

    def __init__(self, change_type: ChangeType, source: str, **kwargs):
        self.type = change_type
        self.source = source  # 'gui' or 'code'
        self.timestamp = datetime.now()
        self.data = kwargs

    def __repr__(self):
        return f"<Change {self.type.value} from {self.source}>"


class CircuitSync:
    """Synchronization manager for bidirectional circuit editing"""

    def __init__(self, initial_circuit: Optional[CircuitAST] = None):
        self.circuit = initial_circuit or CircuitAST(name="New Circuit")

        # Code generators
        self.verilog_gen = VerilogGenerator()
        self.spice_gen = SPICEGenerator()

        # Code parsers
        self.verilog_parser = VerilogParser()
        self.spice_parser = SPICEParser()

        # Change tracking
        self.change_history: List[CircuitChange] = []
        self.undo_stack: List[CircuitAST] = []
        self.redo_stack: List[CircuitAST] = []

        # Observers/listeners
        self.gui_listeners: List[Callable] = []  # Notify GUI of code changes
        self.code_listeners: List[Callable] = []  # Notify code editor of GUI changes
        self.error_listeners: List[Callable] = []  # Notify of errors

        # Generated code cache
        self.current_verilog = ""
        self.current_spice = ""
        self.current_json = ""
        self._update_code_cache()

    # ==================== GUI TO CODE SYNC ====================

    def on_gui_change(self, change_data: Dict[str, Any]):
        """Handle changes from GUI (visual editor)"""

        change_type = change_data.get('type')

        try:
            if change_type == 'component_added':
                self._handle_component_added(change_data)

            elif change_type == 'component_modified':
                self._handle_component_modified(change_data)

            elif change_type == 'component_deleted':
                self._handle_component_deleted(change_data)

            elif change_type == 'net_connected':
                self._handle_net_connected(change_data)

            elif change_type == 'net_deleted':
                self._handle_net_deleted(change_data)

            else:
                self._notify_error(f"Unknown GUI change type: {change_type}")
                return

            # Record change
            change = CircuitChange(
                ChangeType[change_type.upper()],
                'gui',
                **change_data
            )
            self.change_history.append(change)

            # Save undo state
            self._push_undo_state()

            # Regenerate code
            self._update_code_cache()

            # Notify code listeners
            self._notify_code_listeners({
                'verilog': self.current_verilog,
                'spice': self.current_spice,
                'source': 'gui',
                'change': change
            })

        except Exception as e:
            self._notify_error(f"GUI change error: {str(e)}")

    def _handle_component_added(self, data: Dict):
        """Handle component addition from GUI"""
        comp = data.get('component')
        if isinstance(comp, dict):
            comp = CircuitComponent(**comp)

        if comp.name in [c.name for c in self.circuit.components]:
            self._notify_error(f"Component {comp.name} already exists")
            return

        self.circuit.add_component(comp)

    def _handle_component_modified(self, data: Dict):
        """Handle component modification from GUI"""
        comp_name = data.get('name')
        updates = data.get('updates', {})

        comp = self.circuit.get_component(comp_name)
        if not comp:
            self._notify_error(f"Component {comp_name} not found")
            return

        # Update properties
        for key, value in updates.items():
            if key == 'parameters':
                # Update parameters
                for param_name, param_value in value.items():
                    if param_name in comp.parameters:
                        comp.parameters[param_name].value = param_value
                    else:
                        comp.parameters[param_name] = Parameter(param_name, param_value)

            elif key == 'ports':
                # Update port connections
                for port_name, port_node in value.items():
                    if port_name in comp.ports:
                        comp.ports[port_name].node = port_node

            elif hasattr(comp, key):
                setattr(comp, key, value)

        self.circuit.modified_at = datetime.now().isoformat()

    def _handle_component_deleted(self, data: Dict):
        """Handle component deletion from GUI"""
        comp_name = data.get('name')
        self.circuit.remove_component(comp_name)

    def _handle_net_connected(self, data: Dict):
        """Handle net connection from GUI"""
        net_name = data.get('net_name')
        port = data.get('port')  # {component_name: str, port_name: str}

        if not net_name or not port:
            return

        comp = self.circuit.get_component(port['component_name'])
        if comp and port['port_name'] in comp.ports:
            comp.ports[port['port_name']].node = net_name

    def _handle_net_deleted(self, data: Dict):
        """Handle net deletion from GUI"""
        net_name = data.get('name')
        self.circuit.remove_net(net_name)

    # ==================== CODE TO GUI SYNC ====================

    def on_code_change(self, code: str, language: str = 'verilog'):
        """Handle changes from code editor"""

        try:
            # Parse code into AST
            if language == 'verilog':
                new_circuit = self.verilog_parser.parse(code, self.circuit.name)
            elif language == 'spice':
                new_circuit = self.spice_parser.parse(code, self.circuit.name)
            else:
                self._notify_error(f"Unknown language: {language}")
                return

            # Merge with existing circuit (preserve visual layout)
            self._merge_circuits(self.circuit, new_circuit)

            # Record change
            change = CircuitChange(
                ChangeType.FULL_SYNC,
                'code',
                language=language
            )
            self.change_history.append(change)

            # Save undo state
            self._push_undo_state()

            # Update code cache
            self._update_code_cache()

            # Notify GUI listeners to update visualization
            self._notify_gui_listeners({
                'circuit': self.circuit,
                'source': 'code',
                'change': change
            })

        except Exception as e:
            self._notify_error(f"Code parse error: {str(e)}")

    def _merge_circuits(self, old: CircuitAST, new: CircuitAST):
        """Intelligently merge old and new circuit"""

        # Track which components are in new circuit
        new_names = {c.name for c in new.components}
        old_names = {c.name for c in old.components}

        # Add new components
        for new_comp in new.components:
            if new_comp.name not in old_names:
                old.add_component(new_comp)
            else:
                # Update existing
                old_comp = old.get_component(new_comp.name)
                if old_comp:
                    # Preserve visual position
                    old_comp.parameters = new_comp.parameters
                    old_comp.ports = new_comp.ports
                    old_comp.component_model = new_comp.component_model

        # Remove deleted components
        for removed_name in old_names - new_names:
            old.remove_component(removed_name)

        # Update nets
        new_nets = {n.name for n in new.nets}
        old_nets = {n.name for n in old.nets}

        for new_net in new.nets:
            if new_net.name not in old_nets:
                old.add_net(new_net)

    # ==================== CODE GENERATION & EXPORT ====================

    def _update_code_cache(self):
        """Regenerate all code from current circuit"""
        self.current_verilog = self.verilog_gen.generate(self.circuit)
        self.current_spice = self.spice_gen.generate(self.circuit)
        self.current_json = self.circuit.to_json()

    def get_verilog(self) -> str:
        """Get current Verilog code"""
        return self.current_verilog

    def get_spice(self) -> str:
        """Get current SPICE netlist"""
        return self.current_spice

    def get_json(self) -> str:
        """Get circuit as JSON"""
        return self.current_json

    def export_module(self, module_name: str) -> str:
        """Export circuit as reusable Verilog module"""
        original_name = self.circuit.name
        self.circuit.name = module_name

        verilog = self.verilog_gen.generate(self.circuit)

        self.circuit.name = original_name
        return verilog

    def import_verilog_module(self, verilog_code: str) -> CircuitComponent:
        """Import external Verilog module as custom component"""

        # Parse module to extract signature
        parsed = self.verilog_parser.parse(verilog_code)

        # Create custom component from parsed module
        custom_comp = CircuitComponent(
            type=ComponentType.CUSTOM_HDL,
            name=f"custom_{parsed.name}",
            component_model=parsed.name,
            hdl_definition=verilog_code
        )

        # Copy ports from parsed circuit
        for net in parsed.nets:
            custom_comp.ports[net.name] = Port(
                name=net.name,
                node="",
                direction="inout"
            )

        return custom_comp

    # ==================== UNDO/REDO ====================

    def _push_undo_state(self):
        """Save current circuit state for undo"""
        import copy
        self.undo_stack.append(copy.deepcopy(self.circuit))
        self.redo_stack.clear()  # Clear redo when new change made

    def undo(self):
        """Undo last change"""
        if self.undo_stack:
            import copy
            self.redo_stack.append(copy.deepcopy(self.circuit))
            self.circuit = self.undo_stack.pop()
            self._update_code_cache()
            self._notify_gui_listeners({'circuit': self.circuit, 'source': 'undo'})

    def redo(self):
        """Redo last undone change"""
        if self.redo_stack:
            import copy
            self.undo_stack.append(copy.deepcopy(self.circuit))
            self.circuit = self.redo_stack.pop()
            self._update_code_cache()
            self._notify_gui_listeners({'circuit': self.circuit, 'source': 'redo'})

    # ==================== VALIDATION ====================

    def validate_circuit(self) -> Dict[str, Any]:
        """Validate circuit for issues"""
        issues = {
            'errors': [],
            'warnings': [],
            'info': []
        }

        # Check for unconnected ports
        for comp in self.circuit.components:
            for port_name, port in comp.ports.items():
                if not port.node:
                    issues['warnings'].append(
                        f"{comp.name}.{port_name} is not connected"
                    )

        # Check for duplicate net names
        net_names = [n.name for n in self.circuit.nets]
        duplicates = set([n for n in net_names if net_names.count(n) > 1])
        for dup in duplicates:
            issues['errors'].append(f"Duplicate net name: {dup}")

        # Check for minimum required components
        if not self.circuit.components:
            issues['warnings'].append("Circuit has no components")

        return issues

    # ==================== LISTENERS/OBSERVERS ====================

    def subscribe_gui(self, listener: Callable):
        """Subscribe to GUI update notifications"""
        self.gui_listeners.append(listener)

    def subscribe_code(self, listener: Callable):
        """Subscribe to code update notifications"""
        self.code_listeners.append(listener)

    def subscribe_errors(self, listener: Callable):
        """Subscribe to error notifications"""
        self.error_listeners.append(listener)

    def _notify_gui_listeners(self, data: Dict):
        """Notify all GUI listeners"""
        for listener in self.gui_listeners:
            try:
                listener(data)
            except Exception as e:
                print(f"GUI listener error: {e}")

    def _notify_code_listeners(self, data: Dict):
        """Notify all code listeners"""
        for listener in self.code_listeners:
            try:
                listener(data)
            except Exception as e:
                print(f"Code listener error: {e}")

    def _notify_error(self, message: str):
        """Notify all error listeners"""
        for listener in self.error_listeners:
            try:
                listener({'error': message, 'timestamp': datetime.now().isoformat()})
            except Exception as e:
                print(f"Error listener error: {e}")

    # ==================== STATE MANAGEMENT ====================

    def get_state(self) -> Dict:
        """Get complete sync manager state"""
        return {
            'circuit': self.circuit.to_dict(),
            'verilog': self.current_verilog,
            'spice': self.current_spice,
            'json': self.current_json,
            'history_count': len(self.change_history),
            'undo_available': len(self.undo_stack) > 0,
            'redo_available': len(self.redo_stack) > 0
        }

    def restore_state(self, state: Dict):
        """Restore sync manager state"""
        self.circuit = CircuitAST.from_dict(state['circuit'])
        self._update_code_cache()
