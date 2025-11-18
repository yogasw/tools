import { writable } from 'svelte/store';

// Get initial theme from localStorage or system preference
function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem('theme');
  if (stored) return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function createThemeStore() {
  const { subscribe, set, update } = writable(getInitialTheme());

  return {
    subscribe,
    toggle: () => update(theme => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
      return newTheme;
    }),
    set: (theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
      set(theme);
    },
    init: () => {
      const theme = getInitialTheme();
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
      set(theme);
    }
  };
}

export const theme = createThemeStore();
