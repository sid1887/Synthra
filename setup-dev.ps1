# Synthra Development Setup Script (PowerShell)
# Sets up local Python environment for development

Write-Host "🔧 Setting up Synthra Development Environment..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow

# Create virtual environment
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Activate venv
& .\venv\Scripts\Activate.ps1

# Install dependencies for each service
$services = @("vision", "core", "simulator", "docs", "api")

foreach ($service in $services) {
    Write-Host ""
    Write-Host "Installing dependencies for $service..." -ForegroundColor Cyan
    
    $reqFile = "services\$service\requirements.txt"
    
    if (Test-Path $reqFile) {
        pip install -r $reqFile
    }
}

Write-Host ""
Write-Host "📦 Installing Frontend dependencies..." -ForegroundColor Yellow
cd frontend
npm install
cd ..

Write-Host ""
Write-Host "✅ Development environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To activate the virtual environment:" -ForegroundColor Cyan
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host ""
Write-Host "To run a service locally (example):" -ForegroundColor Cyan
Write-Host "  cd services\vision" -ForegroundColor White
Write-Host "  python main.py" -ForegroundColor White
