import { writable, derived } from 'svelte/store';

// Current route store
export const currentRoute = writable(window.location.hash.slice(1) || '/');

// Navigation function
export function navigate(path) {
  window.location.hash = path;
}

// Listen to hash changes
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    currentRoute.set(window.location.hash.slice(1) || '/');
  });
}

// Derived store for current tool
export const currentTool = derived(currentRoute, $route => {
  const parts = $route.split('/').filter(Boolean);
  return parts[0] || null;
});
