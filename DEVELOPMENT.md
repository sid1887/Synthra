# Synthra Development Guide

## Project Structure

```
synthra/
├── services/               # Microservices
│   ├── vision/            # Image processing & ML detection
│   ├── core/              # Netlist & HDL generation
│   ├── simulator/         # Simulation backend
│   ├── docs/              # PDF generator
│   └── api/               # API gateway
├── frontend/              # React web app
├── models/                # ML model weights
│   └── weights/           # YOLOv8 circuit models
├── shared/                # Shared Python schemas
├── database/              # PostgreSQL schema
└── docker/                # Docker configurations
```

## Getting Started

### 1. Clone and Setup

```bash
git clone <repo-url> synthra
cd synthra
```

### 2. Build and Run

```bash
# Start all services
docker-compose up --build

# Or start individual services
docker-compose up vision
docker-compose up api
```

### 3. Access Services

- **API Gateway**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000
- **Vision Service**: http://localhost:8001
- **Database**: localhost:5432

## Development Workflow

### Working on a Service

```bash
# Edit code in services/<service-name>/
# Docker will auto-reload on changes

# View logs
docker-compose logs -f vision

# Restart a service
docker-compose restart vision
```

### Database Migrations

```bash
# Connect to database
docker-compose exec db psql -U synthra

# Run migrations
docker-compose exec db psql -U synthra -d synthra -f /docker-entrypoint-initdb.d/init.sql
```

### Adding Dependencies

1. Add to `requirements.txt` in the service directory
2. Rebuild: `docker-compose up --build <service-name>`

## API Usage Examples

### Upload Image

```bash
curl -X POST http://localhost:8000/api/upload-image \
  -F "file=@schematic.png"
```

Response:
```json
{
  "job_id": "uuid",
  "status": "completed",
  "message": "Image processed successfully"
}
```

### Get Results

```bash
curl http://localhost:8000/api/result/{job_id}
```

### Simulate Circuit

```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "netlist": "...",
    "parameters": {
      "simulator": "ngspice",
      "simulation_type": "transient",
      "stop_time": 0.01
    }
  }'
```

## ML Model Training

### Dataset Preparation

1. Collect schematic images
2. Annotate using Label Studio:
   ```bash
   pip install label-studio
   label-studio
   ```
3. Export to YOLO format
4. Place in `models/dataset/`

### Training YOLOv8

```bash
# In services/vision/
python train.py --data dataset.yaml --epochs 100 --img 640
```

### Model Deployment

1. Save trained model to `models/weights/yolov8_circuit.pt`
2. Update `MODEL_PATH` in docker-compose.yml
3. Restart vision service

## Testing

### Unit Tests

```bash
# In each service directory
pytest tests/
```

### Integration Tests

```bash
# From project root
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Manual Testing

Use the Swagger UI at http://localhost:8000/docs

## Environment Variables

Create `.env` file in project root:

```env
# Database
POSTGRES_DB=synthra
POSTGRES_USER=synthra
POSTGRES_PASSWORD=your_secure_password

# Services
VISION_SERVICE_URL=http://vision:8000
CORE_SERVICE_URL=http://core:8000
SIMULATOR_SERVICE_URL=http://simulator:8000
DOCS_SERVICE_URL=http://docs:8000

# ML Models
MODEL_PATH=/models/yolov8_circuit.pt

# Storage
UPLOAD_DIR=/uploads
SIMULATION_DIR=/simulations
REPORT_DIR=/reports
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs <service-name>

# Rebuild
docker-compose up --build <service-name>

# Reset everything
docker-compose down -v
docker-compose up --build
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose ps db

# Test connection
docker-compose exec db psql -U synthra -c "SELECT 1;"
```

### ML Model Not Loading

1. Ensure model file exists: `models/weights/yolov8_circuit.pt`
2. Check MODEL_PATH environment variable
3. Download pretrained model if needed

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Test thoroughly
4. Commit: `git commit -m "feat: your feature"`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

## Phase 1 Roadmap (Current)

- [x] Project structure
- [x] Docker setup
- [x] Database schema
- [x] Shared schemas
- [x] Vision service skeleton
- [x] API gateway
- [ ] Core service (netlist/HDL generation)
- [ ] Simulator service
- [ ] Docs service (PDF generator)
- [ ] Frontend React app
- [ ] ML model training pipeline
- [ ] End-to-end testing

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [YOLOv8 Docs](https://docs.ultralytics.com/)
- [ngspice Manual](http://ngspice.sourceforge.net/docs.html)
- [Verilator Docs](https://verilator.org/guide/latest/)
- [LaTeX Documentation](https://www.latex-project.org/help/documentation/)
