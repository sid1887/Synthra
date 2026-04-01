import { useCallback } from 'react';
import { useSchematicStore } from '../store/schematicStore';

export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  currentIndex: number;
}

export const useUndoRedo = () => {
  // Assuming the schematicStore has undo/redo support via history
  const store = useSchematicStore();

  // Get history info (implementation depends on store structure)
  const getHistoryInfo = useCallback((): UndoRedoState => {
    // This is a placeholder - actual implementation depends on schematicStore
    return {
      canUndo: false,
      canRedo: false,
      historySize: 0,
      currentIndex: 0,
    };
  }, []);

  // Undo last action
  const undo = useCallback(() => {
    // Call undo method on store if it exists
    if ('undo' in store) {
      (store as any).undo();
    }
  }, [store]);

  // Redo last undone action
  const redo = useCallback(() => {
    // Call redo method on store if it exists
    if ('redo' in store) {
      (store as any).redo();
    }
  }, [store]);

  // Clear history
  const clearHistory = useCallback(() => {
    if ('clearHistory' in store) {
      (store as any).clearHistory();
    }
  }, [store]);

  // Keyboard shortcuts
  const setupKeyboardShortcuts = useCallback(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  return {
    undo,
    redo,
    clearHistory,
    getHistoryInfo,
    setupKeyboardShortcuts,
  };
};

export default useUndoRedo;
