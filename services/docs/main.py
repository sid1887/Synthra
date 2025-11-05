"""
Synthra Docs Service
Advanced PDF report generation with LaTeX
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import sys

sys.path.append('/shared')
from schemas import GeneratePDFRequest, ReportResult, HealthCheckResponse

app = FastAPI(title="Synthra Docs Service", version="1.0.0")

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
        service="docs",
        status="healthy",
        version="1.0.0",
        details={
            "latex": "available"
        }
    )


@app.post("/api/generate", response_model=ReportResult)
async def generate_pdf(request: GeneratePDFRequest):
    """Generate publication-quality PDF report"""
    try:
        from pdf_generator import generate_pdf as gen_pdf
        import tempfile
        from pathlib import Path
        
        # Generate PDF
        pdf_bytes = gen_pdf(
            title=request.title,
            components=request.components,
            netlist=request.netlist,
            schematic_svg=request.schematic_path if hasattr(request, 'schematic_path') else None,
            hdl_content=request.hdl_code if hasattr(request, 'hdl_code') else None,
            waveforms=request.waveforms if hasattr(request, 'waveforms') else None,
            summary=request.summary if hasattr(request, 'summary') else None,
            analysis=request.analysis if hasattr(request, 'analysis') else None,
            metadata=request.metadata if hasattr(request, 'metadata') else None
        )
        
        # Save PDF to temp file
        # In production, save to persistent storage or cloud
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(pdf_bytes)
            pdf_path = tmp.name
        
        return ReportResult(
            job_id="pdf_" + str(id(request)),
            pdf_path=pdf_path,
            file_size_bytes=len(pdf_bytes),
            success=True,
            compilation_logs="PDF generated successfully"
        )
    
    except Exception as e:
        return ReportResult(
            job_id="pdf_" + str(id(request)),
            pdf_path="",
            file_size_bytes=0,
            success=False,
            compilation_logs=f"PDF generation failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
