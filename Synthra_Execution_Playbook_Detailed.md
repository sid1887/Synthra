# Synthra Execution Playbook — Production Build Plan

**Version:** 1.1  
**Status:** Build-ready execution document  
**Audience:** GitHub Copilot Planning Agent, developer, reviewer  
**Goal:** Turn Synthra into a real, production-minded, open-source-first web app with a stable image understanding pipeline, component registry, circuit reconstruction, simulation, 2D/3D visualization, ML augmentation, automation, documentation, and deployment.

---

## 0. Non-Negotiable Principles

1. Build for real users, not for slides.
2. Every feature must produce visible output.
3. No simulation, 3D, or automation before the image understanding pipeline is stable.
4. Every module must be testable in isolation before integration.
5. Use deterministic logic wherever possible.
6. Use AI only where it clearly reduces ambiguity or manual work.
7. Persist intermediate results in JSON.
8. Keep every task small enough to finish in one session.
9. Prefer open-source libraries unless a hosted service is objectively better.
10. Design for constrained CPU and RAM from day one.
11. Unknowns must be first-class outcomes, not bugs.
12. The project must always be recoverable after failures.
13. The app must remain usable when advanced modules are disabled.
14. The registry, templates, and outputs must be versioned.
15. Do not let a fancy UI hide an empty backend.

---

## 1. Product Definition

### 1.1 One-line statement
Synthra turns real circuit images into understandable component lists, circuit interpretations, warnings, reconstructions, and guided next steps.

### 1.2 User problem
Users often see a circuit and cannot quickly identify:
- what parts are present
- what the circuit is likely doing
- whether wiring is wrong
- how to improve it
- what the next debugging step should be

### 1.3 Target users
Primary:
- electronics students
- beginners
- hobbyists

Secondary:
- educators
- makers
- lab assistants

Tertiary:
- engineers doing fast visual triage

### 1.4 Core use cases
1. Upload a breadboard photo and get component detection, a likely circuit label, and a beginner-friendly explanation.
2. Upload a simple LED circuit and get warnings about missing resistors, polarity issues, or uncertain parts.
3. Open a reconstructed circuit and compare the image, overlay, JSON graph, simulation, and explanation side by side.

### 1.5 Out of scope for the first release
- full SPICE-grade analog simulation
- complete PCB reverse engineering
- enterprise auth and multi-tenant billing
- fully custom model training from scratch
- industrial-grade CAD export compatibility

### 1.6 Success criteria
MVP:
- upload and camera input work
- stable image preprocessing
- structured component output
- clear circuit label
- explanation and warnings
- annotated image visible in UI

v1:
- component registry
- reconstruction JSON
- basic simulation
- history and exports
- validation and logging

Advanced:
- improved ML pipeline
- richer simulation
- 3D interaction
- automation workflows
- deeper registry coverage

---

## 2. Product Shape and User Journey

### 2.1 User flow
1. User opens Synthra.
2. User uploads or captures a circuit image.
3. Image is validated and preprocessed.
4. Detection pipeline identifies components.
5. Registry normalizes labels and roles.
6. Rule engine estimates circuit type.
7. Explanation engine generates readable output.
8. Diagnostic engine flags issues.
9. Overlay renders component boxes and labels.
10. Optional reconstruction, simulation, 3D, and export become available when confidence is sufficient.

### 2.2 The promise
Synthra should not claim certainty when it does not have it.  
It should give:
- what is known
- what is likely
- what is unknown
- what the user should do next

### 2.3 Product tone
- technical but approachable
- honest about uncertainty
- serious about safety and correctness
- useful before it is impressive

---

## 3. Recommended Architecture

### 3.1 Frontend
- **Next.js App Router**
- React
- Tailwind CSS
- Zustand for small state
- React Hook Form where form state matters
- React Three Fiber + Three.js for 3D
- optional charting only if it truly helps

### 3.2 Backend
- **FastAPI**
- Pydantic schemas
- Uvicorn for development
- Python for preprocessing, registry logic, inference orchestration
- OpenCV and Pillow for image handling
- ONNX Runtime for lightweight model inference

