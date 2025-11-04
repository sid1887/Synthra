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
    # TODO: Implement PDF generation with LaTeX
    # See detailed implementation in next phase
    
    return ReportResult(
        job_id="pdf_" + str(id(request)),
        pdf_path="/reports/placeholder.pdf",
        file_size_bytes=0,
        success=False,
        compilation_logs="PDF generation not implemented yet"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
