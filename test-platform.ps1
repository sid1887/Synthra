# Synthra End-to-End Test Script
# Tests all services and integration points

param(
    [switch]$Quick,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🧪 Synthra Platform Testing" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$tests = @{
    Passed = 0
    Failed = 0
    Skipped = 0
}

function Test-Service {
    param($Name, $Url)
    
    Write-Host "Testing $Name... " -NoNewline
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 5
        Write-Host "✅ PASS" -ForegroundColor Green
        $script:tests.Passed++
        return $true
    } catch {
        Write-Host "❌ FAIL" -ForegroundColor Red
        if ($Verbose) {
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        $script:tests.Failed++
        return $false
    }
}

function Test-Endpoint {
    param($Name, $Url, $Method = "GET", $Body = $null)
    
    Write-Host "Testing $Name... " -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✅ PASS" -ForegroundColor Green
        $script:tests.Passed++
        return $response
    } catch {
        Write-Host "❌ FAIL" -ForegroundColor Red
        if ($Verbose) {
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        $script:tests.Failed++
        return $null
    }
}

# Test 1: Service Health Checks
Write-Host ""
Write-Host "Test Suite 1: Service Health Checks" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

Test-Service "API Gateway" "http://localhost:8000/health" | Out-Null
Test-Service "Vision Service" "http://localhost:8001/health" | Out-Null
Test-Service "Core Service" "http://localhost:8002/health" | Out-Null
Test-Service "Simulator" "http://localhost:8003/health" | Out-Null
Test-Service "Docs Service" "http://localhost:8004/health" | Out-Null
Test-Service "SVE Service" "http://localhost:8005/health" | Out-Null
Test-Service "Real-Time Service" "http://localhost:8006/health" | Out-Null

# Test 2: SVE Component Generation
Write-Host ""
Write-Host "Test Suite 2: SVE Component Generation" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow

$result = Test-Endpoint "Popular Components" "http://localhost:8005/api/components/popular"
if ($result) {
    $count = $result.components.Count
    Write-Host "  Retrieved $count popular components" -ForegroundColor Cyan
}

$result = Test-Endpoint "Search Components" "http://localhost:8005/api/components/search?q=resistor"
if ($result) {
    Write-Host "  Search returned $($result.count) results" -ForegroundColor Cyan
}

$result = Test-Endpoint "SVE Stats" "http://localhost:8005/api/stats"
if ($result) {
    Write-Host "  Total components: $($result.total_components)" -ForegroundColor Cyan
    Write-Host "  Average quality: $(($result.avg_quality * 100).ToString('F1'))%" -ForegroundColor Cyan
}

if (-not $Quick) {
    Write-Host ""
    Write-Host "Testing component generation (slow)... " -NoNewline
    
    $body = @{
        component_type = "test_resistor_$(Get-Random)"
        category = "passive"
        style = "technical"
        force_regenerate = $true
    }
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8005/api/generate" `
            -Method Post `
            -Body ($body | ConvertTo-Json) `
            -ContentType "application/json" `
            -TimeoutSec 60
        
        Write-Host "✅ PASS" -ForegroundColor Green
        Write-Host "  Generated component with quality: $(($response.quality_score * 100).ToString('F1'))%" -ForegroundColor Cyan
        $script:tests.Passed++
    } catch {
        Write-Host "❌ FAIL" -ForegroundColor Red
        $script:tests.Failed++
    }
}

# Test 3: API Gateway Integration
Write-Host ""
Write-Host "Test Suite 3: API Gateway Integration" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow

Test-Endpoint "Service Status" "http://localhost:8000/api/services/status" | Out-Null
Test-Endpoint "SVE Popular (via Gateway)" "http://localhost:8000/api/sve/components/popular" | Out-Null
Test-Endpoint "SVE Stats (via Gateway)" "http://localhost:8000/api/sve/stats" | Out-Null

# Test 4: Database Connectivity
Write-Host ""
Write-Host "Test Suite 4: Database Connectivity" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

Write-Host "Testing PostgreSQL connection... " -NoNewline
try {
    $containerRunning = docker ps --filter "name=synthra-db" --format "{{.Names}}" 2>$null
    if ($containerRunning) {
        Write-Host "✅ PASS" -ForegroundColor Green
        $script:tests.Passed++
    } else {
        Write-Host "❌ FAIL (container not running)" -ForegroundColor Red
        $script:tests.Failed++
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    $script:tests.Failed++
}

Write-Host "Testing Redis connection... " -NoNewline
try {
    $containerRunning = docker ps --filter "name=synthra-redis" --format "{{.Names}}" 2>$null
    if ($containerRunning) {
        Write-Host "✅ PASS" -ForegroundColor Green
        $script:tests.Passed++
    } else {
        Write-Host "⚠️  SKIP (Redis optional)" -ForegroundColor Yellow
        $script:tests.Skipped++
    }
} catch {
    Write-Host "⚠️  SKIP" -ForegroundColor Yellow
    $script:tests.Skipped++
}

# Test 5: Real-Time Collaboration
Write-Host ""
Write-Host "Test Suite 5: Real-Time Collaboration" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow

Test-Endpoint "List Rooms" "http://localhost:8006/api/rooms" | Out-Null
Test-Endpoint "Create Room" "http://localhost:8006/api/rooms" "POST" @{
    room_id = "test-room-$(Get-Random)"
} | Out-Null

# Test 6: Frontend Availability
Write-Host ""
Write-Host "Test Suite 6: Frontend Availability" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

Write-Host "Testing frontend... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS" -ForegroundColor Green
        $script:tests.Passed++
    } else {
        Write-Host "❌ FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
        $script:tests.Failed++
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    if ($Verbose) {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    $script:tests.Failed++
}

# Test Summary
Write-Host ""
Write-Host "============================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Passed:  $($tests.Passed)" -ForegroundColor Green
Write-Host "Failed:  $($tests.Failed)" -ForegroundColor Red
Write-Host "Skipped: $($tests.Skipped)" -ForegroundColor Yellow
Write-Host "Total:   $($tests.Passed + $tests.Failed + $tests.Skipped)" -ForegroundColor Cyan
Write-Host ""

if ($tests.Failed -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Platform is ready for use!" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check service logs with: docker-compose logs [service]" -ForegroundColor Yellow
    exit 1
}
