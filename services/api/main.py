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

# Import Redis job store and Celery tasks
from redis_store import get_redis_store
from tasks import (
    process_image,
    generate_netlist,
    run_simulation,
    generate_pdf,
    generate_component_symbol
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
SVE_SERVICE = os.getenv("SVE_SERVICE_URL", "http://sve:8000")

# Use Redis for job storage
USE_REDIS = os.getenv("USE_REDIS", "false").lower() == "true"
redis_store = None

# Fallback in-memory store for development
jobs_store: Dict[str, Dict[str, Any]] = {}


@app.on_event("startup")
async def startup():
    """Initialize Redis connection if enabled"""
    global redis_store
    if USE_REDIS:
        try:
            redis_store = get_redis_store()
            print("✅ Redis job store initialized")
        except Exception as e:
            print(f"⚠️ Redis connection failed, using in-memory store: {e}")
            redis_store = None


def get_job_store():
    """Get active job store (Redis or in-memory fallback)"""
    return redis_store if USE_REDIS and redis_store else None


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
    background_tasks: BackgroundTasks = None,
    use_async: bool = False
):
    """
    Upload schematic image and start detection pipeline
    
    Flow:
    1. Forward image to Vision service for detection (or dispatch to Celery)
    2. Store job info in Redis or memory
    3. Return job ID for status polling
    """
    job_id = str(uuid.uuid4())
    store = get_job_store()
    
    try:
        # Create job entry
        job_data = {
            "job_id": job_id,
            "type": "detection",
            "filename": file.filename
        }
        
        if store:
            store.create_job(job_id, job_data)
        else:
            jobs_store[job_id] = {**job_data, "status": JobStatus.PENDING, "created_at": datetime.utcnow().isoformat()}
        
        # Async processing with Celery (optional)
        if use_async and USE_REDIS:
            image_data = await file.read()
            task = process_image.apply_async(
                args=[image_data, file.filename],
                task_id=job_id
            )
            
            return UploadImageResponse(
                job_id=job_id,
                status=JobStatus.PENDING,
                message="Image processing started"
            )
        
        # Synchronous processing (default)
        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {"file": (file.filename, await file.read(), file.content_type)}
            response = await client.post(
                f"{VISION_SERVICE}/api/detect",
                files=files
            )
            response.raise_for_status()
            detection_result = response.json()
        
        # Update job with result
        if store:
            store.set_status(job_id, JobStatus.COMPLETED, result=detection_result)
        else:
            jobs_store[job_id].update({
                "status": JobStatus.COMPLETED,
                "result": detection_result
            })
        
        return UploadImageResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Image processed successfully"
        )
        
    except httpx.HTTPError as e:
        error_msg = f"Vision service error: {str(e)}"
        if store:
            store.set_status(job_id, JobStatus.FAILED, error=error_msg)
        elif job_id in jobs_store:
            jobs_store[job_id]["status"] = JobStatus.FAILED
            jobs_store[job_id]["error"] = error_msg
        raise HTTPException(status_code=500, detail=error_msg)


@app.get("/api/result/{job_id}", response_model=JobStatusResponse)
async def get_result(job_id: str):
    """
    Get job status and results
    """
    store = get_job_store()
    
    if store:
        job = store.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
    else:
        if job_id not in jobs_store:
            raise HTTPException(status_code=404, detail="Job not found")
        job = jobs_store[job_id]
    
    return JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        result=job.get("result"),
        error_message=job.get("error"),
        created_at=datetime.fromisoformat(job["created_at"]),
        completed_at=datetime.fromisoformat(job.get("completed_at", job["created_at"]))
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
        "docs": DOCS_SERVICE,
        "sve": SVE_SERVICE
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


# ============================================================================
# SVE (Synthra Vector Engine) Endpoints
# ============================================================================

@app.post("/api/sve/component/{component_type}")
async def get_or_generate_component(
    component_type: str,
    category: str = "passive",
    force_regenerate: bool = False
):
    """
    Get or generate a component symbol using SVE
    Autonomous generation - checks DB first, generates if missing
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{SVE_SERVICE}/api/generate",
                json={
                    "component_type": component_type,
                    "category": category,
                    "force_regenerate": force_regenerate
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"SVE service error: {str(e)}")


@app.get("/api/sve/component/{component_type}")
async def get_component(component_type: str):
    """Get existing component from database"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{SVE_SERVICE}/api/component/{component_type}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Component '{component_type}' not found")
            raise HTTPException(status_code=500, detail=f"SVE service error: {str(e)}")


@app.get("/api/sve/components/search")
async def search_components(query: str = "", category: Optional[str] = None, limit: int = 20):
    """Search components in database"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{SVE_SERVICE}/api/components/search",
                params={"query": query, "category": category, "limit": limit}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"SVE service error: {str(e)}")


@app.get("/api/sve/components/popular")
async def get_popular_components(limit: int = 10):
    """Get most used components"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{SVE_SERVICE}/api/components/popular",
                params={"limit": limit}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"SVE service error: {str(e)}")


@app.post("/api/sve/seed")
async def seed_components(background_tasks: BackgroundTasks):
    """Trigger database seeding with initial component library"""
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            response = await client.post(f"{SVE_SERVICE}/api/seed")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"SVE service error: {str(e)}")


@app.get("/api/sve/stats")
async def get_sve_stats():
    """Get SVE database statistics"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{SVE_SERVICE}/api/stats")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"SVE service error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
