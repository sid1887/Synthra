# Synthra Run Script (PowerShell)
# Starts all Synthra services using Docker Compose

Write-Host "🚀 Starting Synthra Platform..." -ForegroundColor Cyan
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

# Start services
Write-Host ""
Write-Host "Starting all services..." -ForegroundColor Yellow
Write-Host ""

docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access Points:" -ForegroundColor Cyan
    Write-Host "  Frontend:          http://localhost:3000" -ForegroundColor White
    Write-Host "  API Gateway:       http://localhost:8000" -ForegroundColor White
    Write-Host "  API Docs:          http://localhost:8000/docs" -ForegroundColor White
    Write-Host "  Vision Service:    http://localhost:8001" -ForegroundColor White
    Write-Host "  Core Service:      http://localhost:8002" -ForegroundColor White
    Write-Host "  Simulator Service: http://localhost:8003" -ForegroundColor White
    Write-Host "  Docs Service:      http://localhost:8004" -ForegroundColor White
    Write-Host "  SVE Service (AI):  http://localhost:8005" -ForegroundColor Magenta
    Write-Host "  Real-Time (WS):    http://localhost:8006" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 View logs:" -ForegroundColor Cyan
    Write-Host "  docker-compose logs -f" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🛑 Stop services:" -ForegroundColor Cyan
    Write-Host "  docker-compose down" -ForegroundColor Gray
}
else {
    Write-Host ""
    Write-Host "❌ Failed to start services (exit code: $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}
