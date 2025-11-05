"""
Synthra Simulator Service
Runs SPICE (ngspice, Xyce) and HDL (Verilator, Icarus) simulations
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys

sys.path.append('/shared')
from schemas import SimulateRequest, SimulationResult, HealthCheckResponse

app = FastAPI(title="Synthra Simulator Service", version="1.0.0")

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
        service="simulator",
        status="healthy",
        version="1.0.0",
        details={
            "ngspice": "available",
            "verilator": "available"
        }
    )


@app.post("/api/simulate", response_model=SimulationResult)
async def simulate(request: SimulateRequest):
    """Run circuit simulation"""
    try:
        import time
        start_time = time.time()
        
        simulator_type = request.parameters.simulator.lower()
        
        if simulator_type in ['ngspice', 'xyce', 'spice']:
            # SPICE simulation
            from spice_runner import run_spice_simulation
            
            # Extract netlist from request
            netlist = request.parameters.netlist if hasattr(request.parameters, 'netlist') else ""
            
            result = run_spice_simulation(
                netlist=netlist,
                simulator=simulator_type,
                timeout=60
            )
            
            runtime_ms = int((time.time() - start_time) * 1000)
            
            return SimulationResult(
                job_id="sim_" + str(id(request)),
                circuit_id=request.circuit_id or "unknown",
                simulator=simulator_type,
                simulation_type=request.parameters.simulation_type,
                success=result['success'],
                logs=result['log'],
                waveforms=result.get('waveforms'),
                errors=result.get('errors'),
                runtime_ms=runtime_ms
            )
        
        elif simulator_type in ['verilator', 'icarus', 'iverilog']:
            # HDL simulation
            from hdl_runner import run_hdl_simulation
            
            # Extract HDL files from request
            hdl_files = request.parameters.hdl_files if hasattr(request.parameters, 'hdl_files') else []
            testbench = request.parameters.testbench if hasattr(request.parameters, 'testbench') else ""
            
            result = run_hdl_simulation(
                hdl_files=hdl_files,
                testbench=testbench,
                simulator='iverilog' if simulator_type in ['icarus', 'iverilog'] else 'verilator',
                timeout=60
            )
            
            runtime_ms = int((time.time() - start_time) * 1000)
            
            return SimulationResult(
                job_id="sim_" + str(id(request)),
                circuit_id=request.circuit_id or "unknown",
                simulator=simulator_type,
                simulation_type=request.parameters.simulation_type,
                success=result['success'],
                logs=result['log'],
                vcd_file=result.get('vcd_file'),
                errors=result.get('errors'),
                runtime_ms=runtime_ms
            )
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown simulator: {simulator_type}")
    
    except Exception as e:
        return SimulationResult(
            job_id="sim_" + str(id(request)),
            circuit_id=request.circuit_id or "unknown",
            simulator=request.parameters.simulator,
            simulation_type=request.parameters.simulation_type,
            success=False,
            logs=f"Simulation error: {str(e)}",
            errors=[str(e)],
            runtime_ms=0
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