### 3.3 Data layer
- PostgreSQL for durable storage
- SQLite acceptable for local prototyping
- JSON files for portable intermediate artifacts
- Redis optional only if caching becomes necessary

### 3.4 ML layer
- open-source models first
- hosted inference only when local inference is too heavy
- model wrapper abstraction so providers can be swapped later

### 3.5 Graphics layer
- Canvas/SVG overlay for 2D annotation
- React Three Fiber for 3D scene rendering
- avoid heavy graphical effects until the pipeline is stable

---

## 4. Repository Structure

Suggested structure:

```text
synthra/
  apps/
    web/                # Next.js UI
    api/                # FastAPI service
  packages/
    shared/             # shared helpers
    schemas/            # JSON/Pydantic/Zod schemas
    registry/           # component + circuit registries
    preprocess/         # image processing
    inference/          # model wrappers
    reconstruction/     # graph builder
    simulation/         # simulation logic
    graphics/           # 2D/3D rendering helpers
    automation/         # event rules
    docs/               # generated docs/report templates
  data/
    components/
    circuits/
    samples/
    exports/
  scripts/
  tests/
  infra/
```

If the repo starts as a single app, do not force a monorepo immediately.  
Only split when the codebase becomes painful to maintain.

---

## 5. UI/UX Specification

### 5.1 Main dashboard layout
The main view should be a technical dashboard with 5 regions:

**Top bar**
- Synthra name
- version badge
- environment badge
- health indicator
- mode selector

**Left rail**
- upload
- camera capture
- sample gallery
- registry status
- model status

**Center workspace**
- raw image preview
- annotated overlay
- reconstruction canvas
- simulation view
- 3D scene

**Right details panel**
- detected components
- circuit label
- confidence
- warnings
- fixes
- explanation

**Bottom tab strip**
- Overview
- Components
- Reconstruction
- Simulation
- 3D
- Registry
- History
- Export
- Logs

### 5.2 Required visible states
- idle
- uploading
- preprocessing
- analyzing
- reconstructing
- simulating
- rendering 3D
- saving
- warning
- error
- insufficient image
- needs closer shot
- needs better lighting
- low confidence
- unknown circuit

### 5.3 Visual language
- dark technical theme by default
- strong color hierarchy
- confidence badges
- warning chips
- unknown labels should be visible and explicit
- simulation should be visually separate from analysis
- 3D should not overwhelm the analysis screen

### 5.4 Accessible interaction
- keyboard reachable upload and tabs
- screen-reader labels
- clear focus state
- readable contrast
- touch-friendly controls

### 5.5 UI principle
Every useful result must be visible immediately:
- image
- overlay
- components
- circuit type
- confidence
- warnings
- next actions

---

## 6. Data Model Strategy

### 6.1 Core principle
The system should never depend on unstructured state hidden in UI components.  
Use JSON contracts and database tables for all important objects.

### 6.2 Core registries
Create separate registries for:
1. **Components**
2. **Aliases**
3. **Symbols**
4. **Circuit templates**
5. **Image metadata**
6. **Analysis runs**
7. **Reconstruction graphs**
8. **Simulation runs**
9. **3D scenes**
10. **Automation rules**
11. **Exports**
12. **Model versions**
13. **Prompt versions**

### 6.3 Component registry fields
Each component entry should store:
- canonical name
- aliases
- category
- polarity behavior
- typical packages
- visual appearance notes
- symbol mapping
- typical circuit role
- confidence thresholds
- common mistakes
- example images
- notes for explanation generation

### 6.4 Circuit template fields
Each template should store:
- template ID
- template name
- required components
- optional components
- topology description
- expected current flow
- explanation text skeleton
- safety notes
- simulation assumptions
- known ambiguities
- confidence rules

### 6.5 Image record fields
- image ID
- source
- upload time
- file hash
- dimensions
- quality metrics
- preprocessing outputs
- analysis version
- reconstruction version
- user correction history

