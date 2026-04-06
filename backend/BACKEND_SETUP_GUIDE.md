# Synthra Backend: Complete Setup & Deployment Guide

## Quick Start

### 1. Install Backend Dependencies ✅
```bash
cd backend
npm install
```

**Already Installed:**
- ✅ onnxruntime-node (for YOLO inference)
- ✅ three (3D rendering support)
- ✅ mathjs & decimal.js (numerical computation)
- ✅ Express, Core middleware

### 2. Start Backend Server
```bash
npm run dev
```

Expected output:
```
[Startup] Loading .env from: .../.env
[API] Starting analysis...
Synthra backend server started
API ready: http://localhost:3000
WebSocket ready: ws://localhost:3000
```

### 3. Test API Endpoint
```bash
# Check system info
curl http://localhost:3000/api/circuit/info

# Get components
curl http://localhost:3000/api/circuit/components

# Upload & analyze image
curl -X POST http://localhost:3000/api/circuit/analyze \
  -F "image=@circuit.jpg"
```

---

## New Backend Modules

### Phase 1: Core Infrastructure ✅ DONE

| Module | File | Status | Purpose |
|--------|------|--------|---------|
| Component Database | `models/components.ts` | ✅ | 10-component library with specs |
| ML Detection | `modules/ml-detection.ts` | ✅ | YOLO ONNX inference pipeline |
| Circuit Analysis | `modules/circuit-analysis.ts` | ✅ | Pattern recognition & safety checking |
| Circuit Simulator | `modules/circuit-simulator.ts` | ✅ | OHM's Law simulation |
| Circuit API Routes | `routes/circuit-api.ts` | ✅ | REST endpoints |
| API Documentation | `CIRCUIT_API_README.md` | ✅ | Full API reference |

### Phase 2: YOLO Model Setup (TODO)

**Step 1: Prepare Training Dataset**

Create directory structure:
```
backend/datasets/component-detection/
├── images/
│   ├── resistor_1.jpg
│   ├── led_circuit_1.jpg
│   └── ... (50-100 total)
└── labels/
    ├── resistor_1.txt (YOLO format)
    ├── led_circuit_1.txt
    └── ...
```

**YOLO Label Format:**
```
<class_id> <x_center> <y_center> <width> <height>
```

Example (resistor at center):
```
0 0.5 0.5 0.3 0.2
```

**Step 2: Create dataset.yaml**

```yaml
path: datasets/component-detection
train: images
val: images

nc: 10
names: ['resistor', 'capacitor', 'inductor', 'diode', 'transistor', 
        'led', 'battery', 'switch', 'ic', 'connector']
```

**Step 3: Train Model (Python)**

Install Ultralytics:
```bash
pip install ultralytics torch torchvision
```

Train:
```python
from ultralytics import YOLO

model = YOLO('yolov8n.pt')
results = model.train(
    data='backend/datasets/component-detection/dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    device=0,  # GPU
    patience=20
)

# Export ONNX
model.export(format='onnx')
```

**Step 4: Deploy Model**

```bash
# Copy trained model
cp runs/detect/train/weights/best.onnx backend/models/yolo-component-small.onnx

# Restart backend
npm run dev
```

---

### Phase 3: Frontend Integration (TODO)

**Update Frontend API Client:**

```typescript
// frontend/src/api.ts
export const analyzeImage = async (imageFile: File) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await fetch('/api/circuit/analyze', {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
};

export const simulateCircuit = async (voltage: number, components: any[]) => {
  const response = await fetch('/api/circuit/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batteryVoltage: voltage, components }),
  });
  
  return response.json();
};
```

**Use in Component:**

