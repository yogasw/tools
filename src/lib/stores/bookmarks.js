import { writable } from 'svelte/store';

const STORAGE_KEY = 'bookmarked_tools';

// Load bookmarked tools from localStorage
function loadBookmarks() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Create bookmarks store
function createBookmarksStore() {
  const { subscribe, set, update } = writable(loadBookmarks());

  return {
    subscribe,
    // Toggle bookmark
    toggle: (toolId) => {
      update(bookmarks => {
        const index = bookmarks.indexOf(toolId);
        let updated;

        if (index !== -1) {
          // Remove if already bookmarked
          updated = bookmarks.filter(id => id !== toolId);
        } else {
          // Add if not bookmarked
          updated = [...bookmarks, toolId];
        }

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }

        return updated;
      });
    },
    // Check if bookmarked
    isBookmarked: (toolId, bookmarks) => {
      return bookmarks.includes(toolId);
    },
    // Clear all
    clear: () => {
      set([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };
}

export const bookmarks = createBookmarksStore();
