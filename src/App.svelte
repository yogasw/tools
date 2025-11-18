<script>
  import { writable } from 'svelte/store';
  import { tools } from './lib/stores/tools';
  import ThemeToggle from './lib/components/ThemeToggle.svelte';
  import ToolCard from './lib/components/ToolCard.svelte';
  import Button from './lib/components/Button.svelte';

  // Import tools
  import Base64Tool from './lib/tools/Base64Tool.svelte';
  import CameraMicTest from './lib/tools/CameraMicTest.svelte';
  import WhatsAppLinkGenerator from './lib/tools/WhatsAppLinkGenerator.svelte';

  // Simple routing
  let currentTool = writable(null);

  const toolComponents = {
    'base64': Base64Tool,
    'camera-mic-test': CameraMicTest,
    'wa-link-generator': WhatsAppLinkGenerator
  };

  function selectTool(toolId) {
    currentTool.set(toolId);
  }

  function goHome() {
    currentTool.set(null);
  }
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
  <!-- Header -->
  <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <button on:click={goHome} class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <span class="text-2xl">🛠️</span>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Tools Collection
          </h1>
        </button>
        <ThemeToggle />
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if $currentTool === null}
      <!-- Home: Tools Grid -->
      <div class="space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome to Tools Collection
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Simple and modern tools for your daily needs
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each $tools as tool}
            <ToolCard {tool} onClick={selectTool} />
          {/each}
        </div>
      </div>
    {:else}
      <!-- Tool View -->
      <div class="space-y-4">
        <div>
          <Button on:click={goHome} variant="ghost">
            ← Back to Home
          </Button>
        </div>

        <svelte:component this={toolComponents[$currentTool]} />
      </div>
    {/if}
  </main>

  <!-- Footer -->
  <footer class="mt-16 border-t border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <p class="text-center text-gray-600 dark:text-gray-400 text-sm">
        Tools Collection - Simple and Modern
      </p>
    </div>
  </footer>
</div>