### 6.6 Result object fields
- request ID
- image metadata
- component list
- circuit label
- confidence score
- warnings
- suggestions
- fixes
- reconstruction graph
- simulation result
- 3D scene data
- automation events
- logs

---

## 7. JSON Contracts

### 7.1 Why JSON first
JSON is the common language between:
- backend
- frontend
- inference layer
- simulation
- 3D renderer
- export
- automation

### 7.2 Core analysis response
```json
{
  "requestId": "req_123",
  "image": {
    "imageId": "img_123",
    "width": 1280,
    "height": 720,
    "quality": {
      "blurry": false,
      "dark": false,
      "anglePoor": false
    }
  },
  "components": [],
  "circuit": {
    "label": "battery_resistor_led",
    "family": "simple_dc",
    "complexity": "simple",
    "confidence": 0.82
  },
  "explanation": {
    "short": "",
    "student": "",
    "engineer": ""
  },
  "warnings": [],
  "suggestions": [],
  "fixes": [],
  "enhancements": [],
  "guidance": {
    "askSecondAngle": false,
    "askCloserShot": false,
    "askTopDown": false
  },
  "reconstruction": null,
  "simulation": null,
  "scene3d": null,
  "automation": null,
  "status": "ok"
}
```

### 7.3 Component object
```json
{
  "id": "cmp_001",
  "label": "resistor",
  "canonicalLabel": "resistor",
  "confidence": 0.91,
  "bbox": { "x": 100, "y": 120, "w": 80, "h": 30 },
  "orientation": "horizontal",
  "polarity": "na",
  "role": "current_limit",
  "unknown": false
}
```

### 7.4 Error object
```json
{
  "code": "LOW_CONFIDENCE",
  "message": "Detection confidence is low for one or more components.",
  "severity": "medium",
  "componentId": "cmp_003",
  "action": "Retake photo from top-down with better lighting."
}
```

---

## 8. Open-Source Tooling Plan

### 8.1 Frontend tools
- Next.js for application structure and route handlers
- Tailwind CSS for styling speed
- Zustand for simple state
- React Hook Form for uploads/settings if needed
- React Three Fiber for 3D
- Three.js for rendering primitives

### 8.2 Backend tools
- FastAPI for API contracts
- Pydantic for schema validation
- OpenCV for image processing
- Pillow for image I/O and orientation correction
- ONNX Runtime for model inference
- PostgreSQL for persistence
- SQLite for local development

### 8.3 How each tool should be used
**Next.js**
- use App Router
- keep UI and route handlers close to each other
- use server routes for light orchestration only

**FastAPI**
- use for heavier processing endpoints
- expose strict request and response models
- generate OpenAPI docs automatically

**OpenCV**
- resize
- denoise
- deskew
- threshold
- crop
- compute quality heuristics

**ONNX Runtime**
- run exported models with lower runtime overhead than many direct training frameworks
- wrap inference in a provider interface

**React Three Fiber**
- use for the 3D tab
- render declaratively
- bind interaction to scene state
- keep models modular

**PostgreSQL**
- store registries, runs, corrections, and versioned outputs
- avoid stuffing all state into files once persistence matters

---

## 9. Component Detection Pipeline

### 9.1 Goal
Transform a raw circuit image into a clean list of canonical components with confidence values.

### 9.2 Pipeline order
1. validate file
2. preprocess image
3. detect candidate regions
4. classify candidate regions
5. normalize names
6. deduplicate overlapping detections
7. assign roles
8. compute confidence
9. mark unknowns
10. emit JSON

### 9.3 Canonical component classes for phase 1
Start with a small supported set:
- resistor
- capacitor
- LED
- diode
- transistor
- switch
- battery
- ground
- wire
- junction
- IC placeholder
- motor / load placeholder

### 9.4 Label normalization
The registry should normalize:
- synonyms
- noisy model labels
- OCR-derived labels
- mixed-case variants
- shorthand names

