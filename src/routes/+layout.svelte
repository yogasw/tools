<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { theme } from '$lib/stores/theme.js';
  import { tools } from '$lib/stores/tools.js';
  import { recentTools } from '$lib/stores/recent.js';
  import { bookmarks } from '$lib/stores/bookmarks.js';
  import { searchModal } from '$lib/stores/searchModal.js';
  import '../app.css';

  let searchQuery = '';
  let selectedIndex = 0;
  let toolButtons = [];
  let modalSearchInput;
  let isMac = false;

  onMount(() => {
    theme.init();
    isMac = navigator.userAgent.indexOf('Mac') !== -1;
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Sync store with modal state
  $: if ($searchModal) {
    setTimeout(() => modalSearchInput?.focus(), 50);
  } else {
    searchQuery = '';
    selectedIndex = 0;
  }

  function openSearchModal() {
    searchModal.open();
  }

  function closeSearchModal() {
    searchModal.close();
  }

  function handleToolClick(tool) {
    closeSearchModal();

    if (tool.type === 'external') {
      recentTools.addRecent(tool.id);
      window.open(tool.url, '_blank');
    } else {
      window.location.href = `/${tool.id}`;
    }
  }

  function handleKeyDown(e) {
    const correctModifier = isMac ? e.metaKey : e.ctrlKey;
    if (correctModifier && e.key === 'k') {
      e.preventDefault();
      openSearchModal();
    }
    if (e.key === 'Escape' && $searchModal) {
      closeSearchModal();
    }
  }

  function handleModalKeyDown(e) {
    if (!$searchModal) return;

    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredAndSortedTools.length - 1);
        scrollToSelected();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        scrollToSelected();
        break;
      case 'Enter':
        e.preventDefault();
        if (toolButtons[selectedIndex]) {
          toolButtons[selectedIndex].click();
        }
        break;
    }
  }

  function scrollToSelected() {
    setTimeout(() => {
      const button = toolButtons[selectedIndex];
      if (button) {
        button.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  }

  function toggleBookmark(e, toolId) {
    e.stopPropagation();
    bookmarks.toggle(toolId);
  }

  function handleModalClick(e) {
    if (e.target === e.currentTarget) {
      closeSearchModal();
    }
  }

  function isRecent(toolId) {
    return $recentTools.includes(toolId);
  }

  function isBookmarked(toolId) {
    return $bookmarks.includes(toolId);
  }

  $: filteredAndSortedTools = $tools
    .filter(tool => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aBookmarked = $bookmarks.includes(a.id);
      const bBookmarked = $bookmarks.includes(b.id);
      
      if (aBookmarked && !bBookmarked) return -1;
      if (!aBookmarked && bBookmarked) return 1;
      
      const aRecent = $recentTools.indexOf(a.id);
      const bRecent = $recentTools.indexOf(b.id);
      
      if (aRecent !== -1 && bRecent === -1) return -1;
      if (aRecent === -1 && bRecent !== -1) return 1;
      if (aRecent !== -1 && bRecent !== -1) {
        return aRecent - bRecent;
      }
      
      return 0;
    });
</script>

<svelte:window on:keydown={handleModalKeyDown} />

<div class="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors">
  <!-- Header -->
  <header class="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14">
        <!-- Logo -->
        <a
          href="/"
          class="flex items-center space-x-2 hover:opacity-70 transition-opacity"
        >
          <span class="text-xl">🛠️</span>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white">
            Tools
          </h1>
        </a>

        <!-- Search Hint -->
        <button
          on:click={openSearchModal}
          class="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <span>Search</span>
          <kbd class="px-1.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
            {isMac ? '⌘' : 'CTRL'} K
          </kbd>
        </button>

        <!-- Theme Toggle -->
        <ThemeToggle />
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <slot />
  </main>
</div>

<!-- Search Modal -->
{#if $searchModal}
  <div
    class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm"
    on:click={handleModalClick}
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <!-- Search Input -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          bind:this={modalSearchInput}
          type="text"
          bind:value={searchQuery}
          placeholder="Type a command or search..."
          class="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <button
          on:click={closeSearchModal}
          class="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          ESC
        </button>
      </div>

      <!-- Results -->
      <div class="max-h-[400px] overflow-y-auto">
        {#if filteredAndSortedTools.length > 0}
          <div class="px-3 py-2">
            <div class="text-xs font-semibold text-gray-500 dark:text-gray-500 px-3 py-2">Tools</div>
            <div class="space-y-1">
              {#each filteredAndSortedTools as tool, index}
                <button
                  bind:this={toolButtons[index]}
                  on:click={() => handleToolClick(tool)}
                  on:mouseenter={() => selectedIndex = index}
                  class="w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-3 group {index === selectedIndex ? 'bg-gray-100 dark:bg-gray-800/70' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}"
                >
                  <span class="text-xl">{tool.icon}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
                        {tool.name}
                      </span>
                      {#if isBookmarked(tool.id)}
                        <svg class="w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      {/if}
                      {#if isRecent(tool.id)}
                        <span class="px-1.5 py-0.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded">
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
