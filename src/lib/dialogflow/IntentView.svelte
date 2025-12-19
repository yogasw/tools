<script>
  import { allIntents, intentViewMode, isLoadingIntents } from '$lib/dialogflow/dialogflow-store.js';
  import { fetchAllIntents, buildIntentTree } from '$lib/dialogflow/dialogflow-api.js';
  import IntentTreeNode from './IntentTreeNode.svelte';
  
  export let sessionData = null; // Full session data (with interactions)
  export let searchQuery = '';
  
  // Build tree based on view mode
  // Summary: summaryOnly = true (only conversation path)
  // All: summaryOnly = false (all intents)
  $: summaryTree = $allIntents.length > 0 && sessionData 
    ? buildIntentTree($allIntents, sessionData, true) 
    : null;
    
  $: allTree = $allIntents.length > 0 && sessionData 
    ? buildIntentTree($allIntents, sessionData, false) 
    : null;
  
  // Current tree based on mode
  $: currentTree = $intentViewMode === 'summary' ? summaryTree : allTree;
</script>

<div class="h-full flex flex-col overflow-hidden">
  <!-- Toggle Header -->
  <div class="flex-shrink-0 flex items-center justify-between p-3 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
    <div class="flex items-center gap-3">
      <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button
          on:click={() => $intentViewMode = 'summary'}
          class="px-3 py-1 text-xs font-medium rounded transition-colors {$intentViewMode === 'summary' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}"
        >
          🌳 Summary {summaryTree ? `(${summaryTree.activeNodes})` : ''}
        </button>
        <button
          on:click={() => $intentViewMode = 'all'}
          class="px-3 py-1 text-xs font-medium rounded transition-colors {$intentViewMode === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}"
        >
          📋 All Intents {allTree ? `(${allTree.totalNodes})` : $allIntents.length > 0 ? `(${$allIntents.length})` : ''}
        </button>
      </div>
      
      {#if $isLoadingIntents}
        <div class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
          <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      {/if}
    </div>
    
    <!-- Refresh button -->
    <button
      on:click={() => fetchAllIntents()}
      disabled={$isLoadingIntents}
      class="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
      title="Refresh intents"
    >
      <svg class="w-4 h-4 {$isLoadingIntents ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Refresh
    </button>
  </div>
  
  <!-- Content -->
  <div class="flex-1 overflow-auto p-4">
    {#if $allIntents.length === 0}
      <div class="text-center py-8 text-gray-500">
        {#if $isLoadingIntents}
          <p class="text-sm">Loading intents...</p>
        {:else}
          <p class="text-sm mb-2">No intents loaded</p>
          <button
            on:click={() => fetchAllIntents()}
            class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Load Intents
          </button>
        {/if}
      </div>
    {:else if currentTree && currentTree.roots.length > 0}
      <!-- All roots displayed horizontally in a row -->
      <div class="flex flex-row flex-wrap gap-8 justify-center items-start min-w-max">
        {#each currentTree.roots as root}
          <IntentTreeNode node={root} />
        {/each}
      </div>
    {:else}
      <div class="text-center text-gray-500 py-8">
        <p class="text-sm">No intents to display</p>
      </div>
    {/if}
  </div>
</div>
