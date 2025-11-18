import { writable, derived } from 'svelte/store';

// Current route store using history API (no hash)
const getInitialPath = () => {
  if (typeof window === 'undefined') return '/';
  // Handle GitHub Pages base path
  const path = window.location.pathname.replace(/^\/tools\/?/, '/');
  return path || '/';
};

export const currentRoute = writable(getInitialPath());

// Navigation function using history API
export function navigate(path) {
  // For GitHub Pages, prepend base path in production
  const basePath = import.meta.env.PROD ? '/tools' : '';
  const fullPath = basePath + path;

  window.history.pushState({}, '', fullPath);
  currentRoute.set(path);
}

// Listen to popstate (back/forward button)
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const path = window.location.pathname.replace(/^\/tools\/?/, '/');
    currentRoute.set(path || '/');
  });
}

// Derived store for current tool
export const currentTool = derived(currentRoute, $route => {
  const parts = $route.split('/').filter(Boolean);
  return parts[0] || null;
});
