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
    # TODO: Implement simulation execution
    # See detailed implementation in next phase
    
    return SimulationResult(
        job_id="sim_" + str(id(request)),
        circuit_id=request.circuit_id or "unknown",
        simulator=request.parameters.simulator,
        simulation_type=request.parameters.simulation_type,
        success=False,
        logs="Simulation not implemented yet",
        runtime_ms=0
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
