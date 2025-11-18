<script>
  import { onMount, onDestroy } from 'svelte';
  import { tools } from './lib/stores/tools';
  import { currentTool, navigate } from './lib/stores/router';
  import { theme } from './lib/stores/theme';
  import { recentTools } from './lib/stores/recent';
  import { bookmarks } from './lib/stores/bookmarks';
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
  let selectedIndex = 0;
  let toolButtons = [];

  // Filter and sort tools with priority: Bookmarked → Recent → Others
  $: filteredAndSortedTools = $tools
    .filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aBookmarked = $bookmarks.includes(a.id);
      const bBookmarked = $bookmarks.includes(b.id);
      const aRecent = $recentTools.indexOf(a.id);
      const bRecent = $recentTools.indexOf(b.id);

      // Priority 1: Bookmarked tools come first
      if (aBookmarked && !bBookmarked) return -1;
      if (!aBookmarked && bBookmarked) return 1;

      // Priority 2: If both bookmarked or both not, sort by recent
      if (aRecent !== -1 && bRecent !== -1) {
        return aRecent - bRecent;
      }
      if (aRecent !== -1) return -1;
      if (bRecent !== -1) return 1;

      // Priority 3: Keep original order
      return 0;
    });

  // Reset selected index when filtered list changes
  $: if (filteredAndSortedTools) {
    selectedIndex = 0;
  }

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

  // Keyboard navigation in modal
  function handleModalKeyDown(e) {
    if (!isSearchModalOpen) return;

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
          // Trigger click on the button to ensure popup blockers don't interfere
          toolButtons[selectedIndex].click();
        }
        break;
    }
  }

  function scrollToSelected() {
    // Scroll selected item into view
    setTimeout(() => {
      const button = toolButtons[selectedIndex];
      if (button) {
        button.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  function openSearchModal() {
    isSearchModalOpen = true;
    searchQuery = '';
    selectedIndex = 0;
    // Focus input after modal opens
    setTimeout(() => {
      modalSearchInput?.focus();
    }, 50);
  }

  function closeSearchModal() {
    isSearchModalOpen = false;
    searchQuery = '';
    selectedIndex = 0;
  }

  function handleToolClick(tool) {
    closeSearchModal();

    if (tool.type === 'external') {
      // Track external tools as recent when clicked
      recentTools.addRecent(tool.id);
      window.open(tool.url, '_blank');
    } else {
      // Internal tools: navigate (will be tracked as recent when page opens in onMount)
      navigate(`/${tool.id}`);
    }
  }

  function toggleBookmark(e, toolId) {
    e.stopPropagation(); // Prevent card click
    bookmarks.toggle(toolId);
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

  // Check if tool is bookmarked
  function isBookmarked(toolId) {
    return $bookmarks.includes(toolId);
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

<svelte:window on:keydown={isSearchModalOpen ? handleModalKeyDown : null} />

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
            <div
              on:click={() => handleToolClick(tool)}
              on:keydown={(e) => e.key === 'Enter' && handleToolClick(tool)}
              tabindex="0"
              role="button"
              class="group relative text-left p-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <!-- Bookmark Button -->
              <button
                on:click={(e) => toggleBookmark(e, tool.id)}
                class="absolute top-3 right-3 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
                aria-label="Toggle bookmark"
              >
                {#if isBookmarked(tool.id)}
                  <svg class="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                {:else}
                  <svg class="w-5 h-5 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                {/if}
              </button>

              <div class="space-y-3 pr-8">
                <!-- Title with icon -->
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{tool.icon}</span>
                  <h3 class="font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex-1">
                    {tool.name}
                  </h3>
                </div>

                <!-- Badges -->
                <div class="flex items-center gap-2 flex-wrap">
                  {#if isBookmarked(tool.id)}
                    <span class="px-2 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                      Bookmarked
                    </span>
                  {/if}
                  {#if isRecent(tool.id)}
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

                <!-- Description -->
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </div>
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
          class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
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
