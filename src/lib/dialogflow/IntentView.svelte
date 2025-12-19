<script>
  import { allIntents, intentViewMode } from '$lib/dialogflow/dialogflow-store.js';
  import { fetchAllIntents, buildIntentTree } from '$lib/dialogflow/dialogflow-api.js';
  import IntentTreeNode from './IntentTreeNode.svelte';
  import IntentDetailPanel from './IntentDetailPanel.svelte';
  import { tick } from 'svelte';
  
  export let sessionData = null; // Full session data (with interactions)
  export let searchQuery = '';
  
  // -- ZOOM STATE --
  let scale = 1;
  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 2.0;

  function zoomIn() {
    scale = Math.min(scale + ZOOM_STEP, MAX_ZOOM);
  }
  
  function zoomOut() {
    scale = Math.max(scale - ZOOM_STEP, MIN_ZOOM);
  }
  
  function resetZoom() {
    scale = 1;
    // Also reset positioning if we were to implement pan (not requested yet, just zoom)
  }

  // -- SEARCH STATE --
  let searchMode = 'standard'; // 'standard' | 'custom'
  let customSearchQuery = '';
  let searchResults = []; // Array of matching node IDs
  let currentResultIndex = -1;
  
  // Build tree based on view mode
  $: summaryTree = $allIntents.length > 0 && sessionData 
    ? buildIntentTree($allIntents, sessionData, true) 
    : null;
    
  $: allTree = $allIntents.length > 0 && sessionData 
    ? buildIntentTree($allIntents, sessionData, false) 
    : null;
  
  // Current tree based on mode
  $: currentTree = $intentViewMode === 'summary' ? summaryTree : allTree;

  // -- SEARCH LOGIC --
  
  // Recursively search the tree
  function findMatchingNodes(nodes, query) {
    let matches = [];
    if (!query) return matches;
    
    const lowerQuery = query.toLowerCase();
    
    nodes.forEach(node => {
      let isMatch = false;
      
      // Match 1: Display Name
      if (node.displayName?.toLowerCase().includes(lowerQuery)) {
        isMatch = true;
      }
      
      // Match 2: Raw Messages (Content)
      if (!isMatch && node.messages) {
        // Search in text responses
        const messagesStr = JSON.stringify(node.messages).toLowerCase();
        if (messagesStr.includes(lowerQuery)) {
          isMatch = true;
        }
      }
      
      if (isMatch) {
        matches.push(node.id);
      }
      
      if (node.children?.length > 0) {
        matches = [...matches, ...findMatchingNodes(node.children, lowerQuery)];
      }
    });
    
    return matches;
  }
  
  // Reset highlights on all nodes
  function clearHighlights(nodes) {
    nodes.forEach(node => {
      node.highlighted = false; // Mutating the node object directly (Svelte will track if object ref changes or we force update)
      if (node.children) clearHighlights(node.children);
    });
  }

  // Highlight specific ID
  function highlightNode(nodes, id) {
    nodes.forEach(node => {
      if (node.id === id) {
        node.highlighted = true;
      }
      if (node.children) highlightNode(node.children, id);
    });
  }
  
  // Trigger Search
  async function performSearch() {
    if (!currentTree) return;
    
    // Clear previous
    clearHighlights(currentTree.roots);
    searchResults = [];
    currentResultIndex = -1;
    
    const query = searchMode === 'custom' ? customSearchQuery : searchQuery;
    
    if (!query.trim()) {
      currentTree = { ...currentTree }; // Trigger reactivity
      return;
    }
    
    // Find all matches
    searchResults = findMatchingNodes(currentTree.roots, query.trim());
    
    if (searchResults.length > 0) {
      currentResultIndex = 0;
      jumpToResult(currentResultIndex);
    }
    
    // Force update tree reactivity
    currentTree = { ...currentTree };
  }
  
  // Navigation
  async function jumpToResult(index) {
    if (index < 0 || index >= searchResults.length) return;
    
    const id = searchResults[index];
    
    // Update highlights
    clearHighlights(currentTree.roots);
    highlightNode(currentTree.roots, id);
    currentTree = { ...currentTree }; // Force update
    
    await tick(); // Wait for DOM update
    
    // Scroll into view
    const element = document.getElementById(`node-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }
  
  function nextResult() {
    if (searchResults.length === 0) return;
    currentResultIndex = (currentResultIndex + 1) % searchResults.length;
    jumpToResult(currentResultIndex);
  }
  
  function prevResult() {
    if (searchResults.length === 0) return;
    currentResultIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    jumpToResult(currentResultIndex);
  }
  
  // React to prop changes (standard search from parent)
  $: if (searchMode === 'standard' && searchQuery !== undefined) {
    performSearch();
  }

  // Selection (Detail View)
  let selectedNode = null;

  function handleNodeSelect(e) {
    selectedNode = e.detail;
  }

  // Clear selection when view mode changes or search performed
  $: if ($intentViewMode) selectedNode = null;

  // -- PERSISTENT CHECKLIST --
  import { browser } from '$app/environment';
  let checkedIntents = new Set();
  let showChecklist = false;

  // Load from localStorage
  if (browser) {
    try {
      const stored = localStorage.getItem('dialogflow_checked_intents');
      if (stored) {
        checkedIntents = new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load checked intents', e);
    }
  }

  // Sync tree with checked state
  $: if (currentTree && checkedIntents) {
    syncCheckedState(currentTree.roots);
    currentTree = { ...currentTree }; // Trigger update
  }

  function syncCheckedState(nodes) {
    nodes.forEach(node => {
      node.selected = checkedIntents.has(node.id);
      if (node.children) syncCheckedState(node.children);
    });
  }

  function handleNodeCheck(e) {
    const node = e.detail;
    if (checkedIntents.has(node.id)) {
      checkedIntents.delete(node.id);
    } else {
      checkedIntents.add(node.id);
    }
    checkedIntents = new Set(checkedIntents); // Reactivity
    saveCheckedIntents();
    
    // Update local node state immediately for responsiveness
    node.selected = checkedIntents.has(node.id);
    currentTree = { ...currentTree };
  }

  function saveCheckedIntents() {
    if (browser) {
      localStorage.setItem('dialogflow_checked_intents', JSON.stringify([...checkedIntents]));
    }
  }

  function resetChecklist() {
    checkedIntents = new Set();
    saveCheckedIntents();
    showChecklist = false;
  }
  
  function jumpToIntent(id) {
    clearHighlights(currentTree.roots);
    highlightNode(currentTree.roots, id);
    currentTree = { ...currentTree };
    
    // Select it for detail view
    const node = findNodeById(currentTree.roots, id);
    if (node) selectedNode = node;
    
    tick().then(() => {
      const element = document.getElementById(`node-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    });
    showChecklist = false;
  }

  function findNodeById(nodes, id) {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }
