"""
Synthra Core Service
Netlist generation (SPICE, EDIF, KiCad) and HDL generation (Verilog/SystemVerilog)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys

sys.path.append('/shared')
from schemas import Circuit, Netlist, HDLModule, HealthCheckResponse

app = FastAPI(title="Synthra Core Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    return HealthCheckResponse(
        service="core",
        status="healthy",
        version="1.0.0"
    )


@app.post("/api/generate-netlist", response_model=Netlist)
async def generate_netlist(circuit: Circuit):
    """Generate SPICE netlist from circuit topology"""
    # TODO: Implement netlist generation
    # See detailed implementation in next phase
    return Netlist(
        format="spice",
        content="* Generated netlist\n.end",
        components_count=len(circuit.components),
        nets_count=len(circuit.nodes)
    )


@app.post("/api/generate-hdl", response_model=HDLModule)
async def generate_hdl(circuit: Circuit):
    """Generate Verilog/SystemVerilog from circuit"""
    # TODO: Implement HDL generation
    return HDLModule(
        module_name=circuit.name,
        language="verilog",
        content="// Generated Verilog\nmodule top();\nendmodule"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
