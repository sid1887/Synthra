# Synthra Deployment Script
# Complete deployment workflow with validation and setup

param(
    [switch]$SkipBuild,
    [switch]$SeedDatabase,
    [switch]$DevMode,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🚀 Synthra Platform Deployment" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

function Write-Step {
    param($Number, $Title)
    Write-Host ""
    Write-Host "Step $Number : $Title" -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Yellow
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# Step 1: Validate Prerequisites
Write-Step 1 "Validating Prerequisites"

# Check Docker
try {
    docker info | Out-Null
    Write-Success "Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop."
    exit 1
}

# Check docker-compose
try {
    docker-compose version | Out-Null
    Write-Success "docker-compose is available"
} catch {
    Write-Error "docker-compose not found. Please install it."
    exit 1
}

# Check Node.js (for frontend)
try {
    node --version | Out-Null
    Write-Success "Node.js is installed"
} catch {
    Write-Warning "Node.js not found. Frontend build may fail."
}

# Step 2: Environment Configuration
Write-Step 2 "Environment Configuration"

# Check frontend .env
if (Test-Path "frontend\.env") {
    Write-Success "Frontend .env file exists"
} else {
    Write-Warning "Creating frontend .env file..."
    $envContent = @"
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SVE_URL=http://localhost:8005
REACT_APP_REALTIME_URL=http://localhost:8006
"@
    $envContent | Out-File -FilePath "frontend\.env" -Encoding UTF8
    Write-Success "Frontend .env created"
}

# Check if using Redis
if ($env:USE_REDIS -eq "true") {
    Write-Info "Redis job queue enabled"
    if (-not $env:REDIS_URL) {
        Write-Warning "REDIS_URL not set, using default: redis://localhost:6379"
    }
}

# Step 3: Build Services
Write-Step 3 "Building Docker Images"

if ($SkipBuild) {
    Write-Warning "Skipping build (skip build flag)"
} else {
    Write-Info "Building all services (this may take 10-15 minutes)..."
    Write-Host ""
    
    if ($Verbose) {
        docker-compose build
    } else {
        docker-compose build 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "All services built successfully"
    } else {
        Write-Error "Build failed with exit code: $LASTEXITCODE"
        exit 1
    }
}

# Step 4: Start Services
Write-Step 4 "Starting Services"

Write-Info "Starting Docker Compose stack..."
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Success "All services started"
} else {
    Write-Error "Failed to start services"
    exit 1
}

# Wait for services to be healthy
Write-Host ""
Write-Info "Waiting for services to become healthy (30s)..."
Start-Sleep -Seconds 30

# Step 5: Health Checks
Write-Step 5 "Health Checks"

$services = @{
    "API Gateway" = "http://localhost:8000/health"
    "Vision" = "http://localhost:8001/health"
    "Core" = "http://localhost:8002/health"
    "Simulator" = "http://localhost:8003/health"
    "Docs" = "http://localhost:8004/health"
    "SVE" = "http://localhost:8005/health"
    "Real-Time" = "http://localhost:8006/health"
}

$allHealthy = $true

foreach ($service in $services.GetEnumerator()) {
    try {
        $response = Invoke-RestMethod -Uri $service.Value -Method Get -TimeoutSec 5
        Write-Success "$($service.Key) is healthy"
    } catch {
        Write-Error "$($service.Key) is not responding"
        $allHealthy = $false
    }
}

if (-not $allHealthy) {
    Write-Warning "Some services are not healthy. Check logs with: docker-compose logs"
}

# Step 6: Database Seeding (Optional)
if ($SeedDatabase) {
    Write-Step 6 "Seeding Database"
    
    Write-Info "This will generate many component symbols (GPU: 15-30 min, CPU: 2-4 hours)"
    Write-Host ""
    
    $confirm = Read-Host "Do you want to continue? (y/N)"
    
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-Info "Starting database seed..."
        docker exec -it synthra-sve python seed.py seed
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database seeded successfully"
        } else {
            Write-Warning "Seeding failed or was interrupted"
        }
    } else {
        Write-Info "Skipping database seed. You can run it later with:"
        Write-Host "  docker exec -it synthra-sve python seed.py seed" -ForegroundColor White
    }
}

# Step 7: Frontend Setup
Write-Step 7 "Frontend Setup"

if ($DevMode) {
    Write-Info "Installing frontend dependencies..."
    Push-Location frontend
    
    try {
        if ($Verbose) {
            npm install
        } else {
            npm install 2>&1 | Out-Null
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend dependencies installed"
            Write-Info "Starting frontend development server..."
            Write-Host ""
            Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
            Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
            Write-Host ""
            npm start
        } else {
            Write-Error "npm install failed"
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Info "Frontend is running in Docker container"
    Write-Success "Frontend available at: http://localhost:3000"
}

# Final Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services Running:" -ForegroundColor Cyan
Write-Host "  [*] Frontend:        http://localhost:3000" -ForegroundColor White
Write-Host "  [*] API Gateway:     http://localhost:8000" -ForegroundColor White
Write-Host "  [*] API Docs:        http://localhost:8000/docs" -ForegroundColor White
Write-Host "  [*] SVE Admin:       http://localhost:3000/admin/sve" -ForegroundColor White
Write-Host "  [*] Vision Service:  http://localhost:8001" -ForegroundColor White
Write-Host "  [*] Core Service:    http://localhost:8002" -ForegroundColor White
Write-Host "  [*] Simulator:       http://localhost:8003" -ForegroundColor White
Write-Host "  [*] Docs Service:    http://localhost:8004" -ForegroundColor White
Write-Host "  [*] SVE Service:     http://localhost:8005" -ForegroundColor White
Write-Host "  [*] Real-Time:       http://localhost:8006" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs:          docker-compose logs -f [service]" -ForegroundColor White
Write-Host "  Stop services:      docker-compose down" -ForegroundColor White
Write-Host "  Restart service:    docker-compose restart [service]" -ForegroundColor White
Write-Host "  Seed database:      docker exec -it synthra-sve python seed.py seed" -ForegroundColor White
Write-Host "  List components:    docker exec -it synthra-sve python seed.py list" -ForegroundColor White
Write-Host ""

if (-not $SeedDatabase) {
    Write-Warning "Database not seeded. Component palette will be empty."
    Write-Host "Run: docker exec -it synthra-sve python seed.py seed" -ForegroundColor Yellow
}

Write-Host ""
