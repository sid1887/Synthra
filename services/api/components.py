"""
Component Library API endpoints
Manages component specifications, symbols, and metadata
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
import os
import json

# Database imports
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor, Json
except ImportError:
    psycopg2 = None

router = APIRouter(prefix="/api/components", tags=["components"])

# Pydantic models for request/response
class PinDefinition(BaseModel):
    name: str
    x: float
    y: float
    direction: str  # 'input', 'output', 'inout'

class ComponentSpec(BaseModel):
    symbol_name: str
    category: str
    description: Optional[str] = None
    pins: List[PinDefinition]
    spice_template: Optional[str] = None
    vhdl_template: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = {}

class ComponentLibraryEntry(BaseModel):
    id: str
    component_type: str
    symbol_name: str
    category: str
    description: Optional[str]
    svg_symbol: Optional[str]
    pin_definitions: List[PinDefinition]
    spice_template: Optional[str]
    vhdl_template: Optional[str]
    parameters: Dict[str, Any]
    manufacturer: Optional[str]
    datasheet_url: Optional[str]

    class Config:
        from_attributes = True

def get_db_connection():
    """Get PostgreSQL connection"""
    if not psycopg2:
        raise HTTPException(status_code=500, detail="Database driver not installed")

    db_url = os.getenv("DATABASE_URL", "postgresql://synthra:synthra@postgres:5432/synthra_db")
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@router.get("/", response_model=List[ComponentLibraryEntry])
async def list_components(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by name or type")
):
    """
    Get all components from library
    Optionally filter by category or search term
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = "SELECT * FROM component_library WHERE 1=1"
            params = []

            if category:
                query += " AND category = %s"
                params.append(category)

            if search:
                query += " AND (symbol_name ILIKE %s OR component_type ILIKE %s)"
                params.extend([f"%{search}%", f"%{search}%"])

            query += " ORDER BY symbol_name"
            cur.execute(query, params)
            components = cur.fetchall()

            # Convert to proper format
            result = []
            for comp in components:
                entry = {
                    "id": str(comp["id"]),
                    "component_type": comp["component_type"],
                    "symbol_name": comp["symbol_name"],
                    "category": comp["category"],
                    "description": comp.get("description"),
                    "svg_symbol": comp.get("svg_symbol"),
                    "pin_definitions": comp.get("pin_definitions", []),
                    "spice_template": comp.get("spice_template"),
                    "vhdl_template": comp.get("vhdl_template"),
                    "parameters": comp.get("parameters", {}),
                    "manufacturer": comp.get("manufacturer"),
                    "datasheet_url": comp.get("datasheet_url"),
                }
                result.append(entry)

            return result
    finally:
        conn.close()

@router.get("/{component_id}", response_model=ComponentLibraryEntry)
async def get_component(component_id: str):
    """
    Get a specific component by ID
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM component_library WHERE id = %s", (component_id,))
            comp = cur.fetchone()

            if not comp:
                raise HTTPException(status_code=404, detail="Component not found")

            entry = {
                "id": str(comp["id"]),
                "component_type": comp["component_type"],
                "symbol_name": comp["symbol_name"],
                "category": comp["category"],
                "description": comp.get("description"),
                "svg_symbol": comp.get("svg_symbol"),
                "pin_definitions": comp.get("pin_definitions", []),
                "spice_template": comp.get("spice_template"),
                "vhdl_template": comp.get("vhdl_template"),
                "parameters": comp.get("parameters", {}),
                "manufacturer": comp.get("manufacturer"),
                "datasheet_url": comp.get("datasheet_url"),
            }
            return entry
    finally:
        conn.close()

@router.get("/by-symbol/{symbol_name}", response_model=ComponentLibraryEntry)
async def get_component_by_symbol(symbol_name: str):
    """
    Get a component by symbol name (e.g., 'R', 'AND2', 'Q')
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM component_library WHERE symbol_name = %s LIMIT 1",
                (symbol_name.upper(),)
            )
            comp = cur.fetchone()

            if not comp:
                raise HTTPException(status_code=404, detail=f"Component '{symbol_name}' not found")

            entry = {
                "id": str(comp["id"]),
                "component_type": comp["component_type"],
                "symbol_name": comp["symbol_name"],
                "category": comp["category"],
                "description": comp.get("description"),
                "svg_symbol": comp.get("svg_symbol"),
                "pin_definitions": comp.get("pin_definitions", []),
                "spice_template": comp.get("spice_template"),
                "vhdl_template": comp.get("vhdl_template"),
                "parameters": comp.get("parameters", {}),
                "manufacturer": comp.get("manufacturer"),
                "datasheet_url": comp.get("datasheet_url"),
            }
            return entry
    finally:
        conn.close()

