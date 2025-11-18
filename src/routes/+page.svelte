<script>
  import { onMount } from 'svelte';
  import { tools } from '$lib/stores/tools.js';
  import { recentTools } from '$lib/stores/recent.js';
  import { bookmarks } from '$lib/stores/bookmarks.js';

  let isMac = false;

  onMount(() => {
    isMac = navigator.userAgent.indexOf('Mac') !== -1;
  });

  function handleToolClick(tool) {
    if (tool.type === 'external') {
      recentTools.addRecent(tool.id);
      window.open(tool.url, '_blank');
    } else {
      window.location.href = `/${tool.id}`;
    }
  }

  function toggleBookmark(e, toolId) {
    e.stopPropagation();
    bookmarks.toggle(toolId);
  }

  function isRecent(toolId) {
    return $recentTools.includes(toolId);
  }

  function isBookmarked(toolId) {
    return $bookmarks.includes(toolId);
  }

  $: filteredAndSortedTools = $tools
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

<svelte:head>
  <title>Tools Collection - Simple & Modern</title>
  <meta name="description" content="Simple and modern collection of useful web tools. Base64 encoder/decoder, camera & mic test, WhatsApp link generator, and more." />
</svelte:head>

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
        on:click={() => import('$lib/stores/searchModal.js').then(m => m.searchModal.open())}
        class="w-full px-4 py-3 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-600 transition-all group"
      >
        <span class="text-gray-500 dark:text-gray-500">Search</span>
        <kbd class="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded">
          {isMac ? '⌘' : 'CTRL'} K
        </kbd>
      </button>
      <p class="text-xs text-gray-500 dark:text-gray-500 text-center mt-2">
        Press <kbd class="px-1 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">{isMac ? '⌘' : 'CTRL'}</kbd> + <kbd class="px-1 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">K</kbd> to search
      </p>
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
