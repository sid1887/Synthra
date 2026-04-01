/**
 * Schematic Editor Layout - IMPROVED
 *
 * Features:
 * - Click+drag to pan canvas (no mode switching)
 * - Click+drag components to move them (with grid snapping)
 * - Wire mode with visual feedback
 * - Zoom with mouse wheel
 * - Component pins with wiring capability
 */

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Circle, Line, Group } from 'react-konva';
import Konva from 'konva';
import { useCircuit } from '../contexts/CircuitContext';
import { useComponents } from '../hooks/useComponents';

const SchematicEditorLayout: React.FC = () => {
  const { circuit, addComponent, moveComponent, addNet } = useCircuit();
  const { components: componentLibrary, loading, error } = useComponents();
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);

  // Helper: Get component type from library
  const getComponentType = useCallback(
    (typeId: string | null) => {
      if (!typeId) return null;
      return componentLibrary.find((c) => c.id === typeId) || null;
    },
    [componentLibrary]
  );

  // UI state
  const [selectedTool, setSelectedTool] = useState<'select' | 'wire' | 'pan'>(
    'select'
  );
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null
  );
  const [draggedType, setDraggedType] = useState<string | null>(null);

  // Wiring state
  const [wireStartPin, setWireStartPin] = useState<{
    componentId: string;
    pinId: string;
  } | null>(null);
  const [wirePreviewPath, setWirePreviewPath] = useState<Array<{ x: number; y: number }>>([]);

  // Grid snap
  const GRID_SIZE = 10;
  const snap = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  /**
   * Palette drag start
   */
  const handlePaletteDragStart = (typeId: string) => {
    setDraggedType(typeId);
  };

  /**
   * Canvas drop - add component from palette
   */
  const handleCanvasDropPalette = () => {
    if (!draggedType || !stageRef.current) {
      setDraggedType(null);
      return;
    }

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();

    if (!pointer) {
      setDraggedType(null);
      return;
    }

    // Convert canvas coords to circuit coords
    const x = snap((pointer.x - stagePos.x) / scale);
    const y = snap((pointer.y - stagePos.y) / scale);

    // Create component
    const componentType = componentLibrary.find((c) => c.id === draggedType);
    if (!componentType) {
      setDraggedType(null);
      return;
    }

    // Generate label
    const symbol = draggedType;
    const existingCount = circuit.components.filter(
      (c) => c.label.startsWith(symbol)
    ).length;
    const label = `${symbol}${existingCount + 1}`;

    addComponent(draggedType, label, x, y);
    setDraggedType(null);
  };

  /**
   * Component drag on canvas
   */
  const handleComponentDragMove = (e: any, componentId: string) => {
    if (selectedTool !== 'select') return;

    const x = snap(e.target.x());
    const y = snap(e.target.y());
    moveComponent(componentId, x, y);
  };

  /**
   * Pin clicked - start or complete wire
   */
  const handlePinMouseDown = (componentId: string, pinName: string) => {
    if (selectedTool !== 'wire') return;

    if (wireStartPin) {
      // Complete the wire if it's a different component
      if (wireStartPin.componentId !== componentId) {
        addNet({
          id: `net-${Date.now()}`,
          name: '',
          pins: [
            {
              componentId: wireStartPin.componentId,
              pinId: wireStartPin.pinId,
              x: 0,
              y: 0,
            },
            {
              componentId,
              pinId: pinName,
              x: 0,
              y: 0,
            },
          ],
        });
      }
      setWireStartPin(null);
      setWirePreviewPath([]);
    } else {
      // Start a new wire
      setWireStartPin({ componentId, pinId: pinName });
      setWirePreviewPath([]);
    }
  };
  /**
   * Zoom
   */
  const handleWheel = (evt: any) => {
    if (!stageRef.current) return;

    evt.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const newScale = evt.evt.deltaY < 0 ? oldScale * 1.2 : oldScale / 1.2;
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setScale(newScale);
    setStagePos(newPos);
    stage.position(newPos);
    stage.scale({ x: newScale, y: newScale });
  };

  /**
   * Pan - works with middle mouse or space+drag (no mode switch needed)
   */
  const handleStageDragMove = (e: any) => {
    // Allow panning in pan mode or with middle mouse button
    const isMiddleMouse = e.evt?.button === 1;
    const isPanMode = selectedTool === 'pan';

    if (!isPanMode && !isMiddleMouse) return;

    const newPos = {
      x: e.target.x(),
      y: e.target.y(),
    };
    setStagePos(newPos);
  };

  // Generate Verilog from circuit
  const generatedVerilog = useMemo(() => {
    const lines: string[] = [];
    lines.push('module circuit(');
    lines.push('  // Ports');

    const inputs = circuit.components.filter(
      (c) =>
        getComponentType(c.typeId)?.category === 'Source'
    );
    const outputs = circuit.components.filter(
      (c) => getComponentType(c.typeId)?.category === 'IC'
    );

    if (inputs.length > 0 || outputs.length > 0) {
      if (inputs.length > 0) {
        lines.push(
          inputs.map((c) => `  input ${c.label}`).join(',\n')
        );
      }
      if (outputs.length > 0) {
        lines.push(
          outputs.map((c) => `  output ${c.label}`).join(',\n')
        );
      }
    }

    lines.push(');');
    lines.push('');
    lines.push('  // Component instances');

    circuit.components.forEach((comp) => {
      const compType = getComponentType(comp.typeId);
      if (compType) {
        lines.push(
          `  // ${comp.label}: ${compType.id} @ (${comp.x}, ${comp.y})`
        );
      }
    });

    lines.push('');
    lines.push('endmodule');

    return lines.join('\n');
  }, [circuit, getComponentType]);

  // Generate netlist
  const generatedNetlist = useMemo(() => {
    const lines: string[] = [];
    lines.push('* Generated Netlist');
    lines.push('* Synthra Circuit');
    lines.push('');

    circuit.components.forEach((comp) => {
      const compType = getComponentType(comp.typeId);
      if (compType?.spiceTemplate) {
        let instance = compType.spiceTemplate;
        instance = instance.replace('<index>', comp.label.replace(/[a-zA-Z]/g, ''));
        instance = instance.replace(
          '<resistance>',
          comp.paramValues?.resistance || '1k'
        );
        lines.push(instance);
      }
    });

    lines.push('');
    lines.push('.end');

    return lines.join('\n');
  }, [circuit, getComponentType]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '250px 1fr 300px',
        gridTemplateRows: '60px 1fr 40px',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0f172a',
        color: '#e0e7ff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* HEADER / TOOLBAR */}
      <div
        style={{
          gridColumn: '1 / -1',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '12px',
        }}
      >
        <button
          onClick={() => setSelectedTool('select')}
          style={{
            padding: '8px 12px',
            background:
              selectedTool === 'select'
                ? 'rgba(6, 182, 212, 0.2)'
                : 'transparent',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: selectedTool === 'select' ? '#06b6d4' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Select / Move (S)"
        >
          ➜ Select
        </button>

        <button
          onClick={() => setSelectedTool('wire')}
          style={{
            padding: '8px 12px',
            background:
              selectedTool === 'wire'
                ? 'rgba(6, 182, 212, 0.2)'
                : 'transparent',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: selectedTool === 'wire' ? '#06b6d4' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Wire / Connect (W)"
        >
          ⚡ Wire
        </button>

        <button
          onClick={() => setSelectedTool('pan')}
          style={{
            padding: '8px 12px',
            background:
              selectedTool === 'pan'
                ? 'rgba(6, 182, 212, 0.2)'
                : 'transparent',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: selectedTool === 'pan' ? '#06b6d4' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Pan / Navigate (P)"
        >
          ✋ Pan
        </button>

        <div
          style={{
            width: '1px',
            height: '24px',
            backgroundColor: '#334155',
            margin: '0 8px',
          }}
        />

        <button
          style={{
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>

        <button
          style={{
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </button>

        <button
          style={{
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Save (Ctrl+S)"
        >
          💾 Save
        </button>

        <button
          style={{
            padding: '8px 12px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid #22c55e',
            borderRadius: '4px',
            color: '#22c55e',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Simulate (Ctrl+R)"
        >
          ▶ Simulate
        </button>

        <div style={{ flex: 1 }} />

        <span
          style={{
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          Zoom: {(scale * 100).toFixed(0)}%
        </span>
      </div>

      {/* LEFT PANEL: COMPONENT PALETTE */}
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRight: '1px solid #334155',
          overflowY: 'auto',
          padding: '12px',
        }}
      >
        <div
          style={{
            marginBottom: '16px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#06b6d4',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Components
          {loading && <span style={{ color: '#64748b', marginLeft: '8px' }}>Loading...</span>}
          {error && <span style={{ color: '#ef4444', marginLeft: '8px' }}>Error</span>}
        </div>

        {componentLibrary.map((compType) => (
          <div
            key={compType.id}
            draggable
            onDragStart={() => handlePaletteDragStart(compType.id)}
            style={{
              padding: '8px',
              marginBottom: '6px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '4px',
              cursor: 'grab',
              fontSize: '13px',
              color: '#e0e7ff',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor =
                'rgba(6, 182, 212, 0.1)';
              (e.currentTarget as HTMLDivElement).style.borderColor = '#06b6d4';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor =
                '#0f172a';
              (e.currentTarget as HTMLDivElement).style.borderColor = '#334155';
            }}
          >
            <div style={{ fontWeight: 600 }}>{compType.id}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {compType.category}
            </div>
          </div>
        ))}

        <div
          style={{
            marginTop: '16px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#06b6d4',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Placed: {circuit.components.length}
        </div>

        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          {circuit.components.map((comp) => (
            <div
              key={comp.id}
              style={{
                padding: '4px 8px',
                marginBottom: '4px',
                backgroundColor:
                  selectedComponentId === comp.id
                    ? 'rgba(6, 182, 212, 0.2)'
                    : 'transparent',
                borderLeft:
                  selectedComponentId === comp.id
                    ? '2px solid #06b6d4'
                    : 'none',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedComponentId(comp.id)}
            >
              {comp.label}
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: CANVAS */}
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRight: '1px solid #334155',
          overflow: 'hidden',
          position: 'relative',
          cursor:
            selectedTool === 'pan'
              ? 'grab'
              : selectedTool === 'wire'
              ? 'crosshair'
              : 'default',
        }}
        onDrop={handleCanvasDropPalette}
        onDragOver={(e) => e.preventDefault()}
      >
        <Stage
          ref={stageRef}
          width={window.innerWidth - 550}
          height={window.innerHeight - 100}
          onWheel={handleWheel}
          style={{
            background: 'transparent',
            cursor:
              selectedTool === 'pan'
                ? 'grab'
                : selectedTool === 'wire'
                ? 'crosshair'
                : 'default',
          }}
          draggable={true}
          onDragMove={handleStageDragMove}
        >
          <Layer ref={layerRef}>
            {/* Grid */}
            {Array.from({ length: 100 }).map((_, i) => (
              <Line
                key={`vline-${i}`}
                points={[
                  i * GRID_SIZE * 4,
                  -1000,
                  i * GRID_SIZE * 4,
                  1000,
                ]}
                stroke="#334155"
                strokeWidth={1}
                opacity={0.3}
              />
            ))}
            {Array.from({ length: 100 }).map((_, i) => (
              <Line
                key={`hline-${i}`}
                points={[
                  -1000,
                  i * GRID_SIZE * 4,
                  1000,
                  i * GRID_SIZE * 4,
                ]}
                stroke="#334155"
                strokeWidth={1}
                opacity={0.3}
              />
            ))}

            {/* Origin */}
            <Circle x={0} y={0} radius={3} fill="#06b6d4" />

            {/* Components */}
            {circuit.components.map((comp) => {
              const compType = getComponentType(comp.typeId);
              if (!compType) return null;

              return (
                <Group key={comp.id}>
                  <Rect
                    x={comp.x - compType.width / 2}
                    y={comp.y - compType.height / 2}
                    width={compType.width}
                    height={compType.height}
                    fill={
                      selectedComponentId === comp.id
                        ? 'rgba(6, 182, 212, 0.3)'
                        : 'rgba(30, 41, 59, 0.8)'
                    }
                    stroke={
                      selectedComponentId === comp.id ? '#06b6d4' : '#475569'
                    }
                    strokeWidth={2}
                    cornerRadius={2}
                    draggable={selectedTool === 'select'}
                    onDragStart={() => setSelectedComponentId(comp.id)}
                    onDragMove={(e) => handleComponentDragMove(e, comp.id)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as any).getStage().container().style.cursor =
                        'move';
                    }}
                  />

                  <Text
                    x={comp.x - 20}
                    y={comp.y - 8}
                    text={comp.label}
                    fontSize={12}
                    fontFamily="monospace"
                    fill="#e0e7ff"
                    width={40}
                    align="center"
                    pointerEvents="none"
                  />

                  <Text
                    x={comp.x - 10}
                    y={comp.y + 2}
                    text={compType.id}
                    fontSize={10}
                    fontFamily="monospace"
                    fill="#06b6d4"
                    width={20}
                    align="center"
                    pointerEvents="none"
                  />

                  {/* PINS */}
                  {compType.pins?.map((pin, idx) => {
                    const pinX = comp.x - compType.width / 2 + (pin.x || idx * 10 + 5);
                    const pinY = comp.y - compType.height / 2 + (pin.y || compType.height / 2);

                    const isStartPin =
                      wireStartPin?.componentId === comp.id &&
                      wireStartPin?.pinId === pin.name;

                    return (
                      <Circle
                        key={`pin-${comp.id}-${pin.name}`}
                        x={pinX}
                        y={pinY}
                        radius={5}
                        fill={isStartPin ? '#fbbf24' : '#06b6d4'}
                        stroke="#0f172a"
                        strokeWidth={2}
                        onMouseDown={() => handlePinMouseDown(comp.id, pin.name)}
                        onMouseEnter={(e) => {
                          if (selectedTool === 'wire') {
                            (e.currentTarget as any).getStage().container()
                              .style.cursor = 'pointer';
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as any).getStage().container().style.cursor =
                            'default';
                        }}
                        opacity={0.8}
                      />
                    );
                  })}
                </Group>
              );
            })}

            {/* Wire preview when drawing */}
            {wireStartPin && wirePreviewPath.length > 0 && (
              <Line
                points={wirePreviewPath.flatMap((p) => [p.x, p.y])}
                stroke="#fbbf24"
                strokeWidth={2}
                opacity={0.6}
                dash={[5, 5]}
                pointerEvents="none"
              />
            )}

            {/* Nets */}
            {circuit.nets.map((net) => (
              <Group key={net.id}>
                {net.wireSegments?.map((seg, i) => (
                  <Line
                    key={`${net.id}-${i}`}
                    points={[seg.x1, seg.y1, seg.x2, seg.y2]}
                    stroke="#06b6d4"
                    strokeWidth={2}
                  />
                ))}
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>

      {/* RIGHT PANEL: CODE */}
      <div
        style={{
          backgroundColor: '#1e293b',
          borderLeft: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#06b6d4',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          Verilog
        </div>

        <div
          style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#94a3b8',
            backgroundColor: '#0f172a',
            padding: '8px',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'auto',
            flex: 1,
            border: '1px solid #334155',
            marginBottom: '12px',
          }}
        >
          {generatedVerilog}
        </div>

        <div
          style={{
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#06b6d4',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          Netlist
        </div>

        <div
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#94a3b8',
            backgroundColor: '#0f172a',
            padding: '8px',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'auto',
            flex: 1,
            border: '1px solid #334155',
          }}
        >
          {generatedNetlist}
        </div>
      </div>

      {/* STATUS BAR */}
      <div
        style={{
          gridColumn: '1 / -1',
          backgroundColor: '#1e293b',
          borderTop: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '16px',
          fontSize: '12px',
          color: '#64748b',
        }}
      >
        <span>Components: {circuit.components.length}</span>
        <span>Nets: {circuit.nets.length}</span>
        <div style={{ flex: 1 }} />
        <span>
          WebSocket:{' '}
          <span style={{ color: '#22c55e', fontWeight: 600 }}>Connected</span>
        </span>
      </div>
    </div>
  );
};

export default SchematicEditorLayout;
