import { useState, useCallback, useEffect } from 'react';

export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  cursorPosition: { x: number; y: number };
}

interface CanvasInteractionOptions {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (pan: { x: number; y: number }) => void;
  onCursorMove?: (pos: { x: number; y: number }) => void;
}

export const useCanvasInteractions = (options: CanvasInteractionOptions = {}) => {
  const {
    initialZoom = 1,
    minZoom = 0.1,
    maxZoom = 3,
    onZoomChange,
    onPanChange,
    onCursorMove,
  } = options;

  const [state, setState] = useState<CanvasState>({
    zoom: initialZoom,
    pan: { x: 0, y: 0 },
    isPanning: false,
    cursorPosition: { x: 0, y: 0 },
  });

  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle zoom with wheel (Ctrl+Wheel)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, state.zoom * delta));

      setState((prev) => ({ ...prev, zoom: newZoom }));
      onZoomChange?.(newZoom);
    },
    [state.zoom, minZoom, maxZoom, onZoomChange]
  );

  // Handle panning with middle mouse button
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 1) return; // Middle mouse button

      e.preventDefault();
      setState((prev) => ({ ...prev, isPanning: true }));
      setPanStart({ x: e.clientX - state.pan.x, y: e.clientY - state.pan.y });
    },
    [state.pan]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      setState((prev) => ({
        ...prev,
        cursorPosition: { x: e.clientX, y: e.clientY },
      }));
      onCursorMove?.({ x: e.clientX, y: e.clientY });

      if (!state.isPanning) return;

      const newPan = {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      };

      setState((prev) => ({ ...prev, pan: newPan }));
      onPanChange?.(newPan);
    },
    [state.isPanning, panStart, onPanChange, onCursorMove]
  );

  const handleMouseUp = useCallback(() => {
    setState((prev) => ({ ...prev, isPanning: false }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Plus: Zoom in
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        const newZoom = Math.min(maxZoom, state.zoom + 0.1);
        setState((prev) => ({ ...prev, zoom: newZoom }));
        onZoomChange?.(newZoom);
      }

      // Ctrl/Cmd + Minus: Zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        const newZoom = Math.max(minZoom, state.zoom - 0.1);
        setState((prev) => ({ ...prev, zoom: newZoom }));
        onZoomChange?.(newZoom);
      }

      // Home: Fit all (zoom = 1, pan = 0)
      if (e.key === 'Home') {
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          zoom: 1,
          pan: { x: 0, y: 0 },
        }));
        onZoomChange?.(1);
        onPanChange?.({ x: 0, y: 0 });
      }

      // Arrow keys: Pan
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const panAmount = e.shiftKey ? 50 : 10;
        let newPan = { ...state.pan };

        switch (e.key) {
          case 'ArrowUp':
            newPan.y += panAmount;
            break;
          case 'ArrowDown':
            newPan.y -= panAmount;
            break;
          case 'ArrowLeft':
            newPan.x += panAmount;
            break;
          case 'ArrowRight':
            newPan.x -= panAmount;
            break;
        }

        setState((prev) => ({ ...prev, pan: newPan }));
        onPanChange?.(newPan);
      }
    };

    window.addEventListener('wheel', handleWheel as EventListener, { passive: false });
    window.addEventListener('mousedown', handleMouseDown as EventListener);
    window.addEventListener('mousemove', handleMouseMove as EventListener);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel as EventListener);
      window.removeEventListener('mousedown', handleMouseDown as EventListener);
      window.removeEventListener('mousemove', handleMouseMove as EventListener);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, state, maxZoom, minZoom, onZoomChange, onPanChange]);

  // Reset zoom and pan
  const reset = useCallback(() => {
    setState({
      zoom: initialZoom,
      pan: { x: 0, y: 0 },
      isPanning: false,
      cursorPosition: { x: 0, y: 0 },
    });
    onZoomChange?.(initialZoom);
    onPanChange?.({ x: 0, y: 0 });
  }, [initialZoom, onZoomChange, onPanChange]);

  // Set zoom
  const setZoom = useCallback(
    (zoom: number) => {
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
      setState((prev) => ({ ...prev, zoom: newZoom }));
      onZoomChange?.(newZoom);
    },
    [minZoom, maxZoom, onZoomChange]
  );

  // Set pan
  const setPan = useCallback(
    (pan: { x: number; y: number }) => {
      setState((prev) => ({ ...prev, pan }));
      onPanChange?.(pan);
    },
    [onPanChange]
  );

  return {
    ...state,
    reset,
    setZoom,
    setPan,
  };
};

export default useCanvasInteractions;
