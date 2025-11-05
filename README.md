# 🧠 Synthra — The Synthesis Era

**AI-driven Electronic Design Automation (EDA) platform**

> _Synthesize. Simulate. Simplify._

## Overview

Synthra is a web-first ECAD/EDA platform that transforms circuit images into living, simulated, and beautifully documented designs. It unites artificial intelligence, circuit physics, and human creativity into one integrated environment.

### Core Capabilities

- 🔍 **Vision**: Image-to-schematic conversion (printed, scanned, hand-drawn)
- ⚙️ **Synthesis**: Auto-generate SPICE netlists and Verilog/SystemVerilog
- 📊 **Simulation**: Analog (ngspice) and digital (Verilator) simulation
- 📜 **Documentation**: Publication-quality PDF generation with AI narratives
- 🎨 **SVE (Synthra Vector Engine)**: Autonomous AI-powered component symbol generation using SDXL-Turbo
- 🖥️ **Studio**: Interactive web-based schematic editor

## Architecture

```
synthra/
├── services/
│   ├── vision/          # Image processing & ML detection (YOLOv8)
│   ├── core/            # Netlist & HDL generation
│   ├── simulator/       # ngspice, Verilator integration
│   ├── docs/            # PDF generator (LaTeX + Jinja2)
│   ├── sve/             # 🎨 AI-powered component symbol generation (SDXL-Turbo)
│   └── api/             # FastAPI gateway
├── frontend/            # React + SVG editor
├── models/              # ML model weights & training
├── shared/              # Common schemas & utilities
└── docker/              # Docker compose & services
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- (Optional) Python 3.11+ for local development

### Run All Services

```bash
# Clone and start
git clone <repo-url> synthra
cd synthra
docker-compose up --build
```

Access:

- Frontend: <http://localhost:3000>
- API Gateway: <http://localhost:8000>
- API Docs: <http://localhost:8000/docs>
- SVE Service (AI): <http://localhost:8005>

## Development Roadmap

- [x] Project structure & Docker setup
- [ ] Image preprocessing pipeline
- [ ] ML detection service (YOLOv8)
- [ ] Netlist & HDL generation
- [ ] Simulation backend
- [ ] PDF generator
- [ ] Web frontend & editor
- [ ] API orchestration

## Tech Stack

| Layer | Technology |
|-------|------------|
| **ML** | YOLOv8, SAM, TrOCR, Tesseract |
| **Simulation** | ngspice, Xyce, Verilator, Icarus Verilog |
| **Backend** | FastAPI, Python 3.11+, PostgreSQL |
| **Frontend** | React, TypeScript, SVG.js |
| **Docs** | LaTeX, Jinja2, TinyTeX |
| **Infra** | Docker, Docker Compose, Git |

## License

MIT (TBD)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

**The Era of Synthesis Begins.**
