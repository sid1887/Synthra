# Synthra Build Script (PowerShell)
# Builds all Docker containers for the Synthra platform

Write-Host "🔨 Building Synthra Platform..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Check Docker is running
try {
    docker info | Out-Null
}
catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker is running" -ForegroundColor Green

# Build using docker-compose
Write-Host ""
Write-Host "Building all services..." -ForegroundColor Yellow
Write-Host ""

docker-compose build --parallel

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\run.ps1" -ForegroundColor White
    Write-Host "  2. Access frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "  3. API docs: http://localhost:8000/docs" -ForegroundColor White
}
else {
    Write-Host ""
    Write-Host "❌ Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
