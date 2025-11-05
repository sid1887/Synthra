"""
SVE (Synthra Vector Engine) Service
AI-powered autonomous component symbol generation
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os

# Add shared schemas if available
try:
    sys.path.append('/shared')
    from schemas import HealthCheckResponse
except ImportError:
    # Fallback if shared schemas not available
    class HealthCheckResponse(BaseModel):
        status: str
        service: str

from generator import SVECore

app = FastAPI(
    title="Synthra Vector Engine",
    version="1.0.0",
    description="AI-powered component symbol generation service"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SVE Core
DB_URL = os.getenv("DATABASE_URL", "postgresql://synthra:synthra@db:5432/synthra")
sve_core = SVECore(DB_URL)


@app.on_event("startup")
async def startup():
    """Initialize SVE on startup"""
    await sve_core.initialize()
    print("✅ SVE Service ready")


# Request/Response Models
class ComponentRequest(BaseModel):
    component_type: str
    category: str = "passive"
    style: str = "IEEE"
    pins: Optional[int] = None
    force_regenerate: bool = False
    details: str = ""


class ComponentResponse(BaseModel):
    component_type: str
    svg_content: str
    category: str
    quality_score: float
    cached: bool


class SeedRequest(BaseModel):
    components: List[Dict[str, Any]]


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    return HealthCheckResponse(
        service="sve",
        status="healthy",
        version="1.0.0",
        details={"ai_model": "SDXL-Turbo", "vectorizer": "potrace"}
    )


@app.post("/api/generate", response_model=ComponentResponse)
async def generate_component(request: ComponentRequest):
    """
    Get or generate a component symbol
    
    This endpoint automatically checks the database first,
    and only generates if the component doesn't exist
    """
    try:
        result = await sve_core.get_or_generate_component(
            component_type=request.component_type,
            category=request.category,
            force_regenerate=request.force_regenerate,
            style=request.style,
            num_pins=request.pins,
            additional_details=request.details
        )
        
        return ComponentResponse(
            component_type=result['component_type'],
            svg_content=result['svg_content'],
            category=result['category'],
            quality_score=result.get('quality_score', 0.0),
            cached=not request.force_regenerate
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.get("/api/component/{component_type}")
async def get_component(component_type: str):
    """Retrieve existing component from database"""
    try:
        component = await sve_core.db.get_component(component_type)
        
        if not component:
            raise HTTPException(status_code=404, detail="Component not found")
        
        return component
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/components/search")
async def search_components(q: str, category: Optional[str] = None):
    """Search for components"""
    try:
        results = await sve_core.db.search_components(q, category)
        return {"results": results, "count": len(results)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/components/popular")
async def get_popular_components(limit: int = 50):
    """Get most used components"""
    try:
        components = await sve_core.db.get_popular_components(limit)
        return {"components": components, "count": len(components)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/seed")
async def seed_database(request: SeedRequest, background_tasks: BackgroundTasks):
    """
    Seed database with initial component library
    This runs in background as it takes time
    """
    background_tasks.add_task(sve_core.seed_database, request.components)
    
    return {
        "message": "Seeding started",
        "components_count": len(request.components)
    }


@app.delete("/api/component/{component_type}")
async def delete_component(component_type: str):
    """Delete a component (for regeneration)"""
    try:
        async with sve_core.db.pool.acquire() as conn:
            await conn.execute(
                'DELETE FROM components WHERE component_type = $1',
                component_type
            )
        
        return {"message": f"Deleted {component_type}"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/components")
async def list_components(
    category: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """List all components with optional filtering"""
    try:
        async with sve_core.db.pool.acquire() as conn:
            if category:
                query = '''
                    SELECT * FROM components 
                    WHERE category = $1 
                    ORDER BY usage_count DESC, component_type
                    LIMIT $2 OFFSET $3
                '''
                rows = await conn.fetch(query, category, limit, offset)
            else:
                query = '''
                    SELECT * FROM components 
                    ORDER BY usage_count DESC, component_type
                    LIMIT $1 OFFSET $2
                '''
                rows = await conn.fetch(query, limit, offset)
            
            components = [dict(row) for row in rows]
            return components
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/components/{component_id}")
async def get_component_by_id(component_id: str):
    """Get component by UUID"""
    try:
        async with sve_core.db.pool.acquire() as conn:
            row = await conn.fetchrow(
                'SELECT * FROM components WHERE id = $1',
                component_id
            )
            
            if not row:
                raise HTTPException(status_code=404, detail="Component not found")
            
            return dict(row)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/components/{component_id}")
async def delete_component_by_id(component_id: str):
    """Delete component by UUID"""
    try:
        async with sve_core.db.pool.acquire() as conn:
            result = await conn.execute(
                'DELETE FROM components WHERE id = $1',
                component_id
            )
            
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Component not found")
            
            return {"message": "Component deleted", "id": component_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/components/export")
async def export_components():
    """Export all components as JSON"""
    try:
        async with sve_core.db.pool.acquire() as conn:
            rows = await conn.fetch('SELECT * FROM components ORDER BY component_type')
            components = [dict(row) for row in rows]
            
            return {
                "components": components,
                "count": len(components),
                "exported_at": __import__('datetime').datetime.utcnow().isoformat()
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats")
async def get_stats():
    """Get SVE statistics"""
    try:
        async with sve_core.db.pool.acquire() as conn:
            total_components = await conn.fetchval('SELECT COUNT(*) FROM components')
            total_usage = await conn.fetchval('SELECT SUM(usage_count) FROM components')
            avg_quality = await conn.fetchval('SELECT AVG(quality_score) FROM components')
            
            categories = await conn.fetch(
                'SELECT category, COUNT(*) as count FROM components GROUP BY category'
            )
            
            # Convert to dict for easier JSON serialization
            categories_dict = {row['category']: row['count'] for row in categories}
        
        return {
            "total_components": total_components or 0,
            "total_usage": total_usage or 0,
            "avg_quality": float(avg_quality or 0.0),
            "categories": categories_dict
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
