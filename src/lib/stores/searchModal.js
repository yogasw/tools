import { writable } from 'svelte/store';

function createSearchModalStore() {
  const { subscribe, set } = writable(false);

  return {
    subscribe,
    open: () => set(true),
    close: () => set(false)
  };
}

export const searchModal = createSearchModalStore();