### 9.5 Unknown handling
Unknown is not failure. It is a legitimate output when:
- confidence is too low
- the part is unsupported
- labels conflict
- the image is too unclear

### 9.6 Component output rules
Each detection should include:
- canonical label
- raw label
- confidence
- bounding box
- orientation
- role
- notes
- uncertainty status

---

## 10. Circuit Identification Engine

### 10.1 Purpose
Once components are known, identify the likely circuit class.

### 10.2 First templates
- battery + resistor + LED
- switch-controlled LED
- resistor divider
- series chain
- parallel chain
- diode protection circuit
- transistor switch
- unknown / incomplete

### 10.3 Rule engine behavior
The engine should:
- check required parts
- check likely topology
- compare current path expectations
- infer likely intent
- emit confidence score
- produce fallback labels when uncertain

### 10.4 Output examples
- simple_dc
- led_indicator
- voltage_divider
- switch_controlled_load
- unknown_simple_circuit
- incomplete_topology

### 10.5 Confidence policy
- above 0.80: strong label
- 0.65–0.80: likely label
- 0.50–0.65: weak label + warning
- below 0.50: unknown / needs more context

---

## 11. Explanation Engine

### 11.1 Why explanation matters
A correct detection output that the user cannot understand is not enough. The user needs context.

### 11.2 Explanation layers
1. short summary
2. student-friendly summary
3. engineer-friendly summary
4. warning-focused summary
5. action summary

### 11.3 Explanation rules
- be honest about uncertainty
- never present guesses as fact
- tie explanation to detected parts
- keep beginner explanations readable
- keep technical explanations precise

### 11.4 Explanation outputs
- what the circuit likely does
- why each part matters
- what could be wrong
- what to verify next
- how to improve the build

---

## 12. 2D Overlay / Annotation Engine

### 12.1 Purpose
Show the user exactly what Synthra found.

### 12.2 Overlay requirements
- bounding boxes
- labels
- confidence scores
- unknown badges
- warning markers
- missing-part markers
- toggle raw vs annotated
- focus on one part at a time

### 12.3 Visual rules
- do not overlap labels excessively
- keep annotations readable
- use distinct colors for:
  - confirmed
  - uncertain
  - warning
  - missing
  - unknown

### 12.4 Overlay output
The overlay should be generated from the same JSON as the detection output.

---

## 13. Reconstruction Engine

### 13.1 Goal
Create a circuit graph from detected components and relationships.

### 13.2 Reconstruction levels
- partial graph
- best-effort graph
- confident graph
- incomplete graph

### 13.3 Graph objects
- nodes
- edges
- components
- connectors
- uncertainty tags
- missing-edge placeholders

### 13.4 Reconstruction policy
If the image is not enough:
- return a partial graph
- mark the missing data
- ask for another angle
- do not invent connections silently

### 13.5 Reconstruction outputs
- graph JSON
- simplified schematic view
- node-edge relationships
- confidence map

---

## 14. Simulation Engine

### 14.1 Initial simulation scope
Start with basic DC-style and state-based reasoning:
- battery
- resistor
- LED
- switch
- diode
- simple capacitor behavior

### 14.2 Simulation order
1. consume reconstruction JSON
2. validate topology
3. infer connection paths
4. estimate behavior
5. emit results
6. display simulation state

### 14.3 Simulation modes
- static
- step-based
- simple what-if
- component swap
- component removal

### 14.4 Simulation outputs
- active path
- likely current flow
- component status
- expected behavior
- warnings
- assumptions used
- confidence score

### 14.5 Simulation honesty rule
Never call approximate behavior a full physical simulation.

---

## 15. 3D Visualization Engine

### 15.1 Role of 3D
3D should help users understand the circuit physically. It is not the truth source.

### 15.2 3D progression
Phase 1:
- symbolic board
- simple components
- wire paths

Phase 2:
- camera orbit
- hover interactions
- focus modes
- scene lighting

Phase 3:
- isolation mode
- current flow glow
- scene export
- low-end fallback

### 15.3 3D data source
The 3D scene must be built from reconstruction JSON and component metadata.

