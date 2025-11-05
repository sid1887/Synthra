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
    try:
        from netlist_generator import generate_spice_netlist
        
        # Convert circuit to component/net format
        components = circuit.components if hasattr(circuit, 'components') else []
        nets = circuit.nodes if hasattr(circuit, 'nodes') else {}
        
        # Generate netlist
        netlist_content = generate_spice_netlist(
            components=components,
            nets=nets,
            title=circuit.name if hasattr(circuit, 'name') else "Synthra Circuit"
        )
        
        return Netlist(
            format="spice",
            content=netlist_content,
            components_count=len(components),
            nets_count=len(nets)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Netlist generation failed: {str(e)}")


@app.post("/api/generate-hdl", response_model=HDLModule)
async def generate_hdl(circuit: Circuit):
    """Generate Verilog/SystemVerilog from circuit"""
    try:
        from hdl_generator import generate_verilog, generate_testbench
        
        # Convert circuit to component/net format
        components = circuit.components if hasattr(circuit, 'components') else []
        nets = circuit.nodes if hasattr(circuit, 'nodes') else {}
        module_name = circuit.name if hasattr(circuit, 'name') else "circuit_top"
        
        # Generate structural HDL
        hdl_content = generate_verilog(
            components=components,
            nets=nets,
            module_name=module_name,
            structural=True
        )
        
        return HDLModule(
            module_name=module_name,
            language="systemverilog",
            content=hdl_content
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HDL generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
