import { useState, useCallback } from 'react';

export interface DragDropState {
  isDragging: boolean;
  draggedItem: unknown | null;
  ghostPosition: { x: number; y: number } | null;
  gridSnap: number;
}

interface DragDropOptions {
  gridSnap?: number;
  onDrop?: (x: number, y: number, item: unknown) => void;
  onDragStart?: (item: unknown) => void;
  onDragEnd?: () => void;
}

export const useDragDrop = (options: DragDropOptions = {}) => {
  const {
    gridSnap = 8,
    onDrop,
    onDragStart,
    onDragEnd,
  } = options;

  const [state, setState] = useState<DragDropState>({
    isDragging: false,
    draggedItem: null,
    ghostPosition: null,
    gridSnap,
  });

  const snapToGrid = useCallback(
    (value: number) => {
      if (gridSnap === 0) return value;
      return Math.round(value / gridSnap) * gridSnap;
    },
    [gridSnap]
  );

  const handleDragStart = useCallback(
    (item: unknown, e?: React.DragEvent | React.MouseEvent) => {
      setState({
        isDragging: true,
        draggedItem: item,
        ghostPosition: null,
        gridSnap,
      });
      onDragStart?.(item);
    },
    [gridSnap, onDragStart]
  );

  const handleDragMove = useCallback(
    (x: number, y: number) => {
      if (!state.isDragging) return;

      setState((prev) => ({
        ...prev,
        ghostPosition: {
          x: snapToGrid(x),
          y: snapToGrid(y),
        },
      }));
    },
    [state.isDragging, snapToGrid]
  );

  const handleDragEnd = useCallback(
    (x?: number, y?: number) => {
      if (x !== undefined && y !== undefined && state.draggedItem) {
        onDrop?.(snapToGrid(x), snapToGrid(y), state.draggedItem);
      }

      setState({
        isDragging: false,
        draggedItem: null,
        ghostPosition: null,
        gridSnap,
      });
      onDragEnd?.();
    },
    [state.draggedItem, gridSnap, snapToGrid, onDrop, onDragEnd]
  );

  return {
    ...state,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    snapToGrid,
  };
};

export default useDragDrop;