### 15.4 3D fallback
If 3D is too heavy or fails:
- fallback to 2D
- preserve analysis results
- keep the app usable

---

## 16. Automation Engine

### 16.1 Purpose
Automation should save time after analysis, not control the core pipeline.

### 16.2 Trigger examples
- analysis complete
- low confidence
- unknown component
- missing resistor
- reconstruction failed
- export requested
- user correction saved

### 16.3 Action examples
- write report
- export JSON
- export markdown
- save history
- generate summary
- suggest next capture step

### 16.4 Rule
Automation must not block analysis if automation fails.

---

## 17. ML Pipeline

### 17.1 ML goals
Use ML to improve:
- detection
- ambiguity handling
- explanation quality
- classification confidence
- registry growth

### 17.2 ML boundaries
ML should not replace:
- schema validation
- topology rules
- safety checks
- deterministic fallbacks

### 17.3 Pipeline stages
1. collect data
2. validate data
3. annotate data
4. normalize labels
5. train or fine-tune
6. export model
7. benchmark
8. compare
9. promote if better

### 17.4 Inference approach
- keep model wrappers modular
- support provider swapping
- cache results
- avoid loading too many models at once

---

## 18. Real Data Strategy

### 18.1 Core principle
The system must grow from real or verified data, not from meaningless dummy data.

### 18.2 Acceptable data sources
- manually photographed circuits
- validated open-source diagrams
- open symbol libraries
- user-corrected examples
- community samples with usable licensing
- verified textbooks or educational examples when permitted

### 18.3 Data entry workflow
1. ingest raw source
2. validate license
3. verify correctness
4. normalize names
5. add metadata
6. link examples
7. store version
8. allow correction
9. re-benchmark

### 18.4 Registry growth strategy
- start small
- keep quality high
- version everything
- expand by verified additions only

---

## 19. Backend API Plan

### 19.1 Core routes
- `GET /health`
- `GET /health/modules`
- `POST /analyze`
- `POST /reconstruct`
- `POST /simulate`
- `POST /export`
- `GET /registry/components`
- `GET /registry/circuits`
- `POST /registry/correct`
- `GET /history`

### 19.2 API expectations
Every route should:
- validate input
- return structured JSON
- handle errors cleanly
- log request ID
- enforce limits
- support predictable failure modes

### 19.3 Error policy
Use explicit error objects:
- invalid file
- unsupported format
- too large
- low confidence
- model unavailable
- timeout
- preprocessing failure
- reconstruction failure

---

## 20. Observability and Logging

### 20.1 Required logs
- requestId
- user action
- upload size
- preprocessing time
- inference time
- parse success/failure
- reconstruction time
- simulation time
- cache hits
- cache misses
- export success/failure

### 20.2 Metrics
- latency
- error rate
- confidence distribution
- unknown rate
- retry rate
- cache hit rate
- memory usage
- CPU usage

### 20.3 Why this matters
If the system fails, the logs must explain why.

---

## 21. Performance and Memory Constraints

### 21.1 Design for limited hardware
- compress images before upload
- resize on preprocess
- run only necessary models
- defer 3D loading until needed
- keep simulation cheap first
- avoid parallel heavy inference jobs

### 21.2 Low-memory strategy
- free temporary buffers
- release model objects when not needed
- cache selectively
- keep scenes light
- use simplified materials and geometry

### 21.3 Recovery strategy
- if model call fails, return safe fallback
- if 3D fails, keep 2D
- if simulation fails, keep analysis
- if reconstruction fails, keep overlay and explanation

---

## 22. Versioning Strategy

Version these independently:
- app version
- registry version
- prompt version
- model version
- schema version
- simulation version
- 3D scene version

Never update them invisibly.

---

## 23. Testing Strategy

### 23.1 Test layers
- schema tests
- preprocessing tests
- registry tests
- detection tests
- rule tests
- reconstruction tests
- simulation tests
- overlay tests
- API tests
- UI tests
- export tests