</script>

<div class="h-full flex flex-col overflow-hidden relative">
  <!-- Top Bar: View Mode + Search Mode + Zoom -->
  <div class="flex-shrink-0 flex flex-col gap-2 p-3 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 z-10 shadow-sm">
    
    <!-- Row 1: View Modes & Standard Actions -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- View Mode Toggle -->
        <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button
            on:click={() => $intentViewMode = 'summary'}
            class="px-3 py-1 text-xs font-medium rounded transition-colors {$intentViewMode === 'summary' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}"
          >
            🌳 Summary
          </button>
          <button
            on:click={() => $intentViewMode = 'all'}
            class="px-3 py-1 text-xs font-medium rounded transition-colors {$intentViewMode === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}"
          >
            📋 All Intents
          </button>
        </div>
        
        <!-- Search Mode Toggle -->
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 px-2">
            <span class="text-[10px] uppercase text-gray-500 font-bold mr-1">Search:</span>
            <button 
                on:click={() => { searchMode = 'standard'; performSearch(); }}
                class="text-xs px-2 py-0.5 rounded {searchMode === 'standard' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}"
            >Std</button>
            <button 
                on:click={() => { searchMode = 'custom'; performSearch(); }}
                class="text-xs px-2 py-0.5 rounded {searchMode === 'custom' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}"
            >Custom</button>
        </div>
      </div>
      
      <!-- Zoom Controls -->
      <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button on:click={zoomOut} class="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 rounded" title="Zoom Out">-</button>
        <span class="text-xs w-8 text-center text-gray-600 dark:text-gray-400">{Math.round(scale * 100)}%</span>
        <button on:click={zoomIn} class="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 rounded" title="Zoom In">+</button>
        <button on:click={resetZoom} class="text-xs px-2 hover:bg-white dark:hover:bg-gray-700 rounded" title="Reset">Reset</button>
      </div>
    </div>
    
    <!-- Row 2: Custom Search Input (If active) -->
    {#if searchMode === 'custom'}
        <div class="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-top-1">
            <div class="relative flex-1">
                <input 
                    type="text" 
                    bind:value={customSearchQuery} 
                    on:keydown={(e) => e.key === 'Enter' && performSearch()}
                    placeholder="Search intent name or response content..." 
                    class="w-full text-xs border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/10 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {#if searchResults.length > 0}
                        <span class="text-purple-600 font-medium">{currentResultIndex + 1}/{searchResults.length}</span>
                    {:else if customSearchQuery}
                        <span>0</span>
                    {/if}
                </div>
            </div>
            
            <button 
                on:click={performSearch}
                class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md shadow-sm transition-colors"
            >
                Search
            </button>
            
            <div class="flex gap-0.5">
                <button on:click={prevResult} disabled={searchResults.length === 0} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button on:click={nextResult} disabled={searchResults.length === 0} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>
        </div>
    {/if}

    <!-- Checklist Counter UI -->
    {#if checkedIntents.size > 0}
      <div class="absolute top-16 right-4 z-50">
        <div class="relative">
          <button 
            on:click={() => showChecklist = !showChecklist}
            class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-medium text-gray-700 dark:text-gray-200 group"
          >
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>{checkedIntents.size} Selected</span>
            <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform {showChecklist ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {#if showChecklist}
            <div class="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div class="p-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <span class="text-xs font-bold text-gray-500 uppercase">Checked Intents</span>
                <button on:click={resetChecklist} class="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                  Reset
                </button>
              </div>
              <div class="max-h-60 overflow-y-auto p-1">
                {#each [...checkedIntents] as id}
                  {@const node = findNodeById(currentTree.roots, id)}
                  <button 
                    on:click={() => jumpToIntent(id)}
                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center justify-between group"
                  >
                    <span class="truncate text-gray-700 dark:text-gray-300">{node ? node.displayName : id}</span>
                    <svg class="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

  </div>
  
  <div class="flex-1 flex overflow-hidden">
    <!-- Content Area with Zoom -->
    <div class="flex-1 overflow-auto bg-gray-50 dark:bg-[#0a0a0a] relative">
        <div 
          class="min-w-full min-h-full p-8 transition-transform duration-200 origin-top-left"
          style="transform: scale({scale}); width: {100/scale}%; height: {100/scale}%;"
          on:click={() => selectedNode = null}
        >
          {#if $allIntents.length === 0}
              <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                  <p>Loading intents...</p>
                  <button on:click={() => fetchAllIntents()} class="mt-4 text-blue-500 hover:underline">Retry</button>
              </div>
          {:else if currentTree && currentTree.roots.length > 0}
            <div class="flex flex-row flex-wrap gap-8 justify-center items-start min-w-max pb-20">
              {#each currentTree.roots as root}
                <IntentTreeNode node={root} on:select={handleNodeSelect} on:check={handleNodeCheck} />
              {/each}
            </div>
          {:else}
            <div class="text-center text-gray-500 py-8">
              <p class="text-sm">No intents to display</p>
            </div>
          {/if}
        </div>
    </div>
    
    <!-- Right Sidebar Detail Panel -->
    {#if selectedNode}
      <IntentDetailPanel node={selectedNode} />
    {/if}
  </div>
</div>
