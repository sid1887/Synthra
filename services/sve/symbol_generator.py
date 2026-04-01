"""
Symbol Generation Module
Converts component specs to SVG symbols using AI
"""

import json
import base64
import io
from typing import Dict, List, Any, Optional, Tuple
import re
import logging

logger = logging.getLogger(__name__)

class SymbolGenerator:
    """
    Generates electronic schematic symbols from component specifications
    Uses template-based approach with dimension calculation
    """

    def __init__(self):
        """Initialize symbol generator"""
        self.colors = {
            "outline": "#000000",
            "fill": "#FFFFFF",
            "pin": "#666666",
            "label": "#000000"
        }

        # Standard dimensions
        self.pin_radius = 2
        self.text_size = 10
        self.stroke_width = 1

    def generate_symbol(self, component_spec: Dict[str, Any]) -> Tuple[str, List[Dict]]:
        """
        Generate SVG symbol for component

        Args:
            component_spec: {
                'symbol_name': 'AND2',
                'category': 'logic',
                'pins': [{'name': 'A', 'direction': 'input'}, ...],
                'description': '2-input AND gate'
            }

        Returns:
            (svg_string, normalized_pins)
        """
        symbol_name = component_spec.get('symbol_name', 'COMPONENT')
        category = component_spec.get('category', 'generic')
        pins = component_spec.get('pins', [])

        # Route to appropriate generator based on category
        if category in ['logic', 'digital']:
            return self._generate_logic_gate(symbol_name, pins)
        elif category == 'passive':
            return self._generate_passive(symbol_name, pins)
        elif category == 'active':
            return self._generate_active(symbol_name, pins)
        elif category == 'power':
            return self._generate_power(symbol_name, pins)
        else:
            return self._generate_generic_dip(symbol_name, pins)

    def _generate_logic_gate(self, name: str, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Generate logic gate symbol (AND, OR, NOT, XOR, etc)"""

        # Separate input and output pins
        inputs = [p for p in pins if p.get('direction') == 'input']
        outputs = [p for p in pins if p.get('direction') == 'output']

        if name == 'NOT':
            return self._generate_not_gate(inputs, outputs)
        elif name == 'AND2':
            return self._generate_and_gate(inputs, outputs)
        elif name == 'OR2':
            return self._generate_or_gate(inputs, outputs)
        elif name == 'XOR2':
            return self._generate_xor_gate(inputs, outputs)
        elif name == 'NAND2':
            return self._generate_nand_gate(inputs, outputs)
        elif name == 'NOR2':
            return self._generate_nor_gate(inputs, outputs)
        else:
            # Default DIP package
            return self._generate_generic_dip(name, pins)

    def _generate_not_gate(self, inputs: List[Dict], outputs: List[Dict]) -> Tuple[str, List[Dict]]:
        """NOT gate: Triangle with small circle"""
        width, height = 40, 30

        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            '<g stroke="#000" stroke-width="1" fill="none">',
            # Triangle body
            f'<polygon points="5,5 5,{height-5} 30,{height//2}" fill="white" stroke="black"/>',
            # Output bubble (small circle at point)
            f'<circle cx="32" cy="{height//2}" r="3" fill="none" stroke="black"/>',
            '</g>',
        ]

        # Input pin (left)
        svg_parts.append(f'<line x1="0" y1="{height//2}" x2="5" y2="{height//2}" stroke="black" stroke-width="1"/>')
        # Output pin (right)
        svg_parts.append(f'<line x1="35" y1="{height//2}" x2="{width}" y2="{height//2}" stroke="black" stroke-width="1"/>')

        # Pin circles
        svg_parts.append(f'<circle cx="0" cy="{height//2}" r="2" fill="#666"/>')
        svg_parts.append(f'<circle cx="{width}" cy="{height//2}" r="2" fill="#666"/>')

        # Labels
        svg_parts.append(f'<text x="-8" y="{height//2 + 4}" font-size="9" fill="black">A</text>')
        svg_parts.append(f'<text x="{width + 2}" y="{height//2 + 4}" font-size="9" fill="black">Y</text>')

        svg_parts.append('</svg>')
        svg = '\n'.join(svg_parts)

        # Normalized pins
        normalized_pins = [
            {'name': 'A', 'x': 0, 'y': height//2, 'direction': 'input'},
            {'name': 'Y', 'x': width, 'y': height//2, 'direction': 'output'},
        ]

        return svg, normalized_pins

    def _generate_and_gate(self, inputs: List[Dict], outputs: List[Dict]) -> Tuple[str, List[Dict]]:
        """AND gate: AND symbol (D shape with flat left)"""
        num_inputs = len(inputs)
        pin_spacing = 20
        height = max(40, num_inputs * pin_spacing)
        width = 60

        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            '<g stroke="#000" stroke-width="1" fill="white">',
            # AND gate body (D shape)
            f'<path d="M 5,5 L 5,{height-5} L 40,{height-5} Q 55,{height//2} 40,5 Z" fill="white" stroke="black"/>',
            '</g>',
        ]

        # Add input pins (left side)
        for i, pin in enumerate(inputs):
            y = (i + 1) * (height // (num_inputs + 1))
            svg_parts.append(f'<line x1="0" y1="{y}" x2="5" y2="{y}" stroke="black" stroke-width="1"/>')
            svg_parts.append(f'<circle cx="0" cy="{y}" r="2" fill="#666"/>')
            svg_parts.append(f'<text x="-8" y="{y + 4}" font-size="9" fill="black">{pin.get("name", f"In{i+1}")}</text>')

        # Output pin (right side)
        y_out = height // 2
        svg_parts.append(f'<line x1="{width-5}" y1="{y_out}" x2="{width}" y2="{y_out}" stroke="black" stroke-width="1"/>')
        svg_parts.append(f'<circle cx="{width}" cy="{y_out}" r="2" fill="#666"/>')
        svg_parts.append(f'<text x="{width + 2}" y="{y_out + 4}" font-size="9" fill="black">Y</text>')

        svg_parts.append('</svg>')
        svg = '\n'.join(svg_parts)

        # Normalized pins
        normalized_pins = []
        for i, pin in enumerate(inputs):
            y = (i + 1) * (height // (num_inputs + 1))
            normalized_pins.append({
                'name': pin.get('name', f'In{i+1}'),
                'x': 0,
                'y': y,
                'direction': 'input'
            })

        normalized_pins.append({
            'name': 'Y',
            'x': width,
            'y': y_out,
            'direction': 'output'
        })

        return svg, normalized_pins

    def _generate_or_gate(self, inputs: List[Dict], outputs: List[Dict]) -> Tuple[str, List[Dict]]:
        """OR gate: OR symbol (curved left)"""
        num_inputs = len(inputs)
        pin_spacing = 20
        height = max(40, num_inputs * pin_spacing)
        width = 60

        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            '<g stroke="#000" stroke-width="1" fill="white">',
            # OR gate body
            f'<path d="M 8,5 L 5,{height-5} L 40,{height-5} Q 55,{height//2} 40,5 Q 20,{height//2} 8,5 Z" fill="white" stroke="black"/>',
            '</g>',
        ]

        # Input pins
        for i, pin in enumerate(inputs):
            y = (i + 1) * (height // (num_inputs + 1))
            svg_parts.append(f'<line x1="0" y1="{y}" x2="8" y2="{y}" stroke="black" stroke-width="1"/>')
            svg_parts.append(f'<circle cx="0" cy="{y}" r="2" fill="#666"/>')
            svg_parts.append(f'<text x="-8" y="{y + 4}" font-size="9" fill="black">{pin.get("name", f"In{i+1}")}</text>')

        # Output pin
        y_out = height // 2
        svg_parts.append(f'<line x1="{width-5}" y1="{y_out}" x2="{width}" y2="{y_out}" stroke="black" stroke-width="1"/>')
        svg_parts.append(f'<circle cx="{width}" cy="{y_out}" r="2" fill="#666"/>')
        svg_parts.append(f'<text x="{width + 2}" y="{y_out + 4}" font-size="9" fill="black">Y</text>')

        svg_parts.append('</svg>')
        svg = '\n'.join(svg_parts)

        normalized_pins = []
        for i, pin in enumerate(inputs):
            y = (i + 1) * (height // (num_inputs + 1))
            normalized_pins.append({
                'name': pin.get('name', f'In{i+1}'),
                'x': 0,
                'y': y,
                'direction': 'input'
            })
        normalized_pins.append({'name': 'Y', 'x': width, 'y': y_out, 'direction': 'output'})

        return svg, normalized_pins

    def _generate_xor_gate(self, inputs: List[Dict], outputs: List[Dict]) -> Tuple[str, List[Dict]]:
        """XOR gate: OR symbol with curved left (double curve)"""
        # Similar to OR but with extra curve
        return self._generate_or_gate(inputs, outputs)

    def _generate_nand_gate(self, inputs: List[Dict], outputs: List[Dict]) -> Tuple[str, List[Dict]]:
        """NAND gate: AND symbol with output bubble"""
        svg, pins = self._generate_and_gate(inputs, outputs)
        # Add small bubble at output
        svg = svg.replace('</g>', f'<circle cx="53" cy="{pins[-1]["y"]}" r="3" fill="none" stroke="black"/>\n</g>')
        return svg, pins

    def _generate_nor_gate(self, inputs: List[Dict], outputs: List[Dict]) -> Tuple[str, List[Dict]]:
        """NOR gate: OR symbol with output bubble"""
        svg, pins = self._generate_or_gate(inputs, outputs)
        svg = svg.replace('</g>', f'<circle cx="53" cy="{pins[-1]["y"]}" r="3" fill="none" stroke="black"/>\n</g>')
        return svg, pins

    def _generate_passive(self, name: str, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Generate passive component (R, C, L)"""
        width, height = 60, 20

        if name == 'R':
            return self._generate_resistor(width, height, pins)
        elif name == 'C':
            return self._generate_capacitor(width, height, pins)
        elif name == 'L':
            return self._generate_inductor(width, height, pins)
        else:
            return self._generate_generic_dip(name, pins)

    def _generate_resistor(self, width: int, height: int, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Resistor: Zigzag pattern"""
        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            f'<line x1="0" y1="{height//2}" x2="10" y2="{height//2}" stroke="black" stroke-width="1"/>',
            f'<polyline points="10,{height//2-5} 15,{height//2+5} 20,{height//2-5} 25,{height//2+5} 30,{height//2-5} 35,{height//2+5} 40,{height//2-5} 45,{height//2+5} 50,{height//2}" ',
            f'  fill="none" stroke="black" stroke-width="1"/>',
            f'<line x1="50" y1="{height//2}" x2="{width}" y2="{height//2}" stroke="black" stroke-width="1"/>',
            f'<circle cx="0" cy="{height//2}" r="2" fill="#666"/>',
            f'<circle cx="{width}" cy="{height//2}" r="2" fill="#666"/>',
            '</svg>'
        ]
        svg = '\n'.join(svg_parts)

        normalized_pins = [
            {'name': 'p', 'x': 0, 'y': height//2, 'direction': 'inout'},
            {'name': 'n', 'x': width, 'y': height//2, 'direction': 'inout'},
        ]

        return svg, normalized_pins

    def _generate_capacitor(self, width: int, height: int, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Capacitor: Two parallel lines"""
        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            f'<line x1="0" y1="{height//2}" x2="20" y2="{height//2}" stroke="black" stroke-width="1"/>',
            f'<line x1="25" y1="5" x2="25" y2="{height-5}" stroke="black" stroke-width="2"/>',
            f'<line x1="35" y1="5" x2="35" y2="{height-5}" stroke="black" stroke-width="2"/>',
            f'<line x1="40" y1="{height//2}" x2="{width}" y2="{height//2}" stroke="black" stroke-width="1"/>',
            f'<circle cx="0" cy="{height//2}" r="2" fill="#666"/>',
            f'<circle cx="{width}" cy="{height//2}" r="2" fill="#666"/>',
            '</svg>'
        ]
        svg = '\n'.join(svg_parts)

        normalized_pins = [
            {'name': 'p', 'x': 0, 'y': height//2, 'direction': 'inout'},
            {'name': 'n', 'x': width, 'y': height//2, 'direction': 'inout'},
        ]

        return svg, normalized_pins

    def _generate_inductor(self, width: int, height: int, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Inductor: Coil symbol"""
        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            f'<line x1="0" y1="{height//2}" x2="8" y2="{height//2}" stroke="black" stroke-width="1"/>',
        ]

        # Draw coil loops
        for i in range(4):
            x = 12 + i * 8
            svg_parts.append(f'<circle cx="{x}" cy="{height//2}" r="4" fill="none" stroke="black" stroke-width="1"/>')

        svg_parts.extend([
            f'<line x1="44" y1="{height//2}" x2="{width}" y2="{height//2}" stroke="black" stroke-width="1"/>',
            f'<circle cx="0" cy="{height//2}" r="2" fill="#666"/>',
            f'<circle cx="{width}" cy="{height//2}" r="2" fill="#666"/>',
            '</svg>'
        ])
        svg = '\n'.join(svg_parts)

        normalized_pins = [
            {'name': 'p', 'x': 0, 'y': height//2, 'direction': 'inout'},
            {'name': 'n', 'x': width, 'y': height//2, 'direction': 'inout'},
        ]

        return svg, normalized_pins

    def _generate_active(self, name: str, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Generate active component (diode, transistor, opamp)"""
        if name == 'D':
            return self._generate_diode(pins)
        elif name == 'Q':
            return self._generate_bjt(pins)
        elif name == 'U':
            return self._generate_opamp(pins)
        else:
            return self._generate_generic_dip(name, pins)

    def _generate_diode(self, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Diode: Triangle with line"""
        width, height = 40, 20

        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            f'<line x1="0" y1="{height//2}" x2="8" y2="{height//2}" stroke="black" stroke-width="1"/>',
            f'<polygon points="12,5 12,{height-5} 28,{height//2}" fill="white" stroke="black" stroke-width="1"/>',
            f'<line x1="28" y1="5" x2="28" y2="{height-5}" stroke="black" stroke-width="2"/>',
            f'<line x1="32" y1="{height//2}" x2="{width}" y2="{height//2}" stroke="black" stroke-width="1"/>',
            f'<circle cx="0" cy="{height//2}" r="2" fill="#666"/>',
            f'<circle cx="{width}" cy="{height//2}" r="2" fill="#666"/>',
            f'<text x="-8" y="{height//2 + 4}" font-size="9" fill="black">A</text>',
            f'<text x="{width + 2}" y="{height//2 + 4}" font-size="9" fill="black">C</text>',
            '</svg>'
        ]
        svg = '\n'.join(svg_parts)

        normalized_pins = [
            {'name': 'anode', 'x': 0, 'y': height//2, 'direction': 'inout'},
            {'name': 'cathode', 'x': width, 'y': height//2, 'direction': 'inout'},
        ]

        return svg, normalized_pins

    def _generate_bjt(self, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """BJT Transistor: Vertical symbol"""
        width, height = 30, 50

        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            # Vertical line (base)
            f'<line x1="10" y1="5" x2="10" y2="{height-5}" stroke="black" stroke-width="2"/>',
            # Collector
            f'<line x1="20" y1="5" x2="10" y2="15" stroke="black" stroke-width="1"/>',
            # Base
            f'<line x1="0" y1="10" x2="10" y2="10" stroke="black" stroke-width="1"/>',
            # Emitter
            f'<line x1="10" y1="{height-10}" x2="20" y2="{height-5}" stroke="black" stroke-width="1"/>',
            f'<polygon points="10,{height-15} 6,{height-10} 14,{height-10}" fill="black"/>',
            # Pins
            f'<circle cx="20" cy="5" r="2" fill="#666"/>',
            f'<circle cx="0" cy="10" r="2" fill="#666"/>',
            f'<circle cx="20" cy="{height-5}" r="2" fill="#666"/>',
            # Labels
            f'<text x="22" y="10" font-size="8" fill="black">C</text>',
            f'<text x="-8" y="14" font-size="8" fill="black">B</text>',
            f'<text x="22" y="{height}" font-size="8" fill="black">E</text>',
            '</svg>'
        ]
        svg = '\n'.join(svg_parts)

        normalized_pins = [
            {'name': 'collector', 'x': 20, 'y': 5, 'direction': 'inout'},
            {'name': 'base', 'x': 0, 'y': 10, 'direction': 'inout'},
            {'name': 'emitter', 'x': 20, 'y': height-5, 'direction': 'inout'},
        ]

        return svg, normalized_pins

    def _generate_opamp(self, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Op-amp: Triangle with 5 pins"""
        width, height = 50, 40

        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            f'<polygon points="15,5 15,{height-5} {width-10},{height//2}" fill="white" stroke="black" stroke-width="1"/>',
            # Plus input
            f'<text x="8" y="12" font-size="10" font-weight="bold" fill="black">+</text>',
            # Minus input
            f'<text x="8" y="{height-8}" font-size="10" font-weight="bold" fill="black">−</text>',
            # Pins
            f'<line x1="0" y1="10" x2="15" y2="10" stroke="black" stroke-width="1"/>',
            f'<line x1="0" y1="{height-10}" x2="15" y2="{height-10}" stroke="black" stroke-width="1"/>',
            f'<line x1="{width-10}" y1="{height//2}" x2="{width}" y2="{height//2}" stroke="black" stroke-width="1"/>',
            # Supply pins (top and bottom of triangle)
            f'<line x1="{width//2}" y1="0" x2="{width//2}" y2="5" stroke="black" stroke-width="1"/>',
            f'<line x1="{width//2}" y1="{height-5}" x2="{width//2}" y2="{height}" stroke="black" stroke-width="1"/>',
            # Pin dots
            f'<circle cx="0" cy="10" r="2" fill="#666"/>',
            f'<circle cx="0" cy="{height-10}" r="2" fill="#666"/>',
            f'<circle cx="{width}" cy="{height//2}" r="2" fill="#666"/>',
            f'<circle cx="{width//2}" cy="0" r="2" fill="#666"/>',
            f'<circle cx="{width//2}" cy="{height}" r="2" fill="#666"/>',
            '</svg>'
        ]
        svg = '\n'.join(svg_parts)

        normalized_pins = [
            {'name': 'in_pos', 'x': 0, 'y': 10, 'direction': 'input'},
            {'name': 'in_neg', 'x': 0, 'y': height-10, 'direction': 'input'},
            {'name': 'out', 'x': width, 'y': height//2, 'direction': 'output'},
            {'name': 'vcc', 'x': width//2, 'y': 0, 'direction': 'input'},
            {'name': 'vee', 'x': width//2, 'y': height, 'direction': 'input'},
        ]

        return svg, normalized_pins

    def _generate_power(self, name: str, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Generate power symbol (voltage source, ground)"""
        if name == 'V':
            return self._generate_voltage_source(pins)
        elif name == 'I':
            return self._generate_current_source(pins)
        elif name == 'GND':
            return self._generate_ground(pins)
        else:
            return self._generate_generic_dip(name, pins)

    def _generate_voltage_source(self, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Voltage source: Circle with + and -"""
        width, height = 40, 40

        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            f'<circle cx="20" cy="20" r="15" fill="white" stroke="black" stroke-width="1"/>',
            f'<text x="15" y="24" font-size="16" font-weight="bold" fill="black">~</text>',
            f'<line x1="20" y1="0" x2="20" y2="5" stroke="black" stroke-width="1"/>',
            f'<line x1="20" y1="35" x2="20" y2="{height}" stroke="black" stroke-width="1"/>',
            f'<circle cx="20" cy="0" r="2" fill="#666"/>',
            f'<circle cx="20" cy="{height}" r="2" fill="#666"/>',
            '</svg>'
        ]
        svg = '\n'.join(svg_parts)

        normalized_pins = [
            {'name': 'pos', 'x': 20, 'y': 0, 'direction': 'output'},
            {'name': 'neg', 'x': 20, 'y': height, 'direction': 'output'},
        ]

        return svg, normalized_pins

    def _generate_current_source(self, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Current source: Circle with arrow"""
        return self._generate_voltage_source(pins)  # Similar symbol

    def _generate_ground(self, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Ground: Three horizontal lines decreasing in length"""
        width, height = 30, 25

        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            f'<line x1="15" y1="0" x2="15" y2="5" stroke="black" stroke-width="1"/>',
            f'<line x1="5" y1="5" x2="25" y2="5" stroke="black" stroke-width="2"/>',
            f'<line x1="8" y1="10" x2="22" y2="10" stroke="black" stroke-width="2"/>',
            f'<line x1="11" y1="15" x2="19" y2="15" stroke="black" stroke-width="2"/>',
            f'<circle cx="15" cy="0" r="2" fill="#666"/>',
            '</svg>'
        ]
        svg = '\n'.join(svg_parts)

        normalized_pins = [
            {'name': 'gnd', 'x': 15, 'y': 0, 'direction': 'inout'},
        ]

        return svg, normalized_pins

    def _generate_generic_dip(self, name: str, pins: List[Dict]) -> Tuple[str, List[Dict]]:
        """Generic DIP package for unknown components"""
        num_pins = len(pins)
        pins_per_side = (num_pins + 1) // 2

        width = 50
        height = max(40, pins_per_side * 15)

        svg_parts = [
            f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">',
            f'<rect x="10" y="5" width="30" height="{height-10}" fill="white" stroke="black" stroke-width="1"/>',
            f'<circle cx="15" cy="5" r="3" fill="black"/>',  # Pin 1 indicator
            f'<text x="{width//2-5}" y="{height//2+5}" font-size="10" fill="black" text-anchor="middle">{name}</text>',
        ]

        normalized_pins = []

        # Left side pins
        for i in range(pins_per_side):
            y = 10 + (i + 1) * (height - 20) // (pins_per_side + 1)
            svg_parts.append(f'<line x1="0" y1="{y}" x2="10" y2="{y}" stroke="black" stroke-width="1"/>')
            svg_parts.append(f'<circle cx="0" cy="{y}" r="2" fill="#666"/>')

            if i < len(pins):
                pin = pins[i]
                pin_name = pin.get('name', f'P{i+1}')
                svg_parts.append(f'<text x="-8" y="{y+4}" font-size="8" fill="black">{pin_name}</text>')
                normalized_pins.append({
                    'name': pin_name,
                    'x': 0,
                    'y': y,
                    'direction': pin.get('direction', 'inout')
                })

        # Right side pins
        for i in range(pins_per_side, num_pins):
            idx = i - pins_per_side
            y = 10 + (idx + 1) * (height - 20) // (pins_per_side + 1)
            svg_parts.append(f'<line x1="{width-10}" y1="{y}" x2="{width}" y2="{y}" stroke="black" stroke-width="1"/>')
            svg_parts.append(f'<circle cx="{width}" cy="{y}" r="2" fill="#666"/>')

            pin = pins[i]
            pin_name = pin.get('name', f'P{i+1}')
            svg_parts.append(f'<text x="{width+2}" y="{y+4}" font-size="8" fill="black">{pin_name}</text>')
            normalized_pins.append({
                'name': pin_name,
                'x': width,
                'y': y,
                'direction': pin.get('direction', 'inout')
            })

        svg_parts.append('</svg>')
        svg = '\n'.join(svg_parts)

        return svg, normalized_pins
