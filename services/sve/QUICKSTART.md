# 🚀 SVE Quick Start Guide

## Prerequisites

- Docker & Docker Compose
- NVIDIA GPU with drivers (optional but recommended for speed)
- 16GB+ RAM
- 20GB+ free disk space (for AI models)

## Quick Start (Docker - Recommended)

### 1. Build All Services

```powershell
# Windows PowerShell
.\build.ps1
```

This will build all Docker containers including SVE with AI model dependencies.

### 2. Start Services

```powershell
# Windows PowerShell
.\run.ps1
```

All services will start, including:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Vision service (port 8001)
- Core service (port 8002)
- Simulator service (port 8003)
- Docs service (port 8004)
- **SVE service (port 8005)** ← AI component generator
- API Gateway (port 8000)
- Frontend (port 3000)

### 3. Seed Component Database

Wait for services to start (check with `docker-compose logs -f sve`), then seed the database:

```powershell
# Option 1: Docker exec
docker exec -it synthra-sve python seed.py

# Option 2: Direct API call
curl -X POST http://localhost:8005/api/seed
```

This generates **100+ component symbols** using AI. Takes ~15-30 minutes on GPU, 2-4 hours on CPU.

### 4. Verify Installation

```powershell
# Check SVE health
curl http://localhost:8005/health

# Get component stats
curl http://localhost:8005/api/stats

# Search for a component
curl http://localhost:8005/api/components/search?query=resistor

# Generate new component
curl -X POST http://localhost:8005/api/generate \
  -H "Content-Type: application/json" \
  -d '{"component_type": "resistor", "category": "passive", "pins": 2}'
```

## Local Development Setup

For development without Docker:

### 1. Setup Python Environment

```powershell
cd services/sve

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install system dependencies (Windows - use WSL or install separately)
# potrace: https://potrace.sourceforge.net/
# Cairo: pip install cairosvg handles this
```

### 2. Setup Database

```powershell
# Install PostgreSQL locally or use Docker
docker run -d --name synthra-db \
  -e POSTGRES_DB=synthra \
  -e POSTGRES_USER=synthra \
  -e POSTGRES_PASSWORD=synthra_dev_password \
  -p 5432:5432 \
  postgres:15-alpine

# Run init script
psql -U synthra -d synthra -f ../../database/init.sql
```

### 3. Configure Environment

```powershell
# Set environment variable
$env:DATABASE_URL="postgresql://synthra:synthra_dev_password@localhost:5432/synthra"
```

### 4. Run SVE Service

```powershell
python main.py
```

Service runs on `http://localhost:8000` (change in main.py if needed).

### 5. Seed Database

```powershell
python seed.py
```

## Usage Examples

### Generate Component (Auto-Check Database)

```python
import httpx
import asyncio

async def get_component(component_type: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8005/api/generate",
            json={
                "component_type": component_type,
                "category": "passive",
                "pins": 2,
                "style": "IEEE"
            }
        )
        data = response.json()
        print(f"Status: {data['status']}")
        print(f"From cache: {data['from_cache']}")
        print(f"Quality: {data['quality_score']}")
        return data["svg_content"]

# Run
asyncio.run(get_component("resistor"))
```

### Search Components

```python
async def search_components(query: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://localhost:8005/api/components/search",
            params={"query": query, "category": "passive"}
        )
        components = response.json()
        for comp in components:
            print(f"{comp['component_type']}: {comp['usage_count']} uses")

asyncio.run(search_components("resistor"))
```

### Get Popular Components

```javascript
// Frontend - Load component palette
async function loadPalette() {
  const response = await fetch('http://localhost:8005/api/components/popular');
  const components = await response.json();
  
  components.forEach(comp => {
    const div = document.createElement('div');
    div.innerHTML = comp.svg_content;
    div.title = comp.component_type;
    document.getElementById('palette').appendChild(div);
  });
}
```

## Command-Line Tools

### Seed Script Usage

```powershell
# Full seed (100+ components)
python seed.py

# Regenerate specific component
python seed.py reseed npn_transistor

# List all components
python seed.py list

# Clear database (CAREFUL!)
python seed.py clear
```