```typescript
// frontend/src/components/CircuitAnalyzer.tsx
import { analyzeImage, simulateCircuit } from '../api';

export const CircuitAnalyzer = () => {
  const [results, setResults] = useState(null);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const analysis = await analyzeImage(file);
    setResults(analysis);
  };
  
  return (
    <div>
      <input type="file" onChange={handleImageUpload} />
      {results && (
        <div>
          <h3>{results.analysis.circuitType}</h3>
          <ul>
            {results.analysis.issues.map(issue => (
              <li key={issue.message}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

---

### Phase 4: Advanced Features (TODO)

#### 4.1 Graph-Based Circuit Topology
```typescript
// modules/circuit-graph.ts
class CircuitGraph {
  buildFromDetections(detections: DetectionResult[]) {
    const graph = new Map<string, CircuitNode>();
    // ... build node/edge structure
    return graph;
  }
  
  findPaths(): Path[] {
    // Use DFS/BFS to find power paths
  }
  
  checkConnectivity(): { connected: boolean; issues: string[] } {
    // Verify all components have continuous path to ground
  }
}
```

#### 4.2 Constraint Solver for Values
```typescript
// modules/constraint-solver.ts
class CircuitConstraintSolver {
  // Given: Battery voltage, LED specs, max current
  // Solve: What resistor value?
  solve(constraints: Constraint[]): Solution {
    // Use linear algebra solver
  }
}
```

#### 4.3 AC Circuit Analysis
```typescript
// modules/ac-simulator.ts
class ACSimulator {
  simulateAC(circuit: Circuit, frequency: number) {
    // Complex impedance calculations
    // Frequency response
    // Phase shifts
  }
}
```

#### 4.4 3D Physical Simulation
```typescript
// modules/3d-physics.ts
class Circuit3DPhysics {
  simulateHeatFlow(components: Component[], powerDissipation: number[]) {
    // Model thermal distribution
    // Visualize hotspots
  }
}
```

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Three.js)                │
├────────────────────────────────────────────────────────────────┤
│  - Image upload widget                                         │
│  - Real-time detection overlay                                 │
│  - Interactive circuit reconstruction                          │
│  - 3D visualization                                            │
│  - Simulation controls                                         │
└────────────────┬───────────────────────────────────────────────┘
                 │ HTTP + WebSocket
┌────────────────▼───────────────────────────────────────────────┐
│                  Express API Layer                             │
├────────────────────────────────────────────────────────────────┤
│  /api/circuit/analyze    - Main entry point                    │
│  /api/circuit/simulate   - Run simulation                      │
│  /api/circuit/components - Get component DB                    │
│  /api/circuit/info       - System status                       │
└────────────────┬───────────────────────────────────────────────┘
                 │
        ┌────────┴─────────┬──────────────┬──────────────┐
        │                  │              │              │
        ▼                  ▼              ▼              ▼
   ┌─────────┐     ┌────────────┐  ┌──────────┐  ┌────────────┐
   │   ML    │     │  Analysis  │  │          │  │  Database  │
   │Detection│────▶│  Engine    │  │Simulator │  │ Components │
   │         │     │            │  │          │  │            │
   │YOLO     │     │- Pattern   │  │- OHM's   │  │ Types:     │
   │ONNX     │     │- Safety    │  │- Series  │  │ - Resistor │
   │         │     │- Suggest   │  │- Parallel│  │ - LED      │
   └─────────┘     │- Explain   │  │- Thermal │  │ - Battery  │
                   └────────────┘  └──────────┘  │ - Capacitor│
                                                 │ ... 7 more │
                                                 └────────────┘
```

---

## Backend API Contract

### Input Format (Image)
- **Type:** JPEG, PNG, WebP
- **Max Size:** 10 MB
- **Resolution:** 640×480 - 3840×2160 recommended
- **Background:** Plain background preferred
- **Lighting:** Uniform (no shadows)

### Output Format (JSON)
```json
{
  "success": boolean,
  "analysisId": "uuid",
  "detections": {
    "count": number,
    "items": [
      {
        "class": "string",
        "confidence": 0-1,
        "bbox": {"x", "y", "width", "height"},
        "label": "string"
      }
    ]
  },
  "analysis": {
    "circuitType": "string",
    "components": [...],
    "issues": [...],
    "suggestions": [...],
    "explanation": "markdown"
  },
  "simulation": {
    "nodes": [...],
    "edges": [...],
    "totalPower": number,
    "summary": "string"
  }
}
```

