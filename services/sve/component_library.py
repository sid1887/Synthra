"""
Initial component library seed data
This defines the 100+ components to generate on first run
"""

COMPONENT_LIBRARY = [
    # === PASSIVE COMPONENTS ===
    {"type": "resistor", "category": "passive", "pins": 2, "style": "IEEE", 
     "details": "zigzag symbol"},
    {"type": "resistor_variable", "category": "passive", "pins": 2, "style": "IEEE",
     "details": "with arrow through it"},
    {"type": "potentiometer", "category": "passive", "pins": 3, "style": "IEEE",
     "details": "three terminal variable resistor"},
    {"type": "capacitor", "category": "passive", "pins": 2, "style": "IEEE",
     "details": "two parallel lines"},
    {"type": "capacitor_polarized", "category": "passive", "pins": 2, "style": "IEEE",
     "details": "electrolytic with plus sign"},
    {"type": "capacitor_variable", "category": "passive", "pins": 2, "style": "IEEE",
     "details": "with arrow through it"},
    {"type": "inductor", "category": "passive", "pins": 2, "style": "IEEE",
     "details": "coil symbol"},
    {"type": "inductor_iron_core", "category": "passive", "pins": 2, "style": "IEEE",
     "details": "coil with parallel lines"},
    {"type": "transformer", "category": "passive", "pins": 4, "style": "IEEE",
     "details": "two coils with lines between"},
    
    # === DIODES ===
    {"type": "diode", "category": "active", "pins": 2, "style": "IEEE",
     "details": "triangle and line"},
    {"type": "diode_zener", "category": "active", "pins": 2, "style": "IEEE",
     "details": "with bent cathode line"},
    {"type": "diode_schottky", "category": "active", "pins": 2, "style": "IEEE",
     "details": "with S-shaped cathode"},
    {"type": "led", "category": "active", "pins": 2, "style": "IEEE",
     "details": "diode with arrows pointing out"},
    {"type": "photodiode", "category": "active", "pins": 2, "style": "IEEE",
     "details": "diode with arrows pointing in"},
    
    # === TRANSISTORS - BJT ===
    {"type": "bjt_npn", "category": "active", "pins": 3, "style": "IEEE",
     "details": "NPN transistor with arrow pointing out"},
    {"type": "bjt_pnp", "category": "active", "pins": 3, "style": "IEEE",
     "details": "PNP transistor with arrow pointing in"},
    {"type": "bjt_npn_darlington", "category": "active", "pins": 3, "style": "IEEE",
     "details": "dual NPN transistors"},
    {"type": "bjt_pnp_darlington", "category": "active", "pins": 3, "style": "IEEE",
     "details": "dual PNP transistors"},
    
    # === TRANSISTORS - MOSFET ===
    {"type": "mosfet_n_channel", "category": "active", "pins": 4, "style": "IEEE",
     "details": "N-channel MOSFET with body diode"},
    {"type": "mosfet_p_channel", "category": "active", "pins": 4, "style": "IEEE",
     "details": "P-channel MOSFET with body diode"},
    {"type": "mosfet_n_enhancement", "category": "active", "pins": 3, "style": "IEEE",
     "details": "N-channel enhancement mode"},
    {"type": "mosfet_p_enhancement", "category": "active", "pins": 3, "style": "IEEE",
     "details": "P-channel enhancement mode"},
    {"type": "mosfet_n_depletion", "category": "active", "pins": 3, "style": "IEEE",
     "details": "N-channel depletion mode"},
    
    # === OPERATIONAL AMPLIFIERS ===
    {"type": "opamp", "category": "analog", "pins": 5, "style": "IEEE",
     "details": "triangle with + and - inputs"},
    {"type": "opamp_dual", "category": "analog", "pins": 8, "style": "IEEE",
     "details": "two op-amp triangles in package"},
    {"type": "opamp_quad", "category": "analog", "pins": 14, "style": "IEEE",
     "details": "four op-amp triangles in package"},
    {"type": "comparator", "category": "analog", "pins": 5, "style": "IEEE",
     "details": "op-amp triangle with digital output"},
    {"type": "instrumentation_amplifier", "category": "analog", "pins": 8, "style": "IEEE",
     "details": "three op-amps configuration"},
    
    # === LOGIC GATES ===
    {"type": "and_gate", "category": "digital", "pins": 3, "style": "IEEE",
     "details": "D-shaped AND gate"},
    {"type": "or_gate", "category": "digital", "pins": 3, "style": "IEEE",
     "details": "curved OR gate"},
    {"type": "not_gate", "category": "digital", "pins": 2, "style": "IEEE",
     "details": "triangle inverter"},
    {"type": "nand_gate", "category": "digital", "pins": 3, "style": "IEEE",
     "details": "AND gate with bubble"},
    {"type": "nor_gate", "category": "digital", "pins": 3, "style": "IEEE",
     "details": "OR gate with bubble"},
    {"type": "xor_gate", "category": "digital", "pins": 3, "style": "IEEE",
     "details": "OR gate with extra curve"},
    {"type": "xnor_gate", "category": "digital", "pins": 3, "style": "IEEE",
     "details": "XOR gate with bubble"},
    {"type": "buffer", "category": "digital", "pins": 2, "style": "IEEE",
     "details": "triangle buffer"},
    
    # === FLIP-FLOPS & LATCHES ===
    {"type": "flipflop_d", "category": "digital", "pins": 5, "style": "IEEE",
     "details": "D flip-flop rectangle"},
    {"type": "flipflop_jk", "category": "digital", "pins": 6, "style": "IEEE",
     "details": "JK flip-flop rectangle"},
    {"type": "flipflop_t", "category": "digital", "pins": 4, "style": "IEEE",
     "details": "T flip-flop rectangle"},
    {"type": "latch_sr", "category": "digital", "pins": 4, "style": "IEEE",
     "details": "SR latch rectangle"},
    
    # === POWER & GROUND ===
    {"type": "voltage_source", "category": "power", "pins": 2, "style": "IEEE",
     "details": "circle with + and - signs"},
    {"type": "current_source", "category": "power", "pins": 2, "style": "IEEE",
     "details": "circle with arrow"},
    {"type": "ground", "category": "power", "pins": 1, "style": "IEEE",
     "details": "ground symbol with lines"},
    {"type": "vcc", "category": "power", "pins": 1, "style": "IEEE",
     "details": "VCC power supply symbol"},
    {"type": "vdd", "category": "power", "pins": 1, "style": "IEEE",
     "details": "VDD power supply symbol"},
    {"type": "vss", "category": "power", "pins": 1, "style": "IEEE",
     "details": "VSS ground symbol"},
    {"type": "battery", "category": "power", "pins": 2, "style": "IEEE",
     "details": "battery symbol with long and short lines"},
    
    # === SWITCHES & CONNECTORS ===
    {"type": "switch_spst", "category": "electromechanical", "pins": 2, "style": "IEEE",
     "details": "single pole single throw switch"},
    {"type": "switch_spdt", "category": "electromechanical", "pins": 3, "style": "IEEE",
     "details": "single pole double throw switch"},
    {"type": "switch_dpdt", "category": "electromechanical", "pins": 6, "style": "IEEE",
     "details": "double pole double throw switch"},
    {"type": "pushbutton_no", "category": "electromechanical", "pins": 2, "style": "IEEE",
     "details": "normally open pushbutton"},
    {"type": "pushbutton_nc", "category": "electromechanical", "pins": 2, "style": "IEEE",
     "details": "normally closed pushbutton"},
    {"type": "relay_spst", "category": "electromechanical", "pins": 4, "style": "IEEE",
     "details": "relay coil and switch contacts"},
    {"type": "relay_dpdt", "category": "electromechanical", "pins": 8, "style": "IEEE",
     "details": "relay with double pole contacts"},
    
    # === CONNECTORS ===
    {"type": "connector_2pin", "category": "connector", "pins": 2, "style": "IEEE",
     "details": "two pin connector"},
    {"type": "connector_3pin", "category": "connector", "pins": 3, "style": "IEEE",
     "details": "three pin connector"},
    {"type": "connector_4pin", "category": "connector", "pins": 4, "style": "IEEE",
     "details": "four pin connector"},
    {"type": "header_male", "category": "connector", "pins": None, "style": "IEEE",
     "details": "male pin header"},
    {"type": "header_female", "category": "connector", "pins": None, "style": "IEEE",
     "details": "female socket header"},
    {"type": "usb_connector", "category": "connector", "pins": 4, "style": "IEEE",
     "details": "USB connector symbol"},
    
    # === INTEGRATED CIRCUITS ===
    {"type": "ic_555_timer", "category": "analog", "pins": 8, "style": "IEEE",
     "details": "555 timer IC rectangle"},
    {"type": "ic_7400_quad_nand", "category": "digital", "pins": 14, "style": "IEEE",
     "details": "7400 quad NAND gate IC"},
    {"type": "ic_7404_hex_inverter", "category": "digital", "pins": 14, "style": "IEEE",
     "details": "7404 hex inverter IC"},
    {"type": "ic_7408_quad_and", "category": "digital", "pins": 14, "style": "IEEE",
     "details": "7408 quad AND gate IC"},
    {"type": "ic_7432_quad_or", "category": "digital", "pins": 14, "style": "IEEE",
     "details": "7432 quad OR gate IC"},
    {"type": "ic_7474_dual_d_ff", "category": "digital", "pins": 14, "style": "IEEE",
     "details": "7474 dual D flip-flop IC"},
    {"type": "ic_7490_decade_counter", "category": "digital", "pins": 14, "style": "IEEE",
     "details": "7490 decade counter IC"},
    {"type": "ic_74138_decoder", "category": "digital", "pins": 16, "style": "IEEE",
     "details": "74138 3-to-8 decoder IC"},
    {"type": "ic_74151_mux", "category": "digital", "pins": 16, "style": "IEEE",
     "details": "74151 8-to-1 multiplexer IC"},
    
    # === MICROCONTROLLERS ===
    {"type": "microcontroller_8pin", "category": "digital", "pins": 8, "style": "IEEE",
     "details": "8-pin microcontroller IC"},
    {"type": "microcontroller_28pin", "category": "digital", "pins": 28, "style": "IEEE",
     "details": "28-pin microcontroller IC"},
    {"type": "arduino_uno", "category": "digital", "pins": None, "style": "IEEE",
     "details": "Arduino Uno board symbol"},
    
    # === VOLTAGE REGULATORS ===
    {"type": "voltage_regulator_7805", "category": "analog", "pins": 3, "style": "IEEE",
     "details": "78xx series voltage regulator"},
    {"type": "voltage_regulator_lm317", "category": "analog", "pins": 3, "style": "IEEE",
     "details": "LM317 adjustable regulator"},
    {"type": "voltage_reference", "category": "analog", "pins": 3, "style": "IEEE",
     "details": "precision voltage reference"},
    
    # === CRYSTALS & OSCILLATORS ===
    {"type": "crystal", "category": "passive", "pins": 2, "style": "IEEE",
     "details": "quartz crystal symbol"},
    {"type": "crystal_oscillator", "category": "active", "pins": 4, "style": "IEEE",
     "details": "crystal oscillator package"},
    {"type": "resonator", "category": "passive", "pins": 3, "style": "IEEE",
     "details": "ceramic resonator"},
    
    # === PROTECTION & ESD ===
    {"type": "fuse", "category": "passive", "pins": 2, "style": "IEEE",
     "details": "fuse symbol with rectangle"},
    {"type": "varistor", "category": "passive", "pins": 2, "style": "IEEE",
     "details": "voltage dependent resistor"},
    {"type": "tvs_diode", "category": "active", "pins": 2, "style": "IEEE",
     "details": "transient voltage suppressor"},
    {"type": "gas_discharge_tube", "category": "passive", "pins": 2, "style": "IEEE",
     "details": "GDT protection device"},
    
    # === SENSORS ===
    {"type": "thermistor_ntc", "category": "sensor", "pins": 2, "style": "IEEE",
     "details": "negative temperature coefficient thermistor"},
    {"type": "thermistor_ptc", "category": "sensor", "pins": 2, "style": "IEEE",
     "details": "positive temperature coefficient thermistor"},
    {"type": "photoresistor", "category": "sensor", "pins": 2, "style": "IEEE",
     "details": "light dependent resistor"},
    {"type": "thermocouple", "category": "sensor", "pins": 2, "style": "IEEE",
     "details": "temperature sensor"},
    
    # === DISPLAYS ===
    {"type": "led_7segment", "category": "display", "pins": None, "style": "IEEE",
     "details": "seven segment LED display"},
    {"type": "lcd_display", "category": "display", "pins": None, "style": "IEEE",
     "details": "LCD display symbol"},
    
    # === ANTENNAS & RF ===
    {"type": "antenna", "category": "rf", "pins": 1, "style": "IEEE",
     "details": "antenna symbol"},
    {"type": "antenna_dipole", "category": "rf", "pins": 2, "style": "IEEE",
     "details": "dipole antenna"},
    
    # === MOTORS ===
    {"type": "motor_dc", "category": "electromechanical", "pins": 2, "style": "IEEE",
     "details": "DC motor symbol with M inside circle"},
    {"type": "motor_servo", "category": "electromechanical", "pins": 3, "style": "IEEE",
     "details": "servo motor symbol"},
    
    # === TEST POINTS ===
    {"type": "test_point", "category": "connector", "pins": 1, "style": "IEEE",
     "details": "test point symbol"},
    {"type": "junction_dot", "category": "connector", "pins": 1, "style": "IEEE",
     "details": "wire junction dot"},
]

def get_component_library():
    """Return the component library"""
    return COMPONENT_LIBRARY

def get_by_category(category: str):
    """Get components filtered by category"""
    return [c for c in COMPONENT_LIBRARY if c['category'] == category]

def get_categories():
    """Get unique categories"""
    return list(set(c['category'] for c in COMPONENT_LIBRARY))
