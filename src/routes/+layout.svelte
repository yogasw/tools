<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import { theme } from "$lib/stores/theme.js";
  import { tools } from "$lib/stores/tools.js";
  import { recentTools } from "$lib/stores/recent.js";
  import { bookmarks } from "$lib/stores/bookmarks.js";
  import { searchModal } from "$lib/stores/searchModal.js";
  import "../app.css";

  let searchQuery = "";
  let selectedIndex = 0;
  let toolButtons = [];
  let modalSearchInput;
  let isMac = false;

  onMount(() => {
    theme.init();
    isMac = navigator.userAgent.indexOf("Mac") !== -1;
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  // Sync store with modal state
  $: if ($searchModal) {
    setTimeout(() => modalSearchInput?.focus(), 50);
  } else {
    searchQuery = "";
    selectedIndex = 0;
  }

  function openSearchModal() {
    searchModal.open();
  }

  function closeSearchModal() {
    searchModal.close();
  }

  function handleExternalClick(e, tool) {
    e.preventDefault();
    closeSearchModal();
    recentTools.addRecent(tool.id);
    window.open(tool.url, "_blank");
  }

  function handleInternalClick(e, tool) {
    closeSearchModal();
    recentTools.addRecent(tool.id);
  }

  function handleKeyDown(e) {
    const correctModifier = isMac ? e.metaKey : e.ctrlKey;
    if (correctModifier && e.key === "k") {
      e.preventDefault();
      openSearchModal();
    }
    if (e.key === "Escape" && $searchModal) {
      closeSearchModal();
    }
  }

  function handleModalKeyDown(e) {
    if (!$searchModal) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectedIndex = Math.min(
          selectedIndex + 1,
          filteredAndSortedTools.length - 1,
        );
        scrollToSelected();
        break;
      case "ArrowUp":
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        scrollToSelected();
        break;
      case "Enter":
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
        button.scrollIntoView({ block: "nearest", behavior: "smooth" });
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
    .filter((tool) => {
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

  // Check if current page's tool has fullScreen config
  $: currentToolId = $page.url.pathname.slice(1); // Remove leading /
  $: currentTool = $tools.find(t => t.id === currentToolId);
  $: isFullScreen = currentTool?.fullScreen === true;
</script>

<svelte:window on:keydown={handleModalKeyDown} />

<div class="h-screen flex flex-col bg-gray-50 dark:bg-[#0a0a0a] transition-colors">
  <!-- Header -->
  <header
    class="flex-shrink-0 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14">
        <!-- Logo -->
        <a
          href="/"
          class="flex items-center space-x-2 hover:opacity-70 transition-opacity"
        >
          <span class="text-xl">🛠️</span>
            <span class="text-lg font-bold text-gray-900 dark:text-white">Dev Utilities</span>
        </a>

        <!-- Right Actions -->
        <div class="flex items-center gap-2">
          <!-- Search Hint -->
          <button
            on:click={openSearchModal}
            class="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <span>Search</span>
            <kbd
              class="px-1.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
            >
              {isMac ? "⌘" : "CTRL"} K
            </kbd>
          </button>

          <!-- GitHub Link -->
          <a
            href="https://github.com/yogasw/tools"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="View on GitHub"
            title="View on GitHub"
          >
            <svg
              class="w-5 h-5 text-gray-700 dark:text-gray-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fill-rule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clip-rule="evenodd"
              />
            </svg>
          </a>

          <!-- Theme Toggle -->
          <ThemeToggle />
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content - Conditional layout based on tool config -->
  {#if isFullScreen}
    <!-- Full screen layout for tools like Dialogflow History -->
    <main class="flex-1 min-h-0 overflow-hidden">
      <div class="h-full">
        <slot />
      </div>
    </main>
  {:else}
    <!-- Standard contained layout -->
    <main class="flex-1 overflow-auto">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <slot />
      </div>
    </main>
  {/if}
</div>

<!-- Search Modal -->
{#if $searchModal}
  <div
    class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm"
    on:click={handleModalClick}
    on:keydown={handleModalClick}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      <!-- Search Input -->
      <div
        class="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800"
      >
        <svg
          class="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
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
            <div
              class="text-xs font-semibold text-gray-500 dark:text-gray-500 px-3 py-2"
            >
              Tools
            </div>
            <div class="space-y-1">
              {#each filteredAndSortedTools as tool, index}
                <a
                  bind:this={toolButtons[index]}
                  href={tool.type === "external" ? tool.url : `/${tool.id}`}
                  target={tool.type === "external" ? "_blank" : undefined}
                  rel={tool.type === "external" ? "noopener noreferrer" : undefined}
                  on:click={(e) => tool.type === "external" ? handleExternalClick(e, tool) : handleInternalClick(e, tool)}
                  on:mouseenter={() => (selectedIndex = index)}
                  class="w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-3 group {index ===
                  selectedIndex
                    ? 'bg-gray-100 dark:bg-gray-800/70'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'} block no-underline"
                >
                  {#if tool.icon.startsWith("http://") || tool.icon.startsWith("https://") || tool.icon.startsWith("/")}
                <img
                  src={tool.icon}
                  alt={tool.name}
                  class="w-6 h-6 object-contain"
                />
              {:else}
                {tool.icon}
              {/if}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200"
                      >
                        {tool.name}
                      </span>
                      {#if isBookmarked(tool.id)}
                        <svg
                          class="w-3.5 h-3.5 text-yellow-500 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          />
                        </svg>
                      {/if}
                      {#if isRecent(tool.id)}
                        <span
                          class="px-1.5 py-0.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded"
                        >
                          Recent
                        </span>
                      {/if}
                      {#if tool.type === "external"}
                        <svg
                          class="w-3 h-3 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      {/if}
                    </div>
                  </div>
                </a>
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