---

## Data Flow & Processing Pipeline

```
1. Image Upload
   ↓
2. File Validation (size, format, MIME type)
   ↓
3. ML Detection (YOLO → bounding boxes)
   ↓
4. Confidence Filtering (threshold > 0.5)
   ↓
5. NMS (Non-Maximum Suppression)
   ↓
6. Component Classification (map to library)
   ↓
7. Circuit Analysis
   ├─ Pattern Recognition (LED, power supply, etc.)
   ├─ Safety Checking (short circuit, overcurrent, etc.)
   ├─ Suggestion Generation (add resistor, etc.)
   └─ Explanation Generation (human-readable)
   ↓
8. Simulation
   ├─ Series/Parallel detection
   ├─ OHM's Law calculation
   ├─ Power dissipation
   └─ Component warnings
   ↓
9. Response Generation
   ├─ Detection visualizations
   ├─ Analysis insights
   ├─ Simulation results
   └─ Recommendations
```

---

## Performance Targets

| Operation | Target | Status |
|-----------|--------|--------|
| Image upload | <5s | ✅ |
| ML Inference | 200-300ms | 🔄 (needs ONNX model) |
| Analysis | 50-100ms | ✅ |
| Simulation | <10ms | ✅ |
| Total E2E | 300-500ms | 🔄 (pending model) |

---

## Environment Variables

Create `.env` in backend root:

```bash
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Rate limiting
RATE_LIMIT_PER_MIN=30

# File uploads
MAX_FILE_SIZE=10485760  # 10MB

# ML Model path
YOLO_MODEL_PATH=./models/yolo-component-small.onnx

# Database
COMPONENT_DB_PATH=./data/components.db

# Cache
ENABLE_CACHE=true
CACHE_TTL=3600

# Analytics
ENABLE_ANALYTICS=false
```

---

## Deployment Checklist

- [ ] Install Node.js 18+
- [ ] Install dependencies (`npm install`)
- [ ] Train and export YOLO model to `backend/models/`
- [ ] Create `.env` file with required variables
- [ ] Run TypeScript check (`npm run lint`)
- [ ] Build production bundle (`npm run build`)
- [ ] Test API endpoints locally
- [ ] Deploy to production server
- [ ] Monitor logs and performance
- [ ] Set up alerting for errors

---

## Troubleshooting

### YOLO Model Not Loading
```
Error: Failed to initialize ML model
```

**Solution:**
1. Check file exists: `ls -la backend/models/yolo-component-small.onnx`
2. Check file size (should be 25-50 MB for nano model)
3. Check permissions: `chmod 644 backend/models/yolo-component-small.onnx`

### Out of Memory During Inference
**Solution:** Use smaller model variant or add inference caching

### Slow Analysis
**Solution:** 
1. Reduce image resolution to 640×480
2. Enable result caching
3. Use batching for multiple images

---

## Next Steps

1. **[ Priority 1 ]** Train and export YOLO model
2. **[ Priority 2 ]** Connect frontend to API
3. **[ Priority 3 ]** Implement graph-based topology analysis
4. **[ Priority 4 ]** Add KiCad schematic export
5. **[ Priority 5 ]** Implement AC circuit analysis

---

## Testing

Run test suite:
```bash
npm test
```

Test specific module:
```bash
npm test -- src/modules/circuit-simulator.test.ts
```

---

## References

- [YOLO Documentation](https://docs.ultralytics.com/)
- [ONNX Runtime Node.js](https://github.com/microsoft/onnxruntime/tree/main/js)
- [Math.js Documentation](https://mathjs.org/)
- [Express.js Guide](https://expressjs.com/)
