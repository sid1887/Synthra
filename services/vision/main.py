"""
Synthra Vision Service
Image preprocessing, component detection, OCR, and wire tracing
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import os
import sys

# Add shared module to path
sys.path.append('/shared')
from schemas import (
    DetectionResult, DetectedComponent, WireSegment,
    HealthCheckResponse, ComponentType
)

from preprocessing import preprocess_image
from detection import ComponentDetector
from ocr import extract_text_values
from wire_tracer import trace_wires


app = FastAPI(title="Synthra Vision Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detector
detector = ComponentDetector(model_path=os.getenv("MODEL_PATH", "/models/yolov8_circuit.pt"))


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    return HealthCheckResponse(
        service="vision",
        status="healthy",
        version="1.0.0",
        details={
            "model_loaded": detector.is_loaded(),
            "upload_dir": os.getenv("UPLOAD_DIR", "/uploads")
        }
    )


@app.post("/api/detect", response_model=DetectionResult)
async def detect_components(
    file: UploadFile = File(...),
    preprocessing: Optional[Dict[str, Any]] = None
):
    """
    Detect components and wires from uploaded schematic image
    
    Steps:
    1. Preprocess image (deskew, denoise, threshold)
    2. Detect components using YOLOv8
    3. Extract text/values using OCR
    4. Trace wire paths
    """
    start_time = datetime.utcnow()
    job_id = str(uuid.uuid4())
    
    # Save uploaded file
    upload_dir = os.getenv("UPLOAD_DIR", "/uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, f"{job_id}_{file.filename}")
    
    try:
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Step 1: Preprocess
        preprocessed_image, preprocessing_steps = preprocess_image(
            file_path,
            options=preprocessing or {}
        )
        
        # Step 2: Detect components
        detected_components = detector.detect(preprocessed_image)
        
        # Step 2.5: Autonomous SVE invocation for low-confidence/unknown components
        sve_enriched_components = []
        for component in detected_components:
            # Check if SVE assistance needed
            sve_result = await detector.generate_missing_symbol_via_sve(
                component.component_type,
                component.confidence
            )
            
            # Enrich component with SVE-generated symbol if available
            if sve_result and sve_result.get("status") == "success":
                # Store SVE metadata in component for later use
                if not hasattr(component, 'metadata'):
                    component.metadata = {}
                component.metadata['sve_symbol'] = sve_result.get('svg_content')
                component.metadata['sve_quality'] = sve_result.get('quality_score', 0.0)
                component.metadata['sve_cached'] = sve_result.get('from_cache', False)
                print(f"  ✓ Component enriched with SVE symbol: {component.component_type}")
            
            sve_enriched_components.append(component)
        
        # Step 3: OCR for values
        components_with_text = extract_text_values(
            preprocessed_image,
            sve_enriched_components
        )
        
        # Step 4: Wire tracing
        wires = trace_wires(preprocessed_image, components_with_text)
        
        # Calculate processing time
        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Calculate overall confidence
        if components_with_text:
            overall_confidence = sum(c.confidence for c in components_with_text) / len(components_with_text)
        else:
            overall_confidence = 0.0
        
        # Build result
        result = DetectionResult(
            job_id=job_id,
            image_path=file_path,
            components=components_with_text,
            wires=wires,
            image_size=(preprocessed_image.shape[1], preprocessed_image.shape[0]),
            preprocessing_applied=preprocessing_steps,
            overall_confidence=overall_confidence,
            processing_time_ms=processing_time
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@app.post("/api/refine")
async def refine_detection(
    job_id: str,
    corrections: Dict[str, Any]
):
    """
    Apply user corrections to detection results
    Used for active learning loop
    """
    # TODO: Implement correction logic and save to training dataset
    return {
        "job_id": job_id,
        "status": "corrections_applied",
        "message": "Corrections saved for retraining"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
