"""
Celery Tasks for Background Processing
Long-running operations that should not block API requests
"""

from celery import Task
from celery_config import celery_app
from redis_store import get_redis_store, JobStatus
import httpx
import os
from typing import Dict, Any


# Service URLs
VISION_SERVICE = os.getenv("VISION_SERVICE_URL", "http://vision:8000")
CORE_SERVICE = os.getenv("CORE_SERVICE_URL", "http://core:8000")
SIMULATOR_SERVICE = os.getenv("SIMULATOR_SERVICE_URL", "http://simulator:8000")
DOCS_SERVICE = os.getenv("DOCS_SERVICE_URL", "http://docs:8000")
SVE_SERVICE = os.getenv("SVE_SERVICE_URL", "http://sve:8000")


class JobTask(Task):
    """Base task that updates job status in Redis"""
    
    def before_start(self, task_id, args, kwargs):
        """Set job to processing before starting"""
        store = get_redis_store()
        store.set_status(task_id, JobStatus.PROCESSING)
    
    def on_success(self, retval, task_id, args, kwargs):
        """Update job with success result"""
        store = get_redis_store()
        store.set_status(task_id, JobStatus.COMPLETED, result=retval)
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Update job with error"""
        store = get_redis_store()
        store.set_status(task_id, JobStatus.FAILED, error=str(exc))


@celery_app.task(base=JobTask, bind=True, name='services.api.tasks.process_image')
def process_image(self, image_data: bytes, filename: str) -> Dict[str, Any]:
    """
    Process uploaded schematic image through Vision service
    
    Args:
        image_data: Raw image bytes
        filename: Original filename
        
    Returns:
        Detection results
    """
    try:
        with httpx.Client(timeout=60.0) as client:
            files = {"file": (filename, image_data, "image/png")}
            response = client.post(f"{VISION_SERVICE}/api/detect", files=files)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise Exception(f"Vision service error: {str(e)}")


@celery_app.task(base=JobTask, bind=True, name='services.api.tasks.generate_netlist')
def generate_netlist(self, circuit_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate SPICE netlist and Verilog HDL from circuit
    
    Args:
        circuit_data: Circuit components and connections
        
    Returns:
        Netlist and HDL code
    """
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{CORE_SERVICE}/api/generate-netlist",
                json=circuit_data
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise Exception(f"Core service error: {str(e)}")


@celery_app.task(base=JobTask, bind=True, name='services.api.tasks.run_simulation')
def run_simulation(self, netlist: str, sim_type: str = "spice", params: Dict = None) -> Dict[str, Any]:
    """
    Run circuit simulation
    
    Args:
        netlist: SPICE netlist or HDL code
        sim_type: 'spice' or 'verilog'
        params: Simulation parameters
        
    Returns:
        Simulation results with waveforms
    """
    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(
                f"{SIMULATOR_SERVICE}/api/simulate",
                json={
                    "netlist": netlist,
                    "simulation_type": sim_type,
                    "parameters": params or {}
                }
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise Exception(f"Simulator service error: {str(e)}")


@celery_app.task(base=JobTask, bind=True, name='services.api.tasks.generate_pdf')
def generate_pdf(
    self,
    circuit_data: Dict[str, Any],
    netlist: str,
    simulation_results: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Generate publication-quality PDF report
    
    Args:
        circuit_data: Circuit schematic data
        netlist: SPICE/HDL code
        simulation_results: Optional simulation waveforms
        
    Returns:
        PDF file path and metadata
    """
    try:
        with httpx.Client(timeout=180.0) as client:
            response = client.post(
                f"{DOCS_SERVICE}/api/generate",
                json={
                    "circuit": circuit_data,
                    "netlist": netlist,
                    "simulation": simulation_results
                }
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise Exception(f"Docs service error: {str(e)}")


@celery_app.task(base=JobTask, bind=True, name='services.api.tasks.generate_component_symbol')
def generate_component_symbol(
    self,
    component_type: str,
    category: str = "passive",
    style: str = "technical"
) -> Dict[str, Any]:
    """
    Generate electronic component symbol using SVE
    
    Args:
        component_type: Component name (e.g., 'resistor', 'op-amp')
        category: Component category
        style: Drawing style
        
    Returns:
        Component data with SVG content
    """
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"{SVE_SERVICE}/api/generate",
                json={
                    "component_type": component_type,
                    "category": category,
                    "style": style,
                    "force_regenerate": False
                }
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise Exception(f"SVE service error: {str(e)}")


@celery_app.task(base=JobTask, bind=True, name='services.api.tasks.batch_generate_symbols')
def batch_generate_symbols(self, component_list: list) -> Dict[str, Any]:
    """
    Batch generate multiple component symbols
    Used for database seeding
    
    Args:
        component_list: List of component specs
        
    Returns:
        Generation summary with success/failure counts
    """
    results = {
        "total": len(component_list),
        "success": 0,
        "failed": 0,
        "components": []
    }
    
    for component in component_list:
        try:
            result = generate_component_symbol.s(
                component["type"],
                component.get("category", "passive"),
                component.get("style", "technical")
            ).apply().get()
            
            results["components"].append(result)
            results["success"] += 1
            
            # Update progress in job store
            progress = (results["success"] + results["failed"]) / results["total"] * 100
            store = get_redis_store()
            store.update_job(self.request.id, {
                "progress": progress,
                "generated": results["success"]
            })
            
        except Exception as e:
            results["failed"] += 1
            results["components"].append({
                "type": component["type"],
                "error": str(e)
            })
    
    return results


@celery_app.task(name='services.api.tasks.cleanup_old_jobs')
def cleanup_old_jobs():
    """
    Periodic task to cleanup old completed jobs
    Run daily via celery beat
    """
    store = get_redis_store()
    # Redis TTL handles this automatically, but we can log stats
    stats = store.get_stats()
    print(f"Job stats: {stats}")
    return stats
