#!/usr/bin/env python3
"""
Seed script for component library
Generates SVG symbols and stores them in the database
Run: python seed.py
"""

import psycopg2
from psycopg2.extras import Json
import json
import sys
import os
from pathlib import Path

# Add SVE to path
sys.path.insert(0, str(Path(__file__).parent))

from symbol_generator import SymbolGenerator

def get_db_connection(db_url=None):
    """Get PostgreSQL connection"""
    if not db_url:
        db_url = os.getenv(
            "DATABASE_URL",
            "postgresql://synthra:synthra@postgres:5432/synthra_db"
        )

    try:
        conn = psycopg2.connect(db_url)
        print(f"✅ Connected to database")
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("   Note: Database seeding requires PostgreSQL running")
        print("   For development, components can be seeded on first API call")
        raise

def define_components():
    """Define all Phase 1 components"""
    return [
        {
            'component_type': 'resistor',
            'symbol_name': 'R',
            'category': 'passive',
            'description': '2-terminal resistor',
            'pins': [
                {'name': 'p', 'direction': 'inout'},
                {'name': 'n', 'direction': 'inout'},
            ],
            'spice_template': 'R{label} {p} {n} {value}',
            'vhdl_template': 'R <= {value};',
        },
        {
            'component_type': 'capacitor',
            'symbol_name': 'C',
            'category': 'passive',
            'description': '2-terminal capacitor',
            'pins': [
                {'name': 'p', 'direction': 'inout'},
                {'name': 'n', 'direction': 'inout'},
            ],
            'spice_template': 'C{label} {p} {n} {value}',
            'vhdl_template': 'C <= {value};',
        },
        {
            'component_type': 'inductor',
            'symbol_name': 'L',
            'category': 'passive',
            'description': '2-terminal inductor',
            'pins': [
                {'name': 'p', 'direction': 'inout'},
                {'name': 'n', 'direction': 'inout'},
            ],
            'spice_template': 'L{label} {p} {n} {value}',
            'vhdl_template': 'L <= {value};',
        },
        {
            'component_type': 'and_gate',
            'symbol_name': 'AND2',
            'category': 'logic',
            'description': '2-input AND gate',
            'pins': [
                {'name': 'A', 'direction': 'input'},
                {'name': 'B', 'direction': 'input'},
                {'name': 'Y', 'direction': 'output'},
            ],
            'spice_template': 'U{label} {A} {B} {Y} AND2',
            'vhdl_template': 'Y <= A and B;',
        },
        {
            'component_type': 'or_gate',
            'symbol_name': 'OR2',
            'category': 'logic',
            'description': '2-input OR gate',
            'pins': [
                {'name': 'A', 'direction': 'input'},
                {'name': 'B', 'direction': 'input'},
                {'name': 'Y', 'direction': 'output'},
            ],
            'spice_template': 'U{label} {A} {B} {Y} OR2',
            'vhdl_template': 'Y <= A or B;',
        },
        {
            'component_type': 'not_gate',
            'symbol_name': 'NOT',
            'category': 'logic',
            'description': 'NOT gate (inverter)',
            'pins': [
                {'name': 'A', 'direction': 'input'},
                {'name': 'Y', 'direction': 'output'},
            ],
            'spice_template': 'U{label} {A} {Y} NOT',
            'vhdl_template': 'Y <= not A;',
        },
        {
            'component_type': 'nand_gate',
            'symbol_name': 'NAND2',
            'category': 'logic',
            'description': '2-input NAND gate',
            'pins': [
                {'name': 'A', 'direction': 'input'},
                {'name': 'B', 'direction': 'input'},
                {'name': 'Y', 'direction': 'output'},
            ],
            'spice_template': 'U{label} {A} {B} {Y} NAND2',
            'vhdl_template': 'Y <= not(A and B);',
        },
        {
            'component_type': 'nor_gate',
            'symbol_name': 'NOR2',
            'category': 'logic',
            'description': '2-input NOR gate',
            'pins': [
                {'name': 'A', 'direction': 'input'},
                {'name': 'B', 'direction': 'input'},
                {'name': 'Y', 'direction': 'output'},
            ],
            'spice_template': 'U{label} {A} {B} {Y} NOR2',
            'vhdl_template': 'Y <= not(A or B);',
        },
        {
            'component_type': 'xor_gate',
            'symbol_name': 'XOR2',
            'category': 'logic',
            'description': '2-input XOR gate',
            'pins': [
                {'name': 'A', 'direction': 'input'},
                {'name': 'B', 'direction': 'input'},
                {'name': 'Y', 'direction': 'output'},
            ],
            'spice_template': 'U{label} {A} {B} {Y} XOR2',
            'vhdl_template': 'Y <= A xor B;',
        },
        {
            'component_type': 'voltage_source',
            'symbol_name': 'V',
            'category': 'power',
            'description': 'Voltage source',
            'pins': [
                {'name': 'pos', 'direction': 'output'},
                {'name': 'neg', 'direction': 'output'},
            ],
            'spice_template': 'V{label} {pos} {neg} {value}',
            'vhdl_template': 'V <= {value};',
        },
        {
            'component_type': 'current_source',
            'symbol_name': 'I',
            'category': 'power',
            'description': 'Current source',
            'pins': [
                {'name': 'pos', 'direction': 'output'},
                {'name': 'neg', 'direction': 'output'},
            ],
            'spice_template': 'I{label} {pos} {neg} {value}',
            'vhdl_template': 'I <= {value};',
        },
        {
            'component_type': 'diode',
            'symbol_name': 'D',
            'category': 'active',
            'description': 'Diode',
            'pins': [
                {'name': 'anode', 'direction': 'inout'},
                {'name': 'cathode', 'direction': 'inout'},
            ],
            'spice_template': 'D{label} {anode} {cathode} 1N4148',
            'vhdl_template': 'Y <= A;',
        },
        {
            'component_type': 'bjt_npn',
            'symbol_name': 'Q',
            'category': 'active',
            'description': 'NPN Transistor',
            'pins': [
                {'name': 'collector', 'direction': 'inout'},
                {'name': 'base', 'direction': 'inout'},
                {'name': 'emitter', 'direction': 'inout'},
            ],
            'spice_template': 'Q{label} {collector} {base} {emitter} 2N2222',
            'vhdl_template': 'Y <= A and B;',
        },
        {
            'component_type': 'opamp',
            'symbol_name': 'U',
            'category': 'active',
            'description': 'Operational Amplifier',
            'pins': [
                {'name': 'in_pos', 'direction': 'input'},
                {'name': 'in_neg', 'direction': 'input'},
                {'name': 'vcc', 'direction': 'input'},
                {'name': 'vee', 'direction': 'input'},
                {'name': 'out', 'direction': 'output'},
            ],
            'spice_template': 'U{label} {in_pos} {in_neg} {vcc} {vee} {out} LM358',
            'vhdl_template': 'Y <= (A - B) * gain;',
        },
        {
            'component_type': 'ground',
            'symbol_name': 'GND',
            'category': 'power',
            'description': 'Ground reference',
            'pins': [
                {'name': 'gnd', 'direction': 'inout'},
            ],
            'spice_template': '',
            'vhdl_template': '',
        },
    ]

