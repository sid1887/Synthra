import React, { forwardRef } from 'react';
import './CircuitSVG.css';

interface CircuitSVGProps {
  onHotspotClick: (action: string) => void;
}

const CircuitSVG = forwardRef<SVGSVGElement, CircuitSVGProps>(
  ({ onHotspotClick }, ref) => {
    return (
      <svg
        ref={ref}
        className="circuit-svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background board */}
        <defs>
          <style>{`
            .circuit-bg { fill: #0a0e27; }
            .circuit-trace { stroke: #2a9d8f; stroke-width: 2; fill: none; }
            .circuit-trace-secondary { stroke: #1a7a6f; stroke-width: 1; fill: none; opacity: 0.6; }
            .chip-body { fill: #1a1f3a; stroke: #2a9d8f; stroke-width: 2; }
            .chip-pin { fill: #e0b614; }
            .hotspot { cursor: pointer; }
            .hotspot-base { fill: transparent; }
            .hotspot-glow { fill: none; stroke: #2a9d8f; stroke-width: 2; opacity: 0; }
            .hotspot:hover .hotspot-glow { opacity: 1; animation: hotspotGlow 0.6s ease-in-out infinite; }
            @keyframes hotspotGlow { 0%, 100% { stroke-width: 2; } 50% { stroke-width: 4; } }
            .hotspot-label { font-size: 12px; fill: #2a9d8f; font-family: 'Monaco', monospace; opacity: 0; pointer-events: none; }
            .hotspot:hover .hotspot-label { opacity: 1; }
            .component-text { font-size: 11px; fill: #aaa; font-family: 'Monaco', monospace; }
          `}</style>
        </defs>

        {/* Board background */}
        <rect className="circuit-bg" width="1200" height="800" />

        {/* Main circuit board frame */}
        <rect className="chip-body" x="150" y="100" width="900" height="600" rx="10" />

        {/* Layer 1: Main bus traces */}
        <g id="main-traces">
          {/* Power bus (red-ish gold) */}
          <path
            className="circuit-trace"
            d="M 200 200 L 1000 200 L 1000 250 L 200 250 L 200 200"
            stroke="#e0b614"
            fill="none"
            strokeWidth="3"
          />
          
          {/* Ground bus */}
          <path
            className="circuit-trace"
            d="M 200 700 L 1000 700 L 1000 650 L 200 650 L 200 700"
            stroke="#e0b614"
            fill="none"
            strokeWidth="3"
          />

          {/* Data bus vertical */}
          <line className="circuit-trace" x1="300" y1="200" x2="300" y2="700" />
          <line className="circuit-trace" x1="450" y1="200" x2="450" y2="700" />
          <line className="circuit-trace" x1="600" y1="200" x2="600" y2="700" />
          <line className="circuit-trace" x1="750" y1="200" x2="750" y2="700" />
          <line className="circuit-trace" x1="900" y1="200" x2="900" y2="700" />
        </g>

        {/* Layer 2: CPU Core (central chip) */}
        <g id="cpu-core">
          <rect className="chip-body" x="450" y="300" width="300" height="200" rx="5" />
          
          {/* CPU label */}
          <text className="component-text" x="600" y="330">
            CPU
          </text>
          <text className="component-text" x="570" y="480">
            Core
          </text>

          {/* Internal structure */}
          <line className="circuit-trace-secondary" x1="460" y1="350" x2="740" y2="350" />
          <line className="circuit-trace-secondary" x1="460" y1="400" x2="740" y2="400" />
          <line className="circuit-trace-secondary" x1="460" y1="450" x2="740" y2="450" />
        </g>

        {/* Layer 3: Peripheral components (hotspots) */}
        <g id="peripherals">
          {/* Upload hotspot - top left */}
          <g
            className="hotspot"
            data-hotspot="upload"
            data-reveal="0.75"
            onClick={() => onHotspotClick('upload')}
          >
            <circle className="hotspot-base" cx="250" cy="280" r="35" />
            <circle className="hotspot-glow" cx="250" cy="280" r="35" />
            <rect x="238" y="268" width="24" height="24" fill="none" stroke="#2a9d8f" strokeWidth="1.5" />
            <path d="M 244 276 L 250 270 L 256 276 M 250 270 L 250 280" stroke="#2a9d8f" fill="none" strokeWidth="1" />
            <text className="hotspot-label" x="250" y="330" textAnchor="middle">
              Upload
            </text>
          </g>

          {/* Camera hotspot - top center */}
          <g
            className="hotspot"
            data-hotspot="camera"
            data-reveal="0.75"
            onClick={() => onHotspotClick('camera')}
          >
            <circle className="hotspot-base" cx="600" cy="250" r="35" />
            <circle className="hotspot-glow" cx="600" cy="250" r="35" />
            <circle cx="600" cy="250" r="18" fill="none" stroke="#2a9d8f" strokeWidth="1.5" />
            <circle cx="600" cy="250" r="10" fill="none" stroke="#2a9d8f" strokeWidth="1" />
            <text className="hotspot-label" x="600" y="300" textAnchor="middle">
              Camera
            </text>
          </g>

          {/* Analyze hotspot - top right */}
          <g
            className="hotspot"
            data-hotspot="analyze"
            data-reveal="0.75"
            onClick={() => onHotspotClick('analyze')}
          >
            <circle className="hotspot-base" cx="950" cy="280" r="35" />
            <circle className="hotspot-glow" cx="950" cy="280" r="35" />
            <path
              d="M 950 265 L 965 280 L 950 295 M 935 280 L 950 280"
              stroke="#2a9d8f"
              fill="none"
              strokeWidth="2"
            />
            <text className="hotspot-label" x="950" y="330" textAnchor="middle">
              Analyze
            </text>
          </g>

          {/* Overview hotspot - left side */}
          <g
            className="hotspot"
            data-hotspot="overview"
            data-reveal="0.65"
            onClick={() => onHotspotClick('overview')}
          >
            <circle className="hotspot-base" cx="200" cy="450" r="30" />
            <circle className="hotspot-glow" cx="200" cy="450" r="30" />
            <rect x="195" y="440" width="10" height="10" fill="none" stroke="#2a9d8f" strokeWidth="1" />
            <rect x="210" y="440" width="10" height="10" fill="none" stroke="#2a9d8f" strokeWidth="1" />
            <rect x="195" y="455" width="10" height="10" fill="none" stroke="#2a9d8f" strokeWidth="1" />
            <rect x="210" y="455" width="10" height="10" fill="none" stroke="#2a9d8f" strokeWidth="1" />
            <text className="hotspot-label" x="170" y="455" textAnchor="middle">
              Overview
            </text>
          </g>

          {/* History hotspot - left bottom */}
          <g
            className="hotspot"
            data-hotspot="history"
            data-reveal="0.65"
            onClick={() => onHotspotClick('history')}
          >
            <circle className="hotspot-base" cx="200" cy="620" r="30" />
            <circle className="hotspot-glow" cx="200" cy="620" r="30" />
            <path
              d="M 200 605 L 215 620 M 192 612 Q 192 605 200 605 Q 208 605 208 612"
              stroke="#2a9d8f"
              fill="none"
              strokeWidth="1.5"
            />
            <text className="hotspot-label" x="170" y="625" textAnchor="middle">
              History
            </text>
          </g>

          {/* Schematic hotspot - right side */}
          <g
            className="hotspot"
            data-hotspot="schematic"
            data-reveal="0.65"
            onClick={() => onHotspotClick('schematic')}
          >
            <circle className="hotspot-base" cx="1000" cy="450" r="30" />
            <circle className="hotspot-glow" cx="1000" cy="450" r="30" />
            <path
              d="M 995 440 L 1005 440 L 1005 450 L 995 450 Z M 995 455 L 1005 460"
              stroke="#2a9d8f"
              fill="none"
              strokeWidth="1.5"
            />
            <text className="hotspot-label" x="1030" y="455" textAnchor="middle">
              Schematic
            </text>
          </g>

          {/* Simulation hotspot - right bottom */}
          <g
            className="hotspot"
            data-hotspot="simulation"
            data-reveal="0.65"
            onClick={() => onHotspotClick('simulation')}
          >
            <circle className="hotspot-base" cx="1000" cy="620" r="30" />
            <circle className="hotspot-glow" cx="1000" cy="620" r="30" />
            <path
              d="M 995 610 L 1000 620 L 1005 610 M 995 625 L 1000 615 L 1005 625"
              stroke="#2a9d8f"
              fill="none"
              strokeWidth="1.5"
            />
            <text className="hotspot-label" x="1030" y="625" textAnchor="middle">
              Simulation
            </text>
          </g>

          {/* Components hotspot - bottom center */}
          <g
            className="hotspot"
            data-hotspot="components"
            data-reveal="0.55"
            onClick={() => onHotspotClick('components')}
          >
            <circle className="hotspot-base" cx="600" cy="730" r="30" />
            <circle className="hotspot-glow" cx="600" cy="730" r="30" />
            <circle cx="595" cy="725" r="3" fill="#2a9d8f" />
            <circle cx="605" cy="725" r="3" fill="#2a9d8f" />
            <circle cx="600" cy="735" r="3" fill="#2a9d8f" />
            <line x1="595" y1="725" x2="600" y2="735" stroke="#2a9d8f" strokeWidth="0.5" />
            <line x1="605" y1="725" x2="600" y2="735" stroke="#2a9d8f" strokeWidth="0.5" />
            <text className="hotspot-label" x="600" y="770" textAnchor="middle">
              Components
            </text>
          </g>
        </g>

        {/* Layer 4: Connection nodes */}
        <g id="nodes" opacity="0.4">
          <circle cx="300" cy="280" r="4" fill="#2a9d8f" />
          <circle cx="450" cy="280" r="4" fill="#2a9d8f" />
          <circle cx="750" cy="280" r="4" fill="#2a9d8f" />
          <circle cx="900" cy="280" r="4" fill="#2a9d8f" />
          
          <circle cx="300" cy="620" r="4" fill="#2a9d8f" />
          <circle cx="450" cy="620" r="4" fill="#2a9d8f" />
          <circle cx="750" cy="620" r="4" fill="#2a9d8f" />
          <circle cx="900" cy="620" r="4" fill="#2a9d8f" />
        </g>
      </svg>
    );
  }
);

CircuitSVG.displayName = 'CircuitSVG';

export default CircuitSVG;
