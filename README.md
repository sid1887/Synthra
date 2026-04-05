# Synthra - Circuit Photo Analysis Platform

**Turn a circuit photo into circuit insight, warnings, and guided improvements.**

Synthra is a full-stack web application that analyzes circuit photos and provides:
- 🔍 Automatic component detection
- 🎯 Circuit type identification
- 📖 Multi-level explanations
- ⚠️ Automatic diagnostic warnings
- 💡 Smart recommendations
- ⚡ Basic circuit simulation
- 📐 Schematic reconstruction

**Status**: Phase A MVP COMPLETE + Phase B components in place

## Architecture Overview

```
User Upload → Image Preprocessing → Component Detection → Circuit Identification
                                   ↓                           ↓
                            AI Service (Groq)         Rule-Based Engine
                                   ↓                           ↓
                            Detection Cleanup ← → Circuit Rules Engine
                                   ↓                           ↓
                            Explanation Engine ← → Simulation Engine
                                   ↓
                            JSON Analysis Response
                                   ↓
                            React Frontend
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Groq API key (optional; mock fallback included)

### Installation

```bash
# Install all dependencies
npm run install-all

# Or manually:
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and add your Groq API key if desired
```

### Development

```bash
# Terminal 1: Start backend (runs on port 3000)
cd backend
npm run dev

# Terminal 2: Start frontend (runs on port 5173)
cd frontend
npm run dev
```

### Production Build

```bash
npm run build
```

Routes:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: POST http://localhost:3000/api/analyze

## API Reference

### POST /api/analyze
Main endpoint for circuit analysis.

**Request:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "image=@circuit.jpg"
```

**Response:**
```json
{
  "requestId": "req_...",
  "timestamp": "2026-04-04T...",
  "image": { ... },
  "components": [ ... ],
  "circuit": {
    "label": "battery_resistor_led",
    "confidence": 0.92,
    ...
  },
  "explanation": { ... },
  "warnings": [ ... ],
  "suggestions": [ ... ],
  "simulation": { ... },
  ...
}
```

### GET /health
Health check endpoint.

```bash
curl http://localhost:3000/health
```

### GET /api/history
Retrieve analysis history.

```bash
curl http://localhost:3000/api/history
```

### GET /api/results/:id
Retrieve specific analysis result.

```bash
curl http://localhost:3000/api/results/{analysisId}
```

## Testing

### Backend Unit Tests

```bash
cd backend
npm run test
npm run test:watch
```