def seed_components():
    """Generate SVG for all components and insert into database"""
    try:
        conn = get_db_connection()
    except:
        print("\n⚠️  Database not available - skipping seed")
        print("    Components will be generated on-demand when API is called")
        return

    generator = SymbolGenerator()
    components = define_components()
    inserted = 0
    updated = 0

    try:
        with conn.cursor() as cur:
            for comp in components:
                print(f"\n📦 Processing {comp['symbol_name']} ({comp['category']})...")

                # Generate SVG
                try:
                    svg, pins = generator.generate_symbol({
                        'symbol_name': comp['symbol_name'],
                        'category': comp['category'],
                        'pins': comp['pins'],
                        'description': comp['description'],
                    })

                    print(f"  ✓ Generated SVG ({len(svg)} bytes)")
                    print(f"  ✓ Extracted {len(pins)} pins")

                    # Check if component exists
                    cur.execute(
                        "SELECT id FROM component_library WHERE component_type = %s AND symbol_name = %s",
                        (comp['component_type'], comp['symbol_name'])
                    )
                    existing = cur.fetchone()

                    if existing:
                        # Update existing
                        cur.execute(
                            """
                            UPDATE component_library
                            SET svg_symbol = %s,
                                pin_definitions = %s,
                                description = %s,
                                spice_template = %s,
                                vhdl_template = %s
                            WHERE component_type = %s AND symbol_name = %s
                            """,
                            (
                                svg,
                                Json(pins),
                                comp['description'],
                                comp.get('spice_template'),
                                comp.get('vhdl_template'),
                                comp['component_type'],
                                comp['symbol_name'],
                            )
                        )
                        updated += 1
                        print(f"  ✓ Updated in database")
                    else:
                        # Insert new
                        cur.execute(
                            """
                            INSERT INTO component_library
                            (component_type, symbol_name, category, description,
                             svg_symbol, pin_definitions, spice_template, vhdl_template)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            """,
                            (
                                comp['component_type'],
                                comp['symbol_name'],
                                comp['category'],
                                comp['description'],
                                svg,
                                Json(pins),
                                comp.get('spice_template'),
                                comp.get('vhdl_template'),
                            )
                        )
                        inserted += 1
                        print(f"  ✓ Inserted into database")

                except Exception as e:
                    print(f"  ❌ Error processing {comp['symbol_name']}: {e}")
                    continue

        conn.commit()
        print(f"\n✅ Seeding complete: {inserted} inserted, {updated} updated")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("🌱 Synthra Component Library Seeding Script")
    print("=" * 50)
    seed_components()