@router.post("/", response_model=Dict[str, str])
async def create_component(spec: ComponentSpec):
    """
    Create a new component in the library
    """
    conn = get_db_connection()
    try:
        component_id = str(uuid.uuid4())

        with conn.cursor() as cur:
            # Insert component
            cur.execute(
                """
                INSERT INTO component_library
                (id, component_type, symbol_name, category, description,
                 pin_definitions, spice_template, vhdl_template, parameters)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    component_id,
                    spec.symbol_name.lower(),
                    spec.symbol_name.upper(),
                    spec.category,
                    spec.description,
                    json.dumps([p.model_dump() for p in spec.pins]),
                    spec.spice_template,
                    spec.vhdl_template,
                    json.dumps(spec.parameters or {}),
                )
            )
            conn.commit()

        return {"id": component_id, "message": "Component created successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create component: {str(e)}")
    finally:
        conn.close()

@router.put("/{component_id}", response_model=Dict[str, str])
async def update_component(component_id: str, spec: ComponentSpec):
    """
    Update an existing component
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE component_library
                SET symbol_name = %s, category = %s, description = %s,
                    pin_definitions = %s, spice_template = %s,
                    vhdl_template = %s, parameters = %s
                WHERE id = %s
                """,
                (
                    spec.symbol_name.upper(),
                    spec.category,
                    spec.description,
                    json.dumps([p.model_dump() for p in spec.pins]),
                    spec.spice_template,
                    spec.vhdl_template,
                    json.dumps(spec.parameters or {}),
                    component_id,
                )
            )

            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Component not found")

            conn.commit()

        return {"id": component_id, "message": "Component updated successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update component: {str(e)}")
    finally:
        conn.close()

@router.post("/{component_id}/svg", response_model=Dict[str, str])
async def update_component_svg(component_id: str, svg_data: Dict[str, str]):
    """
    Update the SVG symbol for a component
    """
    conn = get_db_connection()
    try:
        svg_content = svg_data.get("svg")
        if not svg_content:
            raise HTTPException(status_code=400, detail="No SVG content provided")

        with conn.cursor() as cur:
            cur.execute(
                "UPDATE component_library SET svg_symbol = %s WHERE id = %s",
                (svg_content, component_id)
            )

            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Component not found")

            conn.commit()

        return {"id": component_id, "message": "SVG updated successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update SVG: {str(e)}")
    finally:
        conn.close()

@router.get("/categories/all", response_model=List[str])
async def get_categories():
    """
    Get all available component categories
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT DISTINCT category FROM component_library WHERE category IS NOT NULL ORDER BY category"
            )
            categories = [row["category"] for row in cur.fetchall()]
            return categories
    finally:
        conn.close()

@router.get("/search/symbol-names", response_model=List[str])
async def get_all_symbols():
    """
    Get all available symbol names (quick reference)
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT DISTINCT symbol_name FROM component_library ORDER BY symbol_name"
            )
            symbols = [row["symbol_name"] for row in cur.fetchall()]
            return symbols
    finally:
        conn.close()
