# Synthra Implementation Roadmap: Build Order & Strategy

## Core Philosophy

```
DATA + RULES + PIPELINE + UI = SYSTEM

NOT just a model project — it's a complete engineering tool
```

---

## Build Phases (Priority Order)

### 🟢 Phase 1: Core Backend Infrastructure ✅ DONE

**Completed:**
- ✅ Component database (10 basic components)
- ✅ ML detection engine (YOLO ONNX scaffold)
- ✅ Circuit analysis (pattern recognition, safety checks)
- ✅ Circuit simulator (OHM's Law)
- ✅ API endpoints
- ✅ TypeScript setup

**Modules Created:**
```
backend/src/
├── models/
│   └── components.ts          # 10-component library ✅
├── modules/
│   ├── ml-detection.ts        # YOLO ONNX inference ✅
│   ├── circuit-analysis.ts    # Pattern recognition ✅
│   └── circuit-simulator.ts   # OHM's Law simulation ✅
└── routes/
    └── circuit-api.ts         # REST endpoints ✅
```

**What Works Now:**
- Component database querying
- Circuit pattern recognition (LED, power supply, switching)
- Safety issue detection
- Series circuit simulation
- Resistor value calculation
- API endpoints ready for model

---

### 🟡 Phase 2: YOLO Model Training → Deployment

**Roadmap (4-8 weeks):**

#### Step 1: Dataset Preparation (1 week)
- [ ] Collect 100-200 circuit images
- [ ] Label components with YOLO format
- [ ] Split: 80% train, 20% validation
- [ ] Verify label quality

#### Step 2: Model Training (2 weeks)
- [ ] Install Ultralytics + PyTorch
- [ ] Train YOLOv8-nano (lightweight)
- [ ] Achieve >85% mAP
- [ ] Export to ONNX format

#### Step 3: Integration & Testing (1 week)
- [ ] Place model in `backend/models/`
- [ ] Test inference latency
- [ ] Implement confidence filtering
- [ ] Benchmark on sample images

#### Step 4: Production Optimization (1 week)
- [ ] Model quantization if needed
- [ ] Caching strategy
- [ ] Error handling
- [ ] Performance monitoring

**Expected Outcome:**
```
/api/circuit/analyze endpoint fully functional
- Image upload → ML detection → Analysis → Simulation
```

---

### 🟠 Phase 3: Frontend Integration & UI

**Timeline: 2-3 weeks**

#### Components to Build:
```
frontend/src/
├── components/
│   ├── ImageUploader.tsx           # Camera + file upload
│   ├── CircuitViewer.tsx           # Annotated overlay
│   ├── AnalysisPanel.tsx           # Right panel (issues + suggestions)
│   ├── SimulationControls.tsx      # Adjust voltage/resistance
│   ├── ComponentRegistry.tsx       # Component details
│   └── CircuitTabs.tsx             # Overview/Components/3D/Logs
├── hooks/
│   ├── useCircuitAnalysis.ts       # API hook
│   └── useCircuitSimulation.ts     # Simulation hook
└── pages/
    └── CircuitAnalyzer.tsx         # Main page layout
```

#### Must-Have Features:
```
✅ Left Panel DONE:
   - Upload widget (file + camera)
   - History list
   - Sample circuits

🔄 Center Panel IN PROGRESS:
   - Image display
   - Annotated overlay (bounding boxes)
   - Toggle Raw/Annotated/Reconstruction/3D
   
❌ Right Panel TODO:
   - Component list + confidence badges
   - Circuit type display
   - Warning panel
   - Fix suggestions
   - AI explanation

❌ Bottom Tabs TODO:
   - Overview
   - Components
   - Reconstruction
   - Simulation
   - 3D View
   - Logs
```

---

### 🔵 Phase 4: Advanced Features (Strategic)

#### 4.1 Graph-Based Topology Solver (HIGH PRIORITY)
```typescript
// Why: Enables circuit reasoning at topology level
// Time: 2 weeks
// Impact: 10x better circuit understanding

class CircuitGraph {
  - Build graph from detections
  - Find power paths
  - Detect series/parallel
  - Validate connectivity
  - Check for short circuits
  - Find feedback loops
}
```

**Example Output:**
```
User: "Is this circuit safe?"
System: 
  - Topology: LED → 100Ω resistor → Battery (series)
  - Power path: Battery → Resistor → LED → Ground ✓ Complete
  - Issues: None detected ✓
  - Estimated current: 20mA (safe for LED)
```

#### 4.2 Constraint-Based Solver (HIGH PRIORITY)
```typescript
// Why: Generate optimal component values automatically
// Time: 2 weeks  
// Impact: "Synthra tells me exactly what I need"

class CircuitConstraintSolver {
  Given:
    - Battery voltage: 5V
    - LED forward voltage: 2V
    - LED max current: 20mA
  
  Solve:
    - Required resistor: 150Ω
    - Power rating: 0.06W
    - Standard value: 220Ω (safe)
    - Max safe voltage: 12V
}
```

#### 4.3 Interactive Simulation (MEDIUM PRIORITY)
```typescript
// Why: Users can experiment with values
// Time: 1 week
// Impact: Learning tool + debugging assistant

Features:
  - Adjust resistor value → LED brightness changes in real-time
  - Change battery voltage → Current/power updates
  - Slider UI for fast exploration
  - Warnings if component ratings exceeded
```

#### 4.4 KiCad Integration (MEDIUM PRIORITY)
```typescript
// Why: Export to PCB design workflow
// Time: 2 weeks
// Impact: Bridge to hardware manufacturing

Capabilities:
  - Import KiCad schematic symbols
  - Export detected circuit as KiCad project
  - Suggest component footprints from library
  - Layout suggestions (thermal, routing hints)
```

#### 4.5 AC Circuit Analysis (MEDIUM PRIORITY)
```typescript
// Why: Support power supplies, audio circuits
// Time: 3 weeks
// Impact: Broader circuit types

Capabilities:
  - Complex impedance calculations
  - Frequency response analysis
  - Phase shifts
  - Filter design
```

---

## 3-Layer System Architecture

### Layer 1: Intelligence WOW (CORE) 🧠
```
What it does:  "Tells you WHAT, WHY, and HOW TO FIX"

User uploads circuit
   ↓
System analyzes:
   1. What is this? (Pattern recognition)
   2. Is it safe? (Safety checking)
   3. Will it work? (Simulation)
   4. What's wrong? (Issue detection)
   5. How to fix? (Suggestions)
   6. Explain please (AI narrative)

Example output:
   "This is a simple LED indicator circuit operating at 5V.
    The circuit is missing a current-limiting resistor, which
    will cause the LED to draw excessive current (~300mA instead
    of 20mA) and burn out. Add a 220Ω resistor in series with
    the LED. This will limit current to 13.6mA and power
    dissipation to 0.03W."

👉 THIS IS YOUR CORE COMPETITIVE ADVANTAGE
```

### Layer 2: Visual WOW (SECONDARY) 🎨
```
What it does:  "Shows you WHAT'S WHERE and WHAT'S WRONG"

Visual feedback:
  ✓ Green boxes around correctly connected components
  ⚠ Yellow boxes for warnings
  🔴 Red boxes for critical issues
  
Current flow animation
  → Shows electron flow through circuit
  → Brightness indicates power
  → Color shows voltage levels
  
Component highlighting
  → Hover over component → See specs & failures
  → Click component → Get detailed analysis
  → Right-click → Get suggestions

3D visualization
  → Show PCB layout
  → Component placement
  → Heat dissipation heatmap
  
👉 MAKES SYSTEM FEEL ALIVE
```

### Layer 3: Interactive WOW (ADVANCED) ⚡
```
What it does:  "Lets you EXPERIMENT and LEARN"

Interactive controls:
  1. Drag resistor value slider → LED brightness changes in real-time
  2. Adjust battery voltage → Current/power updates
  3. Add/remove components → Simulation updates
  4. Click "What if?" → Explore scenarios
  
Learning mode:
  - Explanations for each change
  - Show why it works or fails
  - Suggest optimal values
  - Compare different designs
  
Export capabilities:
  - Export to KiCad
  - Export to shopping list
  - Export to simulation (ngspice)
  - Export 3D model for printing

👉 KILLER FEATURE FOR USERS
```

---

## Strategic Differentiators

### Why Synthra Wins

```
❌ Competitors: "Here's a model that detects components"
✅ Synthra: "Here's an tool that UNDERSTANDS and TEACHES circuits"

❌ Competitors: Just detection
✅ Synthra: Detection + Analysis + Explanation + Simulation + Teaching

❌ Competitors: Single-purpose
✅ Synthra: Debugging + Learning + Design + Verification
```

### Your Unfair Advantage

```
1. INTELLIGENCE WOW
   - Not just "I see a resistor"
   - But "This resistor is too small (dissipates 2W, rated for 0.5W)"
   
2. CONSTRAINT SOLVING
   - Not just "Add a resistor"
   - But "Add a 220Ω resistor rated 0.5W, from this supplier"
   
3. LEARNING ENGINE
   - Not just fixing circuits
   - But teaching WHY each component is necessary
   
4. REAL SIMULATION
   - Not just drawing
   - But actual voltage/current calculations
   
5. HARDWARE BRIDGE
   - Not just software
   - But export to PCB design (KiCad)
```

---

## Build Priorities (Timeline)

### Short Term (Next 4 weeks)
```
🔴 CRITICAL:
  1. Train YOLO model (1 week)
  2. Integrate ML detection to API (1 week)
  3. Build basic UI frontend (2 weeks)
  
🟡 IMPORTANT:
  4. Graph-based topology solver
  5. Make simulation interactive
```

### Medium Term (Weeks 5-12)
```
🟡 HIGH:
  1. Constraint solver (optimal values)
  2. KiCad export
  3. AC circuit analysis
  4. Component rating verification
  
🟢 MEDIUM:
  5. 3D visualization
  6. Multi-image circuit analysis
  7. User feedback loop
```

### Long Term (Months 4+)
```
🟢 NICE TO HAVE:
  1. Mobile app
  2. Cloud backend
  3. Collaboration features
  4. Circuit templates library
  5. Real-time multiplayer design
```

---

## Success Metrics

```
KPI #1: INTELLIGENCE
  ✅ Correctly identifies 90%+ of standard components
  ✅ Detects 95%+ of safety issues
  ✅ Suggestions are useful (>80% user acceptance)

KPI #2: PERFORMANCE  
  ✅ E2E analysis <500ms
  ✅ 99.9% uptime
  ✅ <100ms API response

KPI #3: USER VALUE
  ✅ Users can fix circuits 90% faster
  ✅ Hardware success rate improves 50%+
  ✅ Learning curve: <5 min

KPI #4: QUALITY
  ✅ <1% false positives
  ✅ Component detection mAP >0.9
  ✅ Simulation accuracy ±5%
```

---

## File Structure (Complete)

```
Synthra/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── components.ts              ✅ Component library
│   │   ├── modules/
│   │   │   ├── ml-detection.ts            ✅ YOLO inference
│   │   │   ├── circuit-analysis.ts        ✅ Analysis engine
│   │   │   ├── circuit-simulator.ts       ✅ OHM's Law
│   │   │   ├── circuit-graph.ts           ❌ TODO: Graph solver
│   │   │   ├── constraint-solver.ts       ❌ TODO: Value optimization
│   │   │   ├── ac-simulator.ts            ❌ TODO: AC circuits
│   │   │   └── kicad-exporter.ts          ❌ TODO: KiCad export
│   │   ├── routes/
│   │   │   └── circuit-api.ts             ✅ REST endpoints
│   │   ├── index.ts                       ✅ Server entry
│   │   └── websocket.ts                   ✅ WS handler
│   ├── models/
│   │   └── yolo-component-small.onnx      ❌ TODO: Train & export
│   ├── CIRCUIT_API_README.md              ✅ API docs
│   └── BACKEND_SETUP_GUIDE.md             ✅ Setup guide
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUploader.tsx          🔄 IN PROGRESS
│   │   │   ├── CircuitViewer.tsx          🔄 IN PROGRESS
│   │   │   ├── AnalysisPanel.tsx          ❌ TODO
│   │   │   ├── SimulationControls.tsx     ❌ TODO
│   │   │   └── CircuitTabs.tsx            ❌ TODO
│   │   ├── hooks/
│   │   │   ├── useCircuitAnalysis.ts      ❌ TODO
│   │   │   └── useCircuitSimulation.ts    ❌ TODO
│   │   ├── pages/
│   │   │   └── CircuitAnalyzer.tsx        🔄 IN PROGRESS
│   │   └── api.ts                         ❌ TODO
│   └── docs/
│       └── PHASE_C_FRONTEND_PLAN.md       📝 Reference
│
└── docs/
    ├── synthra-master-plan-v1.0.md        📚 Master plan
    ├── INTEGRATION_COMPLETION_REPORT.md   📊 Integration status
    └── PROJECT_STATUS_COMPLETE.md         📊 Overall status
```

---

## Next Actions (Do These First)

```
[ ] 1. Train YOLO model
      └─ Collect 100 labeled circuit images
      └─ Run training: yolo train (2-3 hours GPU)
      └─ Export: model.export(format='onnx')
      └─ Place: backend/models/yolo-component-small.onnx
      
[ ] 2. Test ML API
      └─ npm run dev
      └─ curl -X POST http://localhost:3000/api/circuit/analyze -F "image=@test.jpg"
      └─ Verify detections work
      
[ ] 3. Fix frontend LandingPage component
      └─ Already patched handleHotspotClick
      └─ Ensure CircuitSVG renders
      └─ Test UI loads without crashes
      
[ ] 4. Wire frontend to API
      └─ Create useCircuitAnalysis hook
      └─ Connect upload to /api/circuit/analyze
      └─ Display results in UI
      
[ ] 5. Build graph solver
      └─ Implement circuit graph from detections
      └─ Add topology validation
      └─ Enable advanced analysis
```

---

## Cost & Timeline Estimate

```
Reality Check:
  - Dataset creation: 3-4 weeks (if doing manually)
  - YOLO training: 5-10 hours GPU
  - Backend APIs: ✅ DONE (~40h of work)
  - Frontend UI: 2-3 weeks (~60h of work)
  - Integration testing: 1 week
  - Deployment: 3-5 days
  
Total: 6-10 weeks for MVP with full functionality

GPU Cost:
  - Google Colab (free): ~10h training
  - AWS G4: ~$0.5/hour × 8h ≈ $4
  - Your machine (if GPU): Free
```

---

## Questions For Strategic Direction

```
1. Dataset Source
   Q: Should we train on synthetic data or real photos?
   A: START with real photos (50-100), then augment

2. Model Size
   Q: YOLOv8 nano (6MB) vs small (27MB) vs medium (49MB)?
   A: Start nano, if accuracy bad upgrade to small

3. Component Count
   Q: How many components to detect?
   A: Start with 10 (basic), scale to 50+ later

4. Simulation Complexity
   Q: Simple OHM's Law or full SPICE simulation?
   A: Start simple (what we have), add AC later

5. Frontend Polish
   Q: Minimal or beautiful UI?
   A: Minimal now, polish after ML works

6. Deployment
   Q: Local, cloud, or both?
   A: Local first (ease testing), cloud later
```

---

This roadmap balances **speed** (get something working fast) with **ambition** (build competitive advantage).

🎯 **North Star:** Make Synthra the go-to tool for circuit analysis, learning, and debugging.
