<script>
  import { onMount, onDestroy } from 'svelte';
  import { tools } from './lib/stores/tools';
  import { currentTool, navigate } from './lib/stores/router';
  import { theme } from './lib/stores/theme';
  import { recentTools } from './lib/stores/recent';
  import ThemeToggle from './lib/components/ThemeToggle.svelte';

  // Import internal tools only
  import Base64Tool from './lib/tools/Base64Tool.svelte';
  import WhatsAppLinkGenerator from './lib/tools/WhatsAppLinkGenerator.svelte';

  const toolComponents = {
    'base64': Base64Tool,
    'wa-link-generator': WhatsAppLinkGenerator
  };

  let searchQuery = '';
  let isSearchModalOpen = false;
  let modalSearchInput;

  // Filter and sort tools
  $: filteredAndSortedTools = $tools
    .filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aIndex = $recentTools.indexOf(a.id);
      const bIndex = $recentTools.indexOf(b.id);

      // If both in recent, sort by recent order (lower index = more recent)
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only a in recent, a comes first
      if (aIndex !== -1) return -1;
      // If only b in recent, b comes first
      if (bIndex !== -1) return 1;
      // Neither in recent, keep original order
      return 0;
    });

  $: activeToolData = $currentTool ? $tools.find(t => t.id === $currentTool) : null;

  // Keyboard shortcut for search (CMD+K or CTRL+K)
  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearchModal();
    }
    // ESC to close modal
    if (e.key === 'Escape' && isSearchModalOpen) {
      closeSearchModal();
    }
  }

  function openSearchModal() {
    isSearchModalOpen = true;
    searchQuery = '';
    // Focus input after modal opens
    setTimeout(() => {
      modalSearchInput?.focus();
    }, 50);
  }

  function closeSearchModal() {
    isSearchModalOpen = false;
    searchQuery = '';
  }

  function handleToolClick(tool) {
    closeSearchModal();

    // Track recent
    if (tool.type === 'internal') {
      recentTools.addRecent(tool.id);
    }

    if (tool.type === 'external') {
      window.open(tool.url, '_blank');
    } else {
      navigate(`/${tool.id}`);
    }
  }

  // Close modal when clicking outside
  function handleModalClick(e) {
    if (e.target === e.currentTarget) {
      closeSearchModal();
    }
  }

  // Check if tool is recent
  function isRecent(toolId) {
    return $recentTools.includes(toolId);
  }

  onMount(() => {
    theme.init();
    updatePageTitle();
    window.addEventListener('keydown', handleKeyDown);

    // Track current tool as recent if on tool page
    if ($currentTool && activeToolData?.type === 'internal') {
      recentTools.addRecent($currentTool);
    }
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  // Update title when tool changes
  $: {
    if (activeToolData) {
      document.title = `${activeToolData.name} - Tools`;
    } else {
      document.title = 'Tools Collection';
    }
  }

  function updatePageTitle() {
    if (activeToolData) {
      document.title = `${activeToolData.name} - Tools`;
    } else {
      document.title = 'Tools Collection';
    }
  }

  // Detect if Mac or Windows for CMD/CTRL display
  let isMac = false;
  onMount(() => {
    isMac = navigator.userAgent.indexOf('Mac') !== -1;
  });
</script>

<svelte:head>
  <meta name="description" content={activeToolData ? activeToolData.description : "Fast, free, open source tools for developers"} />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white transition-colors duration-200">
  <!-- Header -->
  <header class="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14">
        <!-- Logo -->
        <button
          on:click={() => navigate('/')}
          class="flex items-center space-x-2 hover:opacity-70 transition-opacity"
        >
          <span class="text-xl">🛠️</span>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white">
            Tools
          </h1>
        </button>

        <!-- Theme Toggle -->
        <ThemeToggle />
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    {#if !$currentTool}
      <!-- Home: Hero + Search + Tools Grid -->
      <div class="py-16 space-y-12">
        <!-- Hero Section -->
        <div class="text-center space-y-6">
          <!-- Icon -->
          <div class="flex justify-center">
            <div class="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
              <span class="text-4xl">🛠️</span>
            </div>
          </div>

          <!-- Title -->
          <h1 class="text-5xl font-bold text-gray-900 dark:text-white">
            Dev Utilities
          </h1>

          <!-- Subtitle -->
          <div class="space-y-1">
            <p class="text-lg text-gray-600 dark:text-gray-400">
              Tools exists to make developers lives easier.
            </p>
            <p class="text-lg text-gray-600 dark:text-gray-400">
              Here are fast, free, open source, ad-free tools.
            </p>
          </div>

          <!-- Search Button -->
          <div class="max-w-xl mx-auto pt-4">
            <button
              on:click={openSearchModal}
              class="w-full px-4 py-3 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-600 transition-all group"
            >
              <span class="text-gray-500 dark:text-gray-500">Search</span>
              <kbd class="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded">
                {isMac ? '⌘' : 'CTRL'} K
              </kbd>
            </button>
          </div>
        </div>

        <!-- Tools Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each filteredAndSortedTools as tool}
            <button
              on:click={() => handleToolClick(tool)}
              class="group text-left p-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200"
            >
              <div class="space-y-3">
                <!-- Title with icon -->
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{tool.icon}</span>
                  <h3 class="font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex-1">
                    {tool.name}
                  </h3>
                  <div class="flex items-center gap-2">
                    {#if isRecent(tool.id) && tool.type === 'internal'}
                      <span class="px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded">
                        Recent
                      </span>
                    {/if}
                    {#if tool.type === 'external'}
                      <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    {/if}
                  </div>
                </div>

                <!-- Description -->
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Tool View (no back button) -->
      <div class="py-8">
        <svelte:component this={toolComponents[$currentTool]} />
      </div>
    {/if}
  </main>
</div>

<!-- Search Modal -->
{#if isSearchModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm"
    on:click={handleModalClick}
    on:keydown={(e) => e.key === 'Escape' && closeSearchModal()}
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-2xl bg-[#1a1a1a] rounded-lg shadow-2xl border border-gray-800 overflow-hidden">
      <!-- Search Input -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          bind:this={modalSearchInput}
          type="text"
          bind:value={searchQuery}
          placeholder="Type a command or search..."
          class="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
        />
        <button
          on:click={closeSearchModal}
          class="p-1 hover:bg-gray-800 rounded transition-colors"
          aria-label="Close search"
        >
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Results -->
      <div class="max-h-[400px] overflow-y-auto">
        {#if filteredAndSortedTools.length > 0}
          <div class="px-3 py-2">
            <div class="text-xs font-semibold text-gray-500 px-3 py-2">Tools</div>
            <div class="space-y-1">
              {#each filteredAndSortedTools as tool}
                <button
                  on:click={() => handleToolClick(tool)}
                  class="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 transition-colors flex items-center gap-3 group"
                >
                  <span class="text-xl">{tool.icon}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-white group-hover:text-gray-200">
                        {tool.name}
                      </span>
                      {#if isRecent(tool.id) && tool.type === 'internal'}
                        <span class="px-1.5 py-0.5 text-xs text-blue-400 bg-blue-900/20 rounded">
                          Recent
                        </span>
                      {/if}
                      {#if tool.type === 'external'}
                        <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      {/if}
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {:else}
          <div class="px-3 py-8 text-center">
            <p class="text-sm text-gray-500">No tools found</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
