"""
Synthra API Gateway
Orchestrates all microservices and provides unified REST API
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import os
import sys
import uuid
from datetime import datetime

# Add shared module to path
sys.path.append('/shared')
from schemas import (
    JobStatus, UploadImageResponse, JobStatusResponse,
    AcceptEditsRequest, SimulateRequest, GeneratePDFRequest,
    HealthCheckResponse
)

app = FastAPI(
    title="Synthra API Gateway",
    version="1.0.0",
    description="AI-driven Electronic Design Automation Platform"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs from environment
VISION_SERVICE = os.getenv("VISION_SERVICE_URL", "http://vision:8000")
CORE_SERVICE = os.getenv("CORE_SERVICE_URL", "http://core:8000")
SIMULATOR_SERVICE = os.getenv("SIMULATOR_SERVICE_URL", "http://simulator:8000")
DOCS_SERVICE = os.getenv("DOCS_SERVICE_URL", "http://docs:8000")

# In-memory job store (replace with Redis/DB in production)
jobs_store: Dict[str, Dict[str, Any]] = {}


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    return HealthCheckResponse(
        service="api-gateway",
        status="healthy",
        version="1.0.0"
    )


@app.post("/api/upload-image", response_model=UploadImageResponse)
async def upload_image(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Upload schematic image and start detection pipeline
    
    Flow:
    1. Forward image to Vision service for detection
    2. Store job info
    3. Return job ID for status polling
    """
    job_id = str(uuid.uuid4())
    
    try:
        # Forward to Vision service
        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {"file": (file.filename, await file.read(), file.content_type)}
            response = await client.post(
                f"{VISION_SERVICE}/api/detect",
                files=files
            )
            response.raise_for_status()
            detection_result = response.json()
        
        # Store job
        jobs_store[job_id] = {
            "job_id": job_id,
            "status": JobStatus.COMPLETED,
            "type": "detection",
            "result": detection_result,
            "created_at": datetime.utcnow().isoformat()
        }
        
        return UploadImageResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Image processed successfully"
        )
        
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Vision service error: {str(e)}")


@app.get("/api/result/{job_id}", response_model=JobStatusResponse)
async def get_result(job_id: str):
    """
    Get job status and results
    """
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_store[job_id]
    
    return JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        result=job.get("result"),
        error_message=job.get("error"),
        created_at=datetime.fromisoformat(job["created_at"]),
        completed_at=datetime.fromisoformat(job["created_at"])  # Same for now
    )


@app.post("/api/accept-edits/{job_id}")
async def accept_edits(job_id: str, request: AcceptEditsRequest):
    """
    Accept user corrections to detected circuit
    Then generate netlist and HDL
    """
    try:
        # Forward to Core service for netlist/HDL generation
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{CORE_SERVICE}/api/generate-netlist",
                json=request.corrected_circuit.model_dump()
            )
            response.raise_for_status()
            result = response.json()
        
        # Update job
        if job_id in jobs_store:
            jobs_store[job_id]["result"]["netlist"] = result
            jobs_store[job_id]["status"] = JobStatus.COMPLETED
        
        return {
            "job_id": job_id,
            "status": "netlist_generated",
            "netlist": result
        }
        
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Core service error: {str(e)}")


@app.post("/api/simulate")
async def simulate(request: SimulateRequest):
    """
    Run circuit simulation
    """
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{SIMULATOR_SERVICE}/api/simulate",
                json=request.model_dump()
            )
            response.raise_for_status()
            result = response.json()
        
        # Store simulation result
        sim_job_id = str(uuid.uuid4())
        jobs_store[sim_job_id] = {
            "job_id": sim_job_id,
            "status": JobStatus.COMPLETED,
            "type": "simulation",
            "result": result,
            "created_at": datetime.utcnow().isoformat()
        }
        
        return result
        
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Simulator service error: {str(e)}")


@app.post("/api/generate-pdf")
async def generate_pdf(request: GeneratePDFRequest):
    """
    Generate publication-quality PDF report
    """
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                f"{DOCS_SERVICE}/api/generate",
                json=request.model_dump()
            )
            response.raise_for_status()
            result = response.json()
        
        return result
        
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Docs service error: {str(e)}")


@app.get("/api/download/{artifact_id}")
async def download_artifact(artifact_id: str):
    """
    Download generated artifacts (PDF, SVG, netlist, etc.)
    """
    # TODO: Implement artifact storage and retrieval
    # For now, return placeholder
    raise HTTPException(status_code=501, detail="Download not implemented yet")


@app.get("/api/services/status")
async def services_status():
    """
    Check status of all microservices
    """
    services = {
        "vision": VISION_SERVICE,
        "core": CORE_SERVICE,
        "simulator": SIMULATOR_SERVICE,
        "docs": DOCS_SERVICE
    }
    
    status = {}
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        for name, url in services.items():
            try:
                response = await client.get(f"{url}/health")
                status[name] = response.json()
            except:
                status[name] = {"status": "unhealthy"}
    
    return status


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
