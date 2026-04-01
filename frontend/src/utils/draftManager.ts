export interface Draft {
  id: string;
  name: string;
  data: unknown;
  timestamp: number;
  version: number;
}

const DRAFT_KEY_PREFIX = 'synthra_draft_';
const DRAFT_INDEX_KEY = 'synthra_drafts_index';
const CURRENT_VERSION = 1;

export const draftManager = {
  // Save a draft
  saveDraft: (name: string, data: unknown): Draft => {
    const draft: Draft = {
      id: `${DRAFT_KEY_PREFIX}${Date.now()}`,
      name,
      data,
      timestamp: Date.now(),
      version: CURRENT_VERSION,
    };

    try {
      localStorage.setItem(draft.id, JSON.stringify(draft));

      // Update index
      const index = draftManager.getIndex();
      index.push({ id: draft.id, name, timestamp: draft.timestamp });
      localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(index));

      return draft;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  },

  // Load a draft
  loadDraft: (id: string): Draft | null => {
    try {
      const data = localStorage.getItem(id);
      if (!data) return null;
      return JSON.parse(data) as Draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  },

  // Get all drafts
  getAllDrafts: (): Draft[] => {
    const index = draftManager.getIndex();
    return index
      .map((item) => draftManager.loadDraft(item.id))
      .filter((draft) => draft !== null) as Draft[];
  },

  // Get draft index (metadata only)
  getIndex: (): Array<{ id: string; name: string; timestamp: number }> => {
    try {
      const data = localStorage.getItem(DRAFT_INDEX_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load draft index:', error);
      return [];
    }
  },

  // Delete a draft
  deleteDraft: (id: string): void => {
    try {
      localStorage.removeItem(id);

      // Update index
      const index = draftManager.getIndex();
      const filtered = index.filter((item) => item.id !== id);
      localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  },

  // Clear all drafts
  clearAll: (): void => {
    try {
      const index = draftManager.getIndex();
      index.forEach((item) => localStorage.removeItem(item.id));
      localStorage.removeItem(DRAFT_INDEX_KEY);
    } catch (error) {
      console.error('Failed to clear drafts:', error);
    }
  },

  // Auto-save with debouncing
  createAutoSaver: (saveInterval = 30000) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastData: unknown = null;

    return {
      save: (name: string, data: unknown) => {
        lastData = data;

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          try {
            draftManager.saveDraft(`${name} (auto)`, lastData);
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }, saveInterval);
      },

      cancel: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      },

      flush: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          if (lastData) {
            draftManager.saveDraft(`Auto-save`, lastData);
          }
        }
      },
    };
  },
};

export default draftManager;
