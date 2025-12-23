import { writable } from 'svelte/store';
import Fuse from 'fuse.js';

function createSearchIndexStore() {
  const { subscribe, set, update } = writable({
    items: [],
    fuse: null,
    loading: false,
    error: null
  });

  async function fetchIndex() {
    update(state => ({ ...state, loading: true, error: null }));
    
    try {
      const response = await fetch('/index.json');
      if (!response.ok) {
        throw new Error('Failed to fetch search index');
      }
      
      const items = await response.json();
      
      // Initialize Fuse.js with the fetched items
      const fuse = new Fuse(items, {
        keys: [
          { name: 'title', weight: 2 },
          { name: 'summary', weight: 1.5 },
          { name: 'content', weight: 1 },
          { name: 'tags', weight: 1.2 },
          { name: 'categories', weight: 1.2 }
        ],
        threshold: 0.4,
        includeScore: true,
        minMatchCharLength: 2
      });
      
      set({ items, fuse, loading: false, error: null });
    } catch (error) {
      console.error('Error fetching search index:', error);
      set({ items: [], fuse: null, loading: false, error: error.message });
    }
  }

  function search(query) {
    let result = [];
    update(state => {
      if (state.fuse && query) {
        const searchResults = state.fuse.search(query);
        result = searchResults.map(r => r.item);
      }
      return state;
    });
    return result;
  }

  return {
    subscribe,
    fetchIndex,
    search
  };
}

export const searchIndex = createSearchIndexStore();
