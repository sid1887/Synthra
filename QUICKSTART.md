# 🚀 Synthra Quick Start Guide

## Status: ✅ All Components Built - Ready for Deployment

---

## Prerequisites Check

Before starting, ensure you have:

- [x] **Docker Desktop** installed and running
- [x] **Node.js 18+** installed (check: `node --version`)
- [x] **8GB RAM** minimum (16GB recommended)
- [x] **20GB disk space** for Docker images and models
- [x] **NVIDIA GPU** (optional, for faster AI generation)

---

## 🎯 One-Command Deployment

```powershell
# Navigate to project
cd d:\dev_packages\Synthra

# Deploy everything (builds, starts, health checks)
.\deploy.ps1

# With database seeding (adds 15-30 min on GPU)
.\deploy.ps1 -SeedDatabase

# Development mode (runs frontend via npm)
.\deploy.ps1 -DevMode
```

---

## 📋 Step-by-Step Deployment

### Step 1: Build Docker Images

```powershell
.\build.ps1
```

**What it does:**
- Validates Docker is running
- Builds all 7 microservices + frontend
- Takes ~10-15 minutes

### Step 2: Start All Services

```powershell
.\run.ps1
```

**What it does:**
- Starts PostgreSQL, Redis
- Starts all 7 microservices
- Starts frontend
- Services run in background

### Step 3: Verify Services

```powershell
.\test-platform.ps1
```

**What it does:**
- Tests all service health endpoints
- Validates database connectivity
- Tests API integration
- Reports pass/fail for each test

### Step 4: Seed Database (Optional but Recommended)

```powershell
docker exec -it synthra-sve python seed.py seed
```

**What it does:**
- Generates 100+ electronic component symbols
- Uses AI (SDXL-Turbo) to create SVG graphics
- Takes 15-30 minutes on GPU, 2-4 hours on CPU
- Populates component library

**Progress tracking:**
```powershell
# Watch logs
docker logs -f synthra-sve

# Check status
docker exec -it synthra-sve python seed.py list
```

### Step 5: Install Frontend Dependencies

```powershell
cd frontend
npm install
```

**What it does:**
- Installs 25+ npm packages (konva, zustand, socket.io-client, etc.)
- Takes 2-5 minutes
- Required if running frontend in dev mode

---

## 🌐 Access the Platform

Once deployed, open your browser:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application |
| **Schematic Editor** | http://localhost:3000/editor | Canvas-based editor |
| **SVE Admin** | http://localhost:3000/admin/sve | Component management |
| **API Gateway** | http://localhost:8000 | REST API |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |
| **SVE Service** | http://localhost:8005 | AI component generator |
| **Real-Time** | http://localhost:8006 | WebSocket collaboration |

---

## 🧪 Testing the Platform

### Test 1: Health Check

Visit http://localhost:8000/api/services/status

Should show all services as "healthy":
```json
{
  "vision": {"status": "healthy"},
  "core": {"status": "healthy"},
  "simulator": {"status": "healthy"},
  "docs": {"status": "healthy"},
  "sve": {"status": "healthy"}
}
```

### Test 2: Component Library

Visit http://localhost:3000/admin/sve

Should show:
- Component statistics dashboard
- Grid of generated components
- Search and filter controls

### Test 3: Schematic Editor

1. Visit http://localhost:3000/editor
2. You should see:
   - Component palette on left
   - Canvas in center
   - Code preview on right
3. Drag a component from palette to canvas
4. Draw wires by clicking start/end points
5. See live netlist/HDL updates in code preview

### Test 4: Real-Time Collaboration

1. Open http://localhost:3000/editor in two browser windows
2. Place a component in one window
3. Should immediately appear in the other window
4. See user cursor positions in both windows

---

## 🛠️ Common Tasks

### View Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f sve
docker-compose logs -f realtime
docker-compose logs -f api
```

### Restart Services

```powershell
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart sve
```

### Stop Platform

```powershell
# Stop all services (keeps data)
docker-compose stop

# Stop and remove containers (keeps images)
docker-compose down

# Full cleanup (removes images and volumes)
docker-compose down -v --rmi all
```

### Database Management

```powershell
# Connect to PostgreSQL
docker exec -it synthra-db psql -U synthra -d synthra

# View components
# (in psql shell)
SELECT component_type, category, quality_score, usage_count 
FROM components 
ORDER BY usage_count DESC 
LIMIT 10;
```

### Component Management

```powershell
# Seed database
docker exec -it synthra-sve python seed.py seed

# List all components
docker exec -it synthra-sve python seed.py list

# Clear database
docker exec -it synthra-sve python seed.py clear

# Reseed (clear + seed)
docker exec -it synthra-sve python seed.py reseed
```

### Frontend Development

```powershell
# Run in dev mode (hot reload)
cd frontend
npm start

# Build for production
npm run build

# Run tests (if configured)
npm test
```

---

## 🐛 Troubleshooting

### Issue: Docker not running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
```powershell
# Start Docker Desktop
# Wait for it to fully start (green icon in tray)
# Then retry
```

### Issue: Port already in use

**Error:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <process_id> /F

# Or change port in docker-compose.yml
```

### Issue: Services unhealthy

