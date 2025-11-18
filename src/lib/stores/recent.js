import { writable } from 'svelte/store';

const STORAGE_KEY = 'recent_tools';
const MAX_RECENT = 10;

// Load recent tools from localStorage
function loadRecent() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Create recent tools store
function createRecentStore() {
  const { subscribe, set, update } = writable(loadRecent());

  return {
    subscribe,
    // Add tool to recent (move to top if exists)
    addRecent: (toolId) => {
      update(recent => {
        // Remove if already exists
        const filtered = recent.filter(id => id !== toolId);
        // Add to front
        const updated = [toolId, ...filtered].slice(0, MAX_RECENT);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }

        return updated;
      });
    },
    // Clear recent
    clear: () => {
      set([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };
}

export const recentTools = createRecentStore();
