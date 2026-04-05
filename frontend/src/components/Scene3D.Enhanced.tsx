/**
 * Scene3D Component - Enhanced with Three.js 3D Rendering
 * Visualizes circuit components in 3D space with interactive controls
 */

import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { usePhaseCStore } from '../store/phaseC.store';
import './Scene3D.css';

/**
 * 3D Component Models
 */
interface Component3D {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  label: string;
}

/**
 * Resistor Component - 3D cylindrical shape
 */
const Resistor: React.FC<{ pos: [number, number, number]; color: string; label: string }> = ({ pos, color, label }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.3, 0.3, 1.5, 16]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      <text position={[0, 1.2, 0]} fontSize={0.4} anchorX="center" anchorY="bottom" color="white">
        {label}
      </text>
    </group>
  );
};

/**
 * Capacitor Component - 3D plate shape
 */
const Capacitor: React.FC<{ pos: [number, number, number]; color: string; label: string }> = ({ pos, color, label }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.003;
    }
  });

  return (
    <group position={pos}>
      <mesh ref={meshRef} position={[-0.4, 0, 0]}>
        <boxGeometry args={[0.2, 1, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.4, 0, 0]}>
        <boxGeometry args={[0.2, 1, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      <text position={[0, 1.2, 0]} fontSize={0.4} anchorX="center" anchorY="bottom" color="white">
        {label}
      </text>
    </group>
  );
};

/**
 * Inductor Component - 3D coil shape
 */
const Inductor: React.FC<{ pos: [number, number, number]; color: string; label: string }> = ({ pos, color, label }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.008;
    }
  });

  return (
    <group ref={meshRef} position={pos}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, i * 0.3, 0]}>
          <torusGeometry args={[0.4, 0.1, 8, 16]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <text position={[0, 1.5, 0]} fontSize={0.4} anchorX="center" anchorY="bottom" color="white">
        {label}
      </text>
    </group>
  );
};

/**
 * Power Source Component - 3D sphere
 */
const PowerSource: React.FC<{ pos: [number, number, number]; color: string; label: string }> = ({ pos, color, label }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.6, 4]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} wireframe={false} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={0.8} color={color} />
      <text position={[0, 1.1, 0]} fontSize={0.4} anchorX="center" anchorY="bottom" color="white">
        {label}
      </text>
    </group>
  );
};

/**
 * Connection Wire - 3D line between components
 */
const Wire: React.FC<{ start: [number, number, number]; end: [number, number, number]; color: string }> = ({ start, end, color }) => {
  const lineRef = useRef<THREE.BufferGeometry>(null);

  return (
    <line>
      <bufferGeometry ref={lineRef}>
        <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([...start, ...end])} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  );
};

/**
 * Scene Configuration - Loads components based on mode
 */
interface SceneProps {
  mode: 'power' | 'temperature' | 'confidence' | 'flow';
  components: Component3D[];
}

const Scene3DContent: React.FC<SceneProps> = ({ mode, components }) => {
  const meshRef = useRef<THREE.Group>(null);

  // Color mapping by mode
  const getModeColor = (index: number) => {
    const colors: Record<string, string[]> = {
      power: ['#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#0066ff'],
      temperature: ['#0066ff', '#00ccff', '#00ff66', '#ffff00', '#ff0000'],
      confidence: ['#666666', '#999999', '#cccccc', '#ffffff', '#ff00ff'],
      flow: ['#00ff00', '#00ffff', '#0099ff', '#0066ff', '#003366'],
    };
    return colors[mode][index % 5];
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, 10, 10]} intensity={0.5} color="#0066ff" />

      {/* Environment */}
      <Environment preset="city" intensity={0.5} />
      <Grid args={[10, 10]} cellSize={0.5} cellColor="#444" sectionSize={2} sectionColor="#888" fadeDistance={40} fadeStrength={1} />

      {/* Components */}
      <group ref={meshRef}>
        {components.map((comp, idx) => {
          const color = getModeColor(idx);
          switch (comp.type) {
            case 'resistor':
              return <Resistor key={comp.id} pos={comp.position} color={color} label={comp.label} />;
            case 'capacitor':
              return <Capacitor key={comp.id} pos={comp.position} color={color} label={comp.label} />;
            case 'inductor':
              return <Inductor key={comp.id} pos={comp.position} color={color} label={comp.label} />;
            case 'power':
              return <PowerSource key={comp.id} pos={comp.position} color={color} label={comp.label} />;
            default:
              return null;
          }
        })}
      </group>

      {/* Connection wires */}
      {components.length > 1 &&
        components.slice(0, -1).map((comp, idx) => (
          <Wire
            key={`wire-${idx}`}
            start={comp.position}
            end={components[idx + 1].position}
            color={getModeColor(idx)}
          />
        ))}
    </>
  );
};

/**
 * Main Scene3D Component
 */
interface Scene3DProps {
  analysisId: string;
}

export const Scene3D: React.FC<Scene3DProps> = ({ analysisId }) => {
  const [mode, setMode] = useState<'power' | 'temperature' | 'confidence' | 'flow'>('power');
  const { loadScene3DVisualization } = usePhaseCStore();

  // Mock components for demo (replace with real API data)
  const components: Component3D[] = [
    { id: 'v1', type: 'power', position: [-4, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#ff0000', label: 'V1' },
    { id: 'r1', type: 'resistor', position: [-2, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#ff6600', label: 'R1' },
    { id: 'c1', type: 'capacitor', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#ffcc00', label: 'C1' },
    { id: 'l1', type: 'inductor', position: [2, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#00ff00', label: 'L1' },
    { id: 'r2', type: 'resistor', position: [4, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#0066ff', label: 'R2' },
  ];

  return (
    <div className="scene3d-container">
      <div className="scene3d-header">
        <h2>3D Circuit Visualization</h2>
        <div className="scene3d-controls">
          <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="mode-selector">
            <option value="power">Power Distribution</option>
            <option value="temperature">Temperature Map</option>
            <option value="confidence">Confidence Level</option>
            <option value="flow">Signal Flow</option>
          </select>
        </div>
      </div>

      <div className="canvas-container">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={50} />
          <Scene3DContent mode={mode} components={components} />
          <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={50} />
        </Canvas>
      </div>

      <div className="scene3d-stats">
        <div className="stat">
          <span className="label">Components:</span>
          <span className="value">{components.length}</span>
        </div>
        <div className="stat">
          <span className="label">Connections:</span>
          <span className="value">{components.length - 1}</span>
        </div>
        <div className="stat">
          <span className="label">Visualization Mode:</span>
          <span className="value">{mode}</span>
        </div>
      </div>

      <div className="scene3d-legend">
        <h3>Legend</h3>
        <div className="legend-item">
          <span className="legend-icon" style={{ backgroundColor: '#ff0000' }}></span>
          <span>Power Source</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon" style={{ backgroundColor: '#ff6600' }}></span>
          <span>Resistor</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon" style={{ backgroundColor: '#ffcc00' }}></span>
          <span>Capacitor</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon" style={{ backgroundColor: '#00ff00' }}></span>
          <span>Inductor</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon" style={{ backgroundColor: '#0066ff' }}></span>
          <span>Component</span>
        </div>
      </div>

      <div className="scene3d-instructions">
        <p><strong>Controls:</strong> Left-click drag to rotate • Scroll to zoom • Right-click drag to pan</p>
      </div>
    </div>
  );
};

export default Scene3D;