**Solution:**
```powershell
# Check logs for errors
docker-compose logs [service]

# Common fixes:
# 1. Restart service
docker-compose restart [service]

# 2. Rebuild service
docker-compose build [service]
docker-compose up -d [service]

# 3. Check environment variables
docker-compose config
```

### Issue: Frontend shows blank page

**Symptoms:**
- http://localhost:3000 loads but shows nothing
- Console errors about missing modules

**Solution:**
```powershell
cd frontend

# Install dependencies
npm install

# Check .env file exists
cat .env

# Should contain:
# REACT_APP_API_URL=http://localhost:8000
# REACT_APP_SVE_URL=http://localhost:8005
# REACT_APP_REALTIME_URL=http://localhost:8006

# Restart frontend container
docker-compose restart frontend
```

### Issue: SVE generation is slow

**Symptoms:**
- Component generation takes minutes
- Seeding takes hours

**Solutions:**
```powershell
# Check GPU availability
nvidia-smi

# If no GPU, expect slower generation (CPU fallback)
# Optimize:
# 1. Use cached components (don't force regenerate)
# 2. Reduce batch size in seed.py
# 3. Let it run overnight for full seed
```

### Issue: WebSocket not connecting

**Symptoms:**
- Editor shows "Disconnected"
- Changes don't sync between tabs

**Solution:**
```powershell
# Check realtime service
docker logs synthra-realtime

# Verify service is running
docker ps | findstr realtime

# Check WebSocket port
netstat -ano | findstr :8006

# Restart realtime service
docker-compose restart realtime
```

### Issue: Database connection errors

**Error:** `asyncpg.exceptions.InvalidPasswordError`

**Solution:**
```powershell
# Check database is running
docker ps | findstr synthra-db

# Check credentials in docker-compose.yml
# Should match DATABASE_URL in services

# Recreate database
docker-compose down
docker volume rm synthra_postgres_data
docker-compose up -d db
```

---

## 📊 Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Port 3000)                  │
│         React + TypeScript + Konva.js + Zustand          │
└────────────┬────────────────────────────┬────────────────┘
             │                            │
        HTTP │                       WS   │
             │                            │
┌────────────▼───────────────┐  ┌────────▼────────────────┐
│   API Gateway (8000)       │  │  Real-Time (8006)       │
│   REST, Job Queue          │  │  WebSocket, CRDT        │
└───┬────┬────┬────┬────┬────┘  └─────────────────────────┘
    │    │    │    │    │
    ▼    ▼    ▼    ▼    ▼
┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐
│Vision││Core ││Sim  ││Docs ││ SVE │
│8001 ││8002 ││8003 ││8004 ││8005 │
└─────┘└─────┘└─────┘└─────┘└─────┘
    │                         │
    │    ┌──────────┐         │
    └────►PostgreSQL◄─────────┘
         │  (5432)  │
         └──────────┘
              │
         ┌────▼────┐
         │  Redis  │
         │ (6379)  │
         └─────────┘
```

---

## 🎯 What's Working

- ✅ **7 Microservices** - All health checks passing
- ✅ **AI Symbol Generation** - SDXL-Turbo producing high-quality SVGs
- ✅ **Real-Time Collaboration** - WebSocket with CRDT conflict resolution
- ✅ **Canvas Editor** - Konva.js with drag-drop, wire drawing
- ✅ **Component Library** - Database-backed with search/filter
- ✅ **Admin UI** - SVE Studio for component management
- ✅ **Live Code Gen** - Automatic netlist/HDL updates
- ✅ **Job Queue** - Redis + Celery for background tasks
- ✅ **Deployment Scripts** - One-command deployment

---

## 🚀 Quick Commands Reference

```powershell
# === Deployment ===
.\deploy.ps1                    # Full deployment
.\deploy.ps1 -SeedDatabase      # With DB seeding
.\deploy.ps1 -DevMode           # Frontend dev mode

# === Testing ===
.\test-platform.ps1             # Full test suite
.\test-platform.ps1 -Quick      # Fast tests only
.\test-platform.ps1 -Verbose    # Detailed output

# === Building ===
.\build.ps1                     # Build all images

# === Running ===
.\run.ps1                       # Start services
docker-compose ps               # List services
docker-compose stop             # Stop all
docker-compose down             # Stop and remove

# === Logs ===
docker-compose logs -f          # All logs
docker-compose logs -f sve      # SVE logs
docker logs synthra-sve         # Direct container logs

# === Database ===
docker exec -it synthra-sve python seed.py seed   # Seed
docker exec -it synthra-sve python seed.py list   # List
docker exec -it synthra-db psql -U synthra        # Connect

# === Frontend ===
cd frontend
npm install                     # Install deps
npm start                       # Dev server
npm run build                   # Production build
```

---

## 📞 Need Help?

Check these files for detailed information:

- **FINAL_BUILD_SUMMARY.md** - Complete technical documentation
- **README.md** - Project overview
- **services/sve/README.md** - SVE service details
- **services/sve/QUICKSTART.md** - SVE quick start
- **DEVELOPMENT.md** - Development guidelines

---

## 🎉 You're Ready!

The Synthra platform is fully built and ready to use. Start with:

```powershell
.\deploy.ps1
```

Then open http://localhost:3000 and start designing circuits!

---

*Last Updated: November 5, 2025*
*Platform Version: 1.0.0*
*Status: Production Ready*