Tests cover:
- Component detection cleanup
- Circuit identification rules
- Simulation engine (Ohm's Law)
- Detection normalization and deduplication

### Frontend
Create tests as needed with Jest + React Testing Library.

## Features (Phase A MVP)

✅ **Rock A1**: Product + Contract Lock
- Complete JSON schemas for request/response

✅ **Rock A2**: UI Foundation
- Upload/drag-drop interface
- Real-time preview
- State machine for app flow

✅ **Rock A3**: Image Input Module
- Upload validation (size, type, magic bytes)
- Image preprocessing (auto-rotate, compression, optimization)
- Quality assessment (blur, darkness, angle)

✅ **Rock A4**: Backend Foundation
- Express.js API with middleware
- Request ID tracking and logging
- Rate limiting (30/min default)
- Error handling with graceful fallback

✅ **Rock A5**: Detection Cleanup
- Component normalization (10+ types)
- Deduplication by spatial proximity
- Confidence aggregation
- Unknown component handling

✅ **Rock A6**: Circuit Identification
- 8 circuit templates (LED, parallel, divider, transistor, filter, protection, switch, unknown)
- Rule-based matching
- Power-path tracing
- Complexity estimation

✅ **Rock A7**: Explanation + Diagnostics
- Multi-level explanations (short, student, engineer)
- Automatic diagnostics (missing resistor, polarity, power)
- Smart suggestion engine
- Capture quality guidance

✅ **Rock A8**: 2D Overlay
- Bounding box annotation
- Confidence visualization
- Toggle annotated/raw views

**Bonus - Early Phase B:**
✅ **Rock B1**: Schematic Reconstruction
- Node/edge graph JSON
- Simple netlist generation

✅ **Rock B2**: Simulation Engine
- Ideal DC analysis with Ohm's Law
- Per-component voltage/current/power
- Safety warnings (overcurrent, undercurrent)

## Supported Circuit Types

| Type | Description | Detection Method |
|------|-------------|------------------|
| Simple LED | Battery + Resistor + LED | Required components check |
| Parallel LEDs | Multiple LEDs in parallel branches | Component count + layout |
| Voltage Divider | Series resistors | 2+ resistors + battery |
| Transistor Switch | Transistor-based switching circuit | Transistor + controls |
| RC Filter | Low-pass filter circuit | Resistor + capacitor |
| Diode Protection | Protection diode topology | Diode + power source |
| Switch Circuit | Manual switch control | Switch + components |

## Component Library

Supported components (with aliases):
- Resistor (R, pot, variable resistor, rheostat)
- Capacitor (cap, C, electrolytic, ceramic, disc, film)
- Inductor (L, ind, coil, choke)
- Diode (rectifier, protection diode)
- LED (light emitting diode, indicator)
- Transistor (BJT, FET, MOSFET, IC pack)
- Battery (power source, cell, 9V, AA, AAA)
- Switch (button, momentary, pushbutton, toggle)
- IC (integrated circuit, microcontroller, op-amp, timer)
- Wire (conductor, connection, trace)

## Configuration

### Environment Variables

**Backend:**
```env
SYNTHRA_ENV=development|staging|production
PORT=3000
LOG_LEVEL=debug|info|warn|error
AI_API_KEY=your_groq_api_key
MAX_UPLOAD_MB=10
REQUEST_TIMEOUT_MS=30000
RATE_LIMIT_PER_MIN=30
ENABLE_SIM=true|false
ENABLE_3D=false
ENABLE_AUTOMATION=false
STORAGE_PATH=./storage
```

### Rate Limiting

Default: 30 requests/minute per IP
- Development: Set `RATE_LIMIT_PER_MIN=1000` in .env

### Storage

By default, analyses are saved to `./storage/*.json`
- Customize with `STORAGE_PATH` env var
- Each analysis persists automatically

## Performance Characteristics

| Operation | Typical Time |
|-----------|-----|
| Image preprocessing | 50-200ms |
| Component detection (API) | 3-8s |
| Component detection (mock) | <100ms |
| Circuit identification | <10ms |
| Full pipeline end-to-end | 4-10s |

**Constraints:**
- Max image size: 10 MB
- Max dimension after resize: 1600px
- Hard timeout: 30s
- Soft timeout: 15s (for graceful cancellation)

## Development Notes

### Code Structure

```
backend/
├── src/
│   ├── types/
│   │   └── schemas.ts        # A1: JSON contracts
│   ├── modules/
│   │   ├── image-preprocessor.ts  # A3
│   │   ├── detection-cleanup.ts   # A5
│   │   ├── circuit-engine.ts      # A6
│   │   ├── explanations.ts        # A7
│   │   ├── ai-service.ts          # Detection wrapper
│   │   └── simulation-engine.ts   # B2
│   ├── index.ts              # A4: Express API
│   └── __tests__/
├── tsconfig.json
├── jest.config.json
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── ImageUpload.tsx   # A3: Upload/camera
│   │   ├── AnalysisResults.tsx # A2: Display results
│   │   └── HistoryPanel.tsx   # History browser
│   ├── App.tsx               # A2: Main UI state
│   ├── api.ts                # API client
│   ├── types.ts              # Type definitions
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind styles
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

### Adding a New Circuit Type

1. Add template to `CIRCUIT_TEMPLATES` in `circuit-engine.ts`:
```typescript
{
  id: 'my_circuit',
  label: 'my_circuit_label',
  family: 'category',
  description: '...',
  requiredComponents: ['battery', 'component1'],
  pattern: (comps) => { /* custom matching logic */ }
}
```

2. Add explanation in `explanations.ts`:
```typescript
EXPLANATION_TEMPLATES['my_circuit_label'] = {
  short: '...',
  student: '...',
  engineer: '...'
}
```

3. Test in `circuit-engine.test.ts`

### Adding a New Component Type

1. Add to `COMPONENT_LIBRARY` in `detection-cleanup.ts`:
```typescript
my_component: {
  canonical: 'my_component',
  aliases: ['alias1', 'alias2'],
  role: 'component_role'
}
```

2. Test component normalization

### Debugging

Enable verbose logging:
```bash
# Backend
LOG_LEVEL=debug npm run dev

# Check storage folder for analysis JSON files
cat storage/img_*.json | jq .
```

## Phase Roadmap

### Phase A: MVP (COMPLETE) ✅
- [x] UI foundation & upload
- [x] Image preprocessing
- [x] Backend core
- [x] Component detection cleanup
- [x] Circuit identification
- [x] Explanations & diagnostics
- [x] 2D overlay

### Phase B: v1 Expansion (IN PROGRESS)
- [x] Schematic reconstruction
- [x] Basic simulation
- [ ] Export (JSON/PDF/TXT)
- [ ] History persistence
- [ ] Acceptance tests & golden data
- [ ] Deployment hardening

### Phase C: Advanced (FUTURE)
- [ ] Advanced simulation (transient, playback)
- [ ] 3D visualization
- [ ] AI-powered enhancements
- [ ] Automation workflows

## Limitations & Known Issues

1. **AI Detection Fallback**: If Groq API key not present or API unavailable, mock data is used (realistic but not your actual circuit)
2. **Resolution**: No SPICE-grade simulation; ideal DC analysis only
3. **Reconstruction Confidence**: Based on visible components; may miss hidden layers
4. **Image Quality**: Requires reasonable lighting, orthogonal view preferred

## Future Enhancements

1. **Computer Vision Improvements**:
   - Better low-light handling
   - Multi-angle fusion
   - Text OCR for component values

2. **Simulation Enhancements**:
   - Transient analysis
   - Frequency response
   - Fault simulation

3. **UI Improvements**:
   - Drag-to-edit circuit
   - Interactive component values
   - Real-time re-analysis

4. **Data Collection**:
   - User feedback loop
   - Model re-training pipeline
   - Circuit dataset expansion

## Contributing

Contributions welcome! Areas for improvement:
- Additional circuit templates
- Better component detection
- Enhanced UI/UX
- Performance optimization
- Test coverage expansion

## License

ISC

## Support

-📧 Email: support@synthra.dev
- 🐛 Issues: GitHub Issues
- 📖 Docs: This README + inline code comments

---

**Built with ❤️ for electronics learners and engineers**

Synthra v1.0 | 2026-04-04