### 23.2 Golden cases
Create a small set of verified images and expected outputs.
Use them as regression anchors.

### 23.3 Failure tests
- corrupted file
- wrong file type
- blurry image
- dark image
- no circuit in image
- low confidence
- missing component
- broken model response
- slow server

---

## 24. Deployment Plan

### 24.1 Deployment targets
- frontend to a web host
- backend to a container-friendly service
- database to managed PostgreSQL or reliable local instance

### 24.2 Environments
- dev
- staging
- production

### 24.3 Release practice
- pin versions
- verify before promotion
- keep rollback path ready
- keep feature flags for advanced modules

---

## 25. Exact Copilot Operating Rules

When GitHub Copilot Planning Agent is used, it must operate like a build engineer.

### It must:
- create real files
- write actual code
- honor the phase order
- preserve working behavior
- add logging
- keep schemas consistent
- prefer open-source tools
- keep CPU/RAM in mind
- update docs when code changes
- stop and report if a dependency is missing

### It must not:
- claim work is done unless the code exists
- jump to simulation before the pipeline exists
- jump to 3D before reconstruction exists
- replace a real implementation with placeholders
- delete a working path without a migration path

---

## 26. Copilot Instruction Prompt

Use the following as the controlling prompt for Copilot:

```text
You are a build agent for Synthra.

Your job is to implement the product in real code, not to summarize it.

Rules:
- Do not say a feature is complete unless the code exists and runs.
- Do not jump to simulation, 3D, or automation before image understanding is stable.
- Do not skip file creation.
- Do not replace real work with placeholder text.
- Do not use dummy data where a real registry or real logic is required.
- Do not remove working functionality.
- Do not change architecture without a reason.
- Every module must have inputs, outputs, error handling, and logs.
- Persist intermediate results as JSON.
- Respect CPU and RAM constraints.
- Use open-source tools whenever they fit the problem.
- Use hosted APIs only where local inference is too heavy or too unstable.

Current mission:
Build Synthra as a production-minded web app with:
1. image upload and preprocessing
2. component registry and normalization
3. circuit template matching
4. explanations and warnings
5. annotated 2D overlay
6. reconstruction graph
7. basic simulation
8. 3D visualization
9. automation triggers
10. documentation and export
11. testing and deployment readiness

Execution order:
1. app shell and repository structure
2. JSON schemas and data contracts
3. upload + preprocessing
4. detection cleanup
5. circuit identification
6. explanation and diagnostics
7. registry expansion
8. reconstruction graph
9. simulation engine
10. 3D visualization
11. automation layer
12. export + docs
13. tests + validation
14. deployment hardening

For each step:
- list exact files touched
- write the actual code
- show how to run it
- show the visible result
- define the next step

Do not summarize instead of implementing.
```

---

## 27. Suggested Implementation Order

### Phase A — Core foundation
- app shell
- upload
- preprocessing
- schemas
- registry seed
- analysis API
- basic overlay
- explanation and warnings

### Phase B — Production expansion
- component database expansion
- circuit templates
- reconstruction graph
- history
- export
- validation
- stronger logging

### Phase C — Simulation
- simple electrical reasoning
- switch states
- what-if logic
- result visualization

### Phase D — 3D
- symbolic scene
- interaction
- camera
- component focus
- board layout

### Phase E — ML growth
- detector improvement
- label normalization
- correction learning
- benchmark harness
- model versioning

### Phase F — Automation and release
- workflow triggers
- report automation
- release packaging
- deployment readiness

---

## 28. What Success Looks Like

A strong Synthra build means:

- a real image can be analyzed
- a result is returned as JSON
- the UI shows the result clearly
- confidence is visible
- warnings are useful
- reconstruction is possible for simple cases
- simulation is honest and limited
- 3D works when enabled and falls back safely
- the registry grows over time
- the app remains stable on limited hardware

---

## 29. Final Rule

Build the real pipeline first.  
Then make it smarter.  
Then make it prettier.  
Then make it bigger.

Do not reverse that order.
