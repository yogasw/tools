<script>
  import { allIntents, intentViewMode } from '$lib/dialogflow/dialogflow-store.js';
  import { fetchAllIntents, buildIntentTree } from '$lib/dialogflow/dialogflow-api.js';
  import IntentTreeNode from './IntentTreeNode.svelte';
  import IntentDetailPanel from './IntentDetailPanel.svelte';
  import { tick } from 'svelte';
  import { browser } from '$app/environment';
  
  let { sessionData = null, searchQuery = '' } = $props();
  
  // -- ZOOM STATE --
  let scale = $state(1);
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 3.0;
  const ZOOM_SENSITIVITY = 0.002; // For smooth wheel zoom

  let zoomContainer = $state(null); // Reference to scrollable container

  function zoomIn() {
    scale = Math.min(scale * 1.15, MAX_ZOOM);
  }
  
  function zoomOut() {
    scale = Math.max(scale / 1.15, MIN_ZOOM);
  }
  
  function resetZoom() {
    scale = 1;
  }

  // Handle Keyboard Zoom Shortcuts (Ctrl/Cmd +/-, 0)
  function handleKeydown(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    }
  }

  // Handle Wheel Zoom (Ctrl/Cmd + Scroll) with cursor focus
  function handleWheel(e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    
    e.preventDefault();
    
    const container = zoomContainer;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    // Mouse position relative to container viewport
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    // Point under mouse in "unscaled" content coordinates
    const pointX = (container.scrollLeft + offsetX) / scale;
    const pointY = (container.scrollTop + offsetY) / scale;
    
    // Calculate new scale (exponential for smoothness)
    const oldScale = scale;
    const zoomFactor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
    const newScale = Math.min(Math.max(oldScale * zoomFactor, MIN_ZOOM), MAX_ZOOM);
    
    scale = newScale;
    
    // Adjust scroll to keep point under cursor
    // Need to defer slightly so scale changes take effect on layout
    requestAnimationFrame(() => {
      container.scrollLeft = (pointX * newScale) - offsetX;
      container.scrollTop = (pointY * newScale) - offsetY;
    });
  }

  // -- SEARCH STATE --
  let searchMode = $state('standard'); // 'standard' | 'custom'
  let customSearchQuery = $state('');
  let searchResults = $state([]); // Array of matching node IDs
  let currentResultIndex = $state(-1);
  let showSearchResultsList = $state(false);
  
  // Build tree based on view mode
  let summaryTree = $derived(
    $allIntents.length > 0 && sessionData 
      ? buildIntentTree($allIntents, sessionData, true) 
      : null
  );
    
  let allTree = $derived(
    $allIntents.length > 0 && sessionData 
      ? buildIntentTree($allIntents, sessionData, false) 
      : null
  );
  
  // Current tree based on mode
  let currentTree = $derived($intentViewMode === 'summary' ? summaryTree : allTree);

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
      return;
    }
    
    // Find all matches
    searchResults = findMatchingNodes(currentTree.roots, query.trim());
    
    if (searchResults.length > 0) {
      currentResultIndex = 0;
      jumpToResult(currentResultIndex);
    }
  }
  
  // Navigation
  async function jumpToResult(index) {
    if (index < 0 || index >= searchResults.length) return;
    
    const id = searchResults[index];
    
    // Update highlights
    clearHighlights(currentTree.roots);
    highlightNode(currentTree.roots, id);
    
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
  $effect(() => {
    if (searchMode === 'standard' && searchQuery !== undefined) {
      performSearch();
    }
  });

  // Selection (Detail View)
  let selectedNode = $state(null);

  function handleNodeSelect(node) {
    selectedNode = node;
  }

  // Clear selection when view mode changes
  $effect(() => {
    if ($intentViewMode) {
      selectedNode = null;
    }
  });

  // -- PERSISTENT CHECKLIST --
  let checkedIntents = $state(new Set());
  let showChecklist = $state(false);

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
  $effect(() => {
    if (currentTree && checkedIntents) {
      syncCheckedState(currentTree.roots);
    }
  });

  function syncCheckedState(nodes) {
    nodes.forEach(node => {
      node.selected = checkedIntents.has(node.id);
      if (node.children) syncCheckedState(node.children);
    });
  }

  function handleNodeCheck(node) {
    if (checkedIntents.has(node.id)) {
      checkedIntents.delete(node.id);
    } else {
      checkedIntents.add(node.id);
    }
    checkedIntents = new Set(checkedIntents); // Reactivity
    saveCheckedIntents();
    
    // Update local node state immediately for responsiveness
    node.selected = checkedIntents.has(node.id);
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

  // Computed for search results
  let checkedCount = $derived(searchResults.filter(id => checkedIntents.has(id)).length);
  
  function handleSearchKeydown(e) {
    if (e.key === 'Enter') performSearch();
  }
  
  function toggleCheckIntent(id) {
    if (checkedIntents.has(id)) {
      checkedIntents.delete(id);
    } else {
      checkedIntents.add(id);
    }
    checkedIntents = new Set(checkedIntents);
    saveCheckedIntents();
    // Update node selection visual if rendered
    const node = findNodeById(currentTree.roots, id);
    if (node) node.selected = checkedIntents.has(id);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="h-full flex flex-col overflow-hidden relative">
  <!-- Top Bar: View Mode + Search Mode + Zoom -->
  <div class="flex-shrink-0 flex flex-col gap-2 p-3 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 z-10 shadow-sm">
    
    <!-- Row 1: View Modes & Standard Actions -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- View Mode Toggle -->
        <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button
            onclick={() => $intentViewMode = 'summary'}
            class="px-3 py-1 text-xs font-medium rounded transition-colors {$intentViewMode === 'summary' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}"
          >
            🌳 Summary
          </button>
          <button
            onclick={() => $intentViewMode = 'all'}
            class="px-3 py-1 text-xs font-medium rounded transition-colors {$intentViewMode === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}"
          >
            📋 All Intents
          </button>
        </div>
        
        <!-- Search Mode Toggle -->
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 px-2">
            <span class="text-[10px] uppercase text-gray-500 font-bold mr-1">Search:</span>
            <button 
                onclick={() => { searchMode = 'standard'; performSearch(); }}
                class="text-xs px-2 py-0.5 rounded {searchMode === 'standard' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}"
            >Std</button>
            <button 
                onclick={() => { searchMode = 'custom'; performSearch(); }}
                class="text-xs px-2 py-0.5 rounded {searchMode === 'custom' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}"
            >Custom</button>
        </div>
      </div>
      
      <!-- Zoom Controls -->
      <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button onclick={zoomOut} class="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 rounded" title="Zoom Out">-</button>
        <span class="text-xs w-8 text-center text-gray-600 dark:text-gray-400">{Math.round(scale * 100)}%</span>
        <button onclick={zoomIn} class="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 rounded" title="Zoom In">+</button>
        <button onclick={resetZoom} class="text-xs px-2 hover:bg-white dark:hover:bg-gray-700 rounded" title="Reset">Reset</button>
      </div>
    </div>
    
    <!-- Row 2: Custom Search Input (If active) -->
    {#if searchMode === 'custom'}
        <div class="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-top-1">
            <div class="relative flex-1">
                <input 
                    type="text" 
                    bind:value={customSearchQuery} 
                    onkeydown={handleSearchKeydown}
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
                onclick={performSearch}
                class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md shadow-sm transition-colors"
            >
                Search
            </button>
            
            <div class="flex gap-0.5">
                <button onclick={prevResult} disabled={searchResults.length === 0} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button onclick={nextResult} disabled={searchResults.length === 0} class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>
        </div>
    {/if}

    <!-- Search Results Summary & List (Appears for both Standard and Custom search if results exist) -->
    {#if searchResults.length > 0}
        <div class="relative z-20 ml-1">
            <div class="relative">
                <button 
                    onclick={() => showSearchResultsList = !showSearchResultsList}
                    class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-900/50 rounded-full shadow-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-sm font-medium text-purple-700 dark:text-purple-300 group"
                >
                    <span class="w-2 h-2 rounded-full {checkedCount === searchResults.length ? 'bg-green-500' : 'bg-purple-500'}"></span>
                    <span>{checkedCount} / {searchResults.length} Checked</span>
                    <svg class="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-transform {showSearchResultsList ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {#if showSearchResultsList}
                    <div class="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-[60vh] flex flex-col">
                        <div class="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                             <div class="flex justify-between items-center mb-1">
                                <span class="text-xs font-bold text-gray-500 uppercase">Found Intents</span>
                                <span class="text-[10px] text-gray-400">{checkedCount} selected</span>
                             </div>
                        </div>
                        <div class="overflow-y-auto p-1 flex-1">
                            {#each searchResults as id, index}
                                {@const node = findNodeById(currentTree.roots, id)}
                                <div class="flex items-center gap-1 group/item p-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded">
                                    <!-- Checkbox (syncs with checkedIntents) -->
                                    <button 
                                        class="p-1.5 rounded text-gray-400 hover:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-700 {checkedIntents.has(id) ? 'text-green-500' : ''}"
                                        onclick={(e) => { e.stopPropagation(); toggleCheckIntent(id); }}
                                    >
                                        {#if checkedIntents.has(id)}
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                                        {:else}
                                            <div class="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded"></div>
                                        {/if}
                                    </button>
                                    
                                    <!-- Label & Jump -->
                                    <button 
                                        onclick={() => {
                                            currentResultIndex = index;
                                            jumpToResult(index);
                                        }}
                                        class="flex-1 text-left text-xs px-1 py-1 truncate {index === currentResultIndex ? 'text-purple-600 font-medium' : 'text-gray-600 dark:text-gray-300'}"
                                        title={node ? node.displayName : id}
                                    >
                                        {node ? node.displayName : id}
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Checklist Counter UI -->
    {#if checkedIntents.size > 0}
      <div class="absolute top-16 right-4 z-50">
        <div class="relative">
          <button 
            onclick={() => showChecklist = !showChecklist}
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
                <button onclick={resetChecklist} class="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                  Reset
                </button>
              </div>
              <div class="max-h-60 overflow-y-auto p-1">
                {#each [...checkedIntents] as id}
                  {@const node = findNodeById(currentTree.roots, id)}
                  <button 
                    onclick={() => jumpToIntent(id)}
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
    <div class="flex-1 overflow-auto bg-gray-50 dark:bg-[#0a0a0a] relative" bind:this={zoomContainer} onwheel={handleWheel}>
        <div 
          class="min-w-full min-h-full p-8 origin-top-left"
          style="transform: scale({scale}); width: {100/scale}%; height: {100/scale}%;"
          onclick={() => selectedNode = null}
          onkeydown={(e) => e.key === 'Escape' && (selectedNode = null)}
          role="presentation"
        >
          {#if $allIntents.length === 0}
              <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                  <p>Loading intents...</p>
                  <button onclick={() => fetchAllIntents()} class="mt-4 text-blue-500 hover:underline">Retry</button>
              </div>
          {:else if currentTree && currentTree.roots.length > 0}
            <div class="flex flex-row flex-wrap gap-8 justify-center items-start min-w-max pb-20">
              {#each currentTree.roots as root}
                <IntentTreeNode node={root} onselect={handleNodeSelect} oncheck={handleNodeCheck} />
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
