import { useState, useCallback } from 'react';

export interface PinReference {
  componentId: string;
  pinIndex: number;
}

export interface WiringState {
  isWiring: boolean;
  startPin: PinReference | null;
  endPin: PinReference | null;
  previewPoints: Array<{ x: number; y: number }>;
}

interface WiringOptions {
  onWireCreate?: (startPin: PinReference, endPin: PinReference) => void;
  onCancel?: () => void;
  routingMode?: 'orthogonal' | 'curved' | 'straight';
}

export const useWiring = (options: WiringOptions = {}) => {
  const {
    onWireCreate,
    onCancel,
    routingMode = 'orthogonal',
  } = options;

  const [state, setState] = useState<WiringState>({
    isWiring: false,
    startPin: null,
    endPin: null,
    previewPoints: [],
  });

  // Start wiring from a pin
  const startWire = useCallback(
    (pin: PinReference, startPos: { x: number; y: number }) => {
      setState({
        isWiring: true,
        startPin: pin,
        endPin: null,
        previewPoints: [startPos],
      });
    },
    []
  );

  // Update preview as cursor moves
  const updatePreview = useCallback(
    (currentPos: { x: number; y: number }) => {
      if (!state.isWiring || !state.startPin) return;

      // Calculate preview points based on routing mode
      let previewPoints = [state.previewPoints[0]];

      if (routingMode === 'orthogonal') {
        // Orthogonal (Manhattan) routing
        const midX = (state.previewPoints[0].x + currentPos.x) / 2;
        previewPoints.push(
          { x: midX, y: state.previewPoints[0].y },
          { x: midX, y: currentPos.y },
          currentPos
        );
      } else if (routingMode === 'curved') {
        // Curved routing using quadratic bezier approximation
        const cp1 = {
          x: state.previewPoints[0].x,
          y: (state.previewPoints[0].y + currentPos.y) / 2,
        };
        const cp2 = {
          x: currentPos.x,
          y: (state.previewPoints[0].y + currentPos.y) / 2,
        };
        previewPoints.push(cp1, cp2, currentPos);
      } else {
        // Straight line
        previewPoints.push(currentPos);
      }

      setState((prev) => ({
        ...prev,
        previewPoints,
      }));
    },
    [state.isWiring, state.startPin, state.previewPoints, routingMode]
  );

  // End wire at another pin
  const endWire = useCallback(
    (endPin: PinReference, endPos: { x: number; y: number }) => {
      if (!state.isWiring || !state.startPin) return;

      // Validate pins are compatible
      if (state.startPin.componentId === endPin.componentId) {
        console.warn('Cannot connect pins on the same component');
        return;
      }

      // Update preview to endpoint
      updatePreview(endPos);

      // Create the wire
      onWireCreate?.(state.startPin, endPin);

      // Reset state
      setState({
        isWiring: false,
        startPin: null,
        endPin,
        previewPoints: [],
      });
    },
    [state.isWiring, state.startPin, updatePreview, onWireCreate]
  );

  // Cancel wiring
  const cancelWire = useCallback(() => {
    setState({
      isWiring: false,
      startPin: null,
      endPin: null,
      previewPoints: [],
    });
    onCancel?.();
  }, [onCancel]);

  // Get wire path for rendering
  const getWirePath = useCallback(() => {
    if (!state.previewPoints || state.previewPoints.length === 0) {
      return '';
    }

    const points = state.previewPoints;
    if (routingMode === 'straight') {
      return `M ${points[0].x} ${points[0].y} L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
    }

    // Generate SVG path for orthogonal/curved
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  }, [state.previewPoints, routingMode]);

  return {
    ...state,
    startWire,
    updatePreview,
    endWire,
    cancelWire,
    getWirePath,
  };
};

export default useWiring;
