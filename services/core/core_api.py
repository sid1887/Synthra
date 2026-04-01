"""
Core Service API Endpoints
Exposes CircuitAST, code generation, and parsing APIs
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os

# Add paths
sys.path.append('/app')
sys.path.append('/shared')

from circuit_ast import CircuitAST, CircuitComponent, Net, Parameter
from verilog_generator import VerilogGenerator
from spice_generator import SPICEGenerator
from circuit_sync import CircuitSync
from verilog_parser import VerilogParser, SPICEParser

# Initialize FastAPI
app = FastAPI(
    title="Synthra Core Service",
    version="2.0.0",
    description="HDL generation, code parsing, circuit synthesis"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global sync manager (in production use database)
sync_manager = CircuitSync()


# ==================== REQUEST/RESPONSE MODELS ====================

class CircuitASTRequest(BaseModel):
    """Circuit AST for input"""
    name: str
    description: Optional[str] = ""
    components: List[Dict[str, Any]] = []
    nets: List[Dict[str, Any]] = []
    parameters: Dict[str, Dict[str, Any]] = {}

class CodeGenerationRequest(BaseModel):
    """Request for code generation"""
    circuit_ast: CircuitASTRequest
    languages: List[str] = ["verilog"]  # verilog, spice, json
    sim_type: Optional[str] = "transient"

class CodeParseRequest(BaseModel):
    """Request for code parsing"""
    code: str
    language: str  # verilog, spice, json

class CodeParseResponse(BaseModel):
    """Response from code parsing"""
    success: bool
    circuit_ast: Optional[CircuitASTRequest] = None
    errors: List[Dict[str, Any]] = []

class CircuitChangeRequest(BaseModel):
    """Represents a circuit change"""
    type: str  # component_added, component_modified, etc.
    data: Dict[str, Any]

class ExportModuleRequest(BaseModel):
    """Request to export circuit as module"""
    circuit: CircuitASTRequest
    module_name: str


# ==================== HEALTH CHECK ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "core",
        "version": "2.0.0"
    }


# ==================== CIRCUIT AST ENDPOINTS ====================

@app.post("/api/create-circuit")
async def create_circuit(request: CircuitASTRequest):
    """Create new circuit from AST"""
    try:
        circuit = CircuitAST(
            name=request.name,
            description=request.description
        )

        # Add components
        for comp_data in request.components:
            comp = CircuitComponent(**comp_data)
            circuit.add_component(comp)

        # Add nets
        for net_data in request.nets:
            net = Net(**net_data)
            circuit.add_net(net)

        return {
            "success": True,
            "circuit": circuit.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/generate-code")
async def generate_code(request: CodeGenerationRequest):
    """Generate HDL/SPICE code from circuit AST"""
    try:
        # Reconstruct circuit from request
        circuit = CircuitAST.from_dict(request.circuit_ast.dict())

        result = {}

        if "verilog" in request.languages:
            gen = VerilogGenerator()
            result["verilog"] = gen.generate(circuit)

        if "spice" in request.languages:
            gen = SPICEGenerator()
            sim_params = {"type": request.sim_type or "transient"}
            result["spice"] = gen.generate(circuit, sim_params)

        if "json" in request.languages:
            result["json"] = circuit.to_json()

        return {
            "success": True,
            "code": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== CODE PARSING ENDPOINTS ====================

@app.post("/api/parse-code", response_model=CodeParseResponse)
async def parse_code(request: CodeParseRequest):
    """Parse HDL/SPICE code back to circuit AST"""
    try:
        if request.language == "verilog":
            parser = VerilogParser()
            circuit = parser.parse(request.code)
        elif request.language == "spice":
            parser = SPICEParser()
            circuit = parser.parse(request.code)
        elif request.language == "json":
            import json
            data = json.loads(request.code)
            circuit = CircuitAST.from_dict(data)
        else:
            raise ValueError(f"Unsupported language: {request.language}")

        return CodeParseResponse(
            success=True,
            circuit_ast=CircuitASTRequest(**circuit.to_dict()),
            errors=[]
        )
    except Exception as e:
        return CodeParseResponse(
            success=False,
            errors=[{"line": -1, "message": str(e)}]
        )


# ==================== CIRCUIT SYNC ENDPOINTS ====================

@app.post("/api/save-circuit")
async def save_circuit(circuit: CircuitASTRequest, change: Optional[CircuitChangeRequest] = None):
    """Save circuit and optionally apply change"""
    try:
        # Reconstruct circuit
        circuit_ast = CircuitAST.from_dict(circuit.dict())

        # Apply change if provided
        if change:
            change_data = change.dict()
            sync_manager.on_gui_change(change_data)
        else:
            sync_manager.circuit = circuit_ast

        return {
            "success": True,
            "circuit": circuit_ast.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/apply-change")
async def apply_change(change: CircuitChangeRequest):
    """Apply a change to the circuit (from GUI)"""
    try:
        sync_manager.on_gui_change(change.dict())

        return {
            "success": True,
            "verilog": sync_manager.get_verilog(),
            "spice": sync_manager.get_spice()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/validate-circuit")
async def validate_circuit(circuit: CircuitASTRequest):
    """Validate circuit for issues"""
    try:
        circuit_ast = CircuitAST.from_dict(circuit.dict())

        # Create temporary sync manager for validation
        temp_sync = CircuitSync(circuit_ast)
        validation_result = temp_sync.validate_circuit()

        return {
            "success": True,
            "validation": validation_result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== EXPORT/IMPORT ENDPOINTS ====================

@app.post("/api/export-module")
async def export_module(request: ExportModuleRequest):
    """Export circuit as reusable Verilog module"""
    try:
        circuit = CircuitAST.from_dict(request.circuit.dict())
        gen = VerilogGenerator()

        # Save original name and set module name
        original_name = circuit.name
        circuit.name = request.module_name

        code = gen.generate(circuit)

        # Restore original name
        circuit.name = original_name

        return {
            "success": True,
            "module_name": request.module_name,
            "code": code
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/import-module")
async def import_module(file: UploadFile = File(...)):
    """Import Verilog module file"""
    try:
        content = await file.read()
        code = content.decode('utf-8')

        parser = VerilogParser()
        circuit = parser.parse(code)

        return {
            "success": True,
            "circuit": circuit.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== SIMULATION PREP ====================

@app.post("/api/prepare-spice-simulation")
async def prepare_spice_simulation(
    circuit: CircuitASTRequest,
    sim_type: str = "transient",
    duration: str = "1m",
    step: str = "1u"
):
    """Prepare SPICE netlist for simulation"""
    try:
        circuit_ast = CircuitAST.from_dict(circuit.dict())

        sim_params = {
            "type": sim_type,
            "duration": duration,
            "step": step
        }

        gen = SPICEGenerator()
        netlist = gen.generate(circuit_ast, sim_params)

        return {
            "success": True,
            "netlist": netlist,
            "simulation_config": sim_params
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== TESTING ENDPOINTS ====================

@app.get("/api/test-ast")
async def test_ast():
    """Test CircuitAST with example circuit"""
    try:
        from circuit_ast import ComponentType

        # Create example circuit
        circuit = CircuitAST(name="Test Circuit")

        # Add resistor
        r1 = CircuitComponent(
            name="R1",
            type=ComponentType.RESISTOR,
            component_model="resistor"
        )
        r1.ports["1"] = Port(name="1", node="in")
        r1.ports["2"] = Port(name="2", node="out")
        r1.parameters["R"] = Parameter("R", "1k", "Ω")
        circuit.add_component(r1)

        # Add capacitor
        c1 = CircuitComponent(
            name="C1",
            type=ComponentType.CAPACITOR,
            component_model="capacitor"
        )
        c1.ports["1"] = Port(name="1", node="out")
        c1.ports["2"] = Port(name="2", node="gnd")
        c1.parameters["C"] = Parameter("C", "1u", "F")
        circuit.add_component(c1)

        # Add nets
        circuit.add_net(Net(name="in", net_type="signal"))
        circuit.add_net(Net(name="out", net_type="signal"))
        circuit.add_net(Net(name="gnd", net_type="ground"))

        # Generate code
        verilog_gen = VerilogGenerator()
        spice_gen = SPICEGenerator()

        verilog = verilog_gen.generate(circuit)
        spice = spice_gen.generate(circuit)

        return {
            "success": True,
            "circuit": circuit.to_dict(),
            "verilog": verilog,
            "spice": spice
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
