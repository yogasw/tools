import { writable } from 'svelte/store';

// Tools registry - tambah tools baru di sini dan akan otomatis muncul di navigation
// type: 'internal' untuk halaman di dalam app, 'external' untuk link ke URL lain
export const toolsRegistry = [
  {
    id: 'base64',
    name: 'Base64 Encoder/Decoder',
    description: 'Encode and decode Base64 strings',
    icon: '🔐',
    type: 'internal',
    category: 'encoding'
  },
  {
    id: 'wame-link-generator',
    name: 'WhatsApp Link Generator (wa.me)',
    description: 'Generate wa.me WhatsApp click-to-chat links',
    icon: '💬',
    type: 'internal',
    category: 'generator'
  },
  {
    id: 'camera-mic-test',
    name: 'Camera & Mic Test',
    description: 'Test camera and microphone permissions',
    icon: '🎥',
    type: 'external',
    url: 'https://yogasw.my.id/test-permission-camera-and-mic/',
    category: 'media'
  },
  {
    id: 'date-time-diff',
    name: 'Date Time Difference',
    description: 'Calculate the difference between two dates and times',
    icon: '⏱️',
    type: 'internal',
    category: 'calculator'
  },
  {
    id: 'json-parser',
    name: 'JSON Parser',
    description: 'Parse JSON from multiple formats and extract specific keys',
    icon: '🔍',
    type: 'internal',
    category: 'parser'
  },
  {
    id: 'beo-echo',
    name: 'Beo echo',
    description: 'Beo echo is api mocking tools for testing and development',
    icon: 'https://beo-echo.xyz/favicon.svg',
    type: 'external',
    url: 'https://beo-echo.xyz/',
    category: 'testing'
  }
];

function createToolsStore() {
  const { subscribe, set, update } = writable(toolsRegistry);

  return {
    subscribe,
    // Method untuk tambah tool external
    addExternalTool: (tool) => update(tools => [...tools, { ...tool, type: 'external' }]),
    // Method untuk get tool by id
    getById: (id) => {
      let tool;
      subscribe(tools => {
        tool = tools.find(t => t.id === id);
      })();
      return tool;
    }
  };
}

export const tools = createToolsStore();
