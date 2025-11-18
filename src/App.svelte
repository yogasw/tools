<script>
  import { onMount } from 'svelte';
  import { tools } from './lib/stores/tools';
  import { currentTool, navigate } from './lib/stores/router';
  import { theme } from './lib/stores/theme';
  import ThemeToggle from './lib/components/ThemeToggle.svelte';
  import Button from './lib/components/Button.svelte';

  // Import tools
  import Base64Tool from './lib/tools/Base64Tool.svelte';
  import CameraMicTest from './lib/tools/CameraMicTest.svelte';
  import WhatsAppLinkGenerator from './lib/tools/WhatsAppLinkGenerator.svelte';

  const toolComponents = {
    'base64': Base64Tool,
    'camera-mic-test': CameraMicTest,
    'wa-link-generator': WhatsAppLinkGenerator
  };

  let searchQuery = '';
  let isSearchOpen = false;

  $: filteredTools = $tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  $: activeToolData = $currentTool ? $tools.find(t => t.id === $currentTool) : null;

  onMount(() => {
    theme.init();

    // Update document title based on route
    if (activeToolData) {
      document.title = `${activeToolData.name} - Tools Collection`;
    } else {
      document.title = 'Tools Collection - Simple & Modern';
    }
  });

  // Update title when tool changes
  $: if (activeToolData) {
    document.title = `${activeToolData.name} - Tools Collection`;
  } else {
    document.title = 'Tools Collection - Simple & Modern';
  }

  function toggleSearch() {
    isSearchOpen = !isSearchOpen;
    if (!isSearchOpen) {
      searchQuery = '';
    }
  }
</script>

<svelte:head>
  <meta name="description" content={activeToolData ? activeToolData.description : "Simple and modern collection of useful web tools"} />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 transition-all duration-300">

  <!-- Header -->
  <header class="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <button
          on:click={() => navigate('/')}
          class="flex items-center space-x-3 group transition-transform hover:scale-105"
        >
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <span class="text-2xl">🛠️</span>
          </div>
          <div class="hidden sm:block">
            <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Tools Collection
            </h1>
          </div>
        </button>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <!-- Search Button -->
          <button
            on:click={toggleSearch}
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Search tools"
          >
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <ThemeToggle />
        </div>
      </div>

      <!-- Search Bar -->
      {#if isSearchOpen}
        <div class="pb-4 animate-slideDown">
          <div class="relative">
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search tools..."
              autofocus
              class="w-full px-4 py-3 pl-11 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-gray-100"
            />
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      {/if}
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
    {#if !$currentTool}
      <!-- Home: Tools Grid -->
      <div class="space-y-8">
        <!-- Hero Section -->
        <div class="text-center space-y-4 py-8">
          <h2 class="text-4xl sm:text-5xl font-bold">
            <span class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Simple & Modern Tools
            </span>
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Collection of useful web tools for your daily needs
          </p>
        </div>

        <!-- Tools Grid -->
        {#if filteredTools.length > 0}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each filteredTools as tool}
              <button
                on:click={() => navigate(`/${tool.id}`)}
                class="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 hover:-translate-y-1 text-left"
              >
                <!-- Gradient overlay on hover -->
                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div class="relative p-6 space-y-4">
                  <!-- Icon -->
                  <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <span class="text-3xl">{tool.icon}</span>
                  </div>

                  <!-- Content -->
                  <div class="space-y-2">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <!-- Badge for external tools -->
                  {#if tool.type === 'external'}
                    <span class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      External
                    </span>
                  {/if}

                  <!-- Arrow icon -->
                  <div class="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {:else}
          <div class="text-center py-16">
            <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No tools found</h3>
            <p class="text-gray-600 dark:text-gray-400">Try a different search term</p>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Tool View -->
      <div class="space-y-6 animate-fadeIn">
        <!-- Breadcrumb -->
        <nav class="flex items-center space-x-2 text-sm">
          <button
            on:click={() => navigate('/')}
            class="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Home
          </button>
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-gray-900 dark:text-gray-100 font-medium">
            {activeToolData?.name || 'Tool'}
          </span>
        </nav>

        <svelte:component this={toolComponents[$currentTool]} />
      </div>
    {/if}
  </main>
</div>

<style>
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slideDown {
    animation: slideDown 0.2s ease-out;
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
</style>