### Database Queries

```sql
-- Connect to database
psql -U synthra -d synthra

-- View all components
SELECT component_type, category, quality_score, usage_count 
FROM components 
ORDER BY usage_count DESC;

-- Components by category
SELECT category, COUNT(*) as count 
FROM components 
GROUP BY category;

-- Recent components
SELECT component_type, created_at 
FROM components 
ORDER BY created_at DESC 
LIMIT 10;

-- High-quality components
SELECT component_type, quality_score 
FROM components 
WHERE quality_score > 0.9 
ORDER BY quality_score DESC;
```

## Monitoring

### Check Service Status

```powershell
# All services health
curl http://localhost:8000/api/services/status

# SVE-specific health
curl http://localhost:8005/health

# Database stats
curl http://localhost:8005/api/stats
```

### View Logs

```powershell
# All services
docker-compose logs -f

# SVE only
docker-compose logs -f sve

# With timestamps
docker-compose logs -f --timestamps sve
```

### Resource Usage

```powershell
# Docker stats
docker stats synthra-sve

# GPU usage (if NVIDIA)
nvidia-smi -l 1
```

## Troubleshooting

### "Out of memory" Error

**Problem**: AI model too large for GPU VRAM

**Solution**:
```python
# In generator.py, reduce precision or use CPU
pipe = DiffusionPipeline.from_pretrained(
    "stabilityai/sdxl-turbo",
    torch_dtype=torch.float32,  # Changed from float16
).to("cpu")  # Force CPU
```

### "Database connection refused"

**Problem**: PostgreSQL not ready

**Solution**:
```powershell
# Wait for database to be ready
docker-compose logs -f db

# Manually check
docker exec -it synthra-db psql -U synthra -c '\l'
```

### "potrace command not found"

**Problem**: Potrace not installed

**Solution**:
```powershell
# Windows: Download from https://potrace.sourceforge.net/
# Extract potrace.exe to PATH or services/sve/

# Linux (in Docker):
apt-get update && apt-get install -y potrace

# macOS:
brew install potrace
```

### Slow Generation

**Problem**: Running on CPU

**Solution**:
- Use GPU (NVIDIA with Docker GPU support)
- Reduce batch size in seed.py
- Generate components on-demand instead of pre-seeding all

### "Component already exists"

**Problem**: Trying to regenerate existing component

**Solution**:
```python
# Use force_regenerate flag
response = await client.post(
    "http://localhost:8005/api/generate",
    json={
        "component_type": "resistor",
        "force_regenerate": True  # Delete and regenerate
    }
)
```

## Performance Tips

### Speed Up Seeding

```python
# Reduce initial component set
# Edit component_library.py, remove unnecessary components

# Or seed only specific categories
components = [c for c in COMPONENT_LIBRARY if c['category'] in ['passive', 'digital']]
```

### Enable Caching

AI models are cached automatically in Docker volume `huggingface_cache`. First run downloads ~7GB of models, subsequent runs are instant.

### Batch Operations

```python
# Generate multiple components in parallel
import asyncio

async def batch_generate(types: list):
    async with httpx.AsyncClient() as client:
        tasks = [
            client.post("http://localhost:8005/api/generate", 
                       json={"component_type": t, "category": "passive"})
            for t in types
        ]
        results = await asyncio.gather(*tasks)
        return [r.json() for r in results]

# Usage
types = ["resistor", "capacitor", "inductor"]
asyncio.run(batch_generate(types))
```

## Next Steps

1. ✅ Start services and seed database
2. 🔧 Integrate SVE with Vision service (see todo #9)
3. 🎨 Build frontend component palette
4. 🔄 Add WebSocket for real-time generation updates
5. 📊 Deploy SVE Studio admin UI

## Resources

- [SVE README](README.md) - Full documentation
- [Component Library](component_library.py) - View all 100+ components
- [API Docs](http://localhost:8005/docs) - Interactive Swagger UI
- [Main README](../../README.md) - Overall platform docs

---

**Happy Component Generating! 🎨**
