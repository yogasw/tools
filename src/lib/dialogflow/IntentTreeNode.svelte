<script>
  import { createEventDispatcher } from 'svelte';
  import { getConsoleUrl } from '$lib/dialogflow/dialogflow-api.js';
  
  export let node;
  
  const dispatch = createEventDispatcher();
  
  $: visibleChildren = node.children || [];
  $: hasMultipleChildren = visibleChildren.length > 1;
  $: hasActiveChild = visibleChildren.some(child => child.active);

  // Helper to determine if a connection should be active (pink/solid) or inactive (gray/dashed)
  // A connection segment is active if it leads to an active node
  function isChildActive(child) {
    return child.active;
  }
  
  function startSelection(e) {
    e.stopPropagation();
    // Dispatch check event to parent to handle state
    dispatch('check', node);
  }

  function handleClick(e) {
    e.stopPropagation();
    // Only dispatch select for detail view, DO NOT toggle node.selected
    dispatch('select', node);
  }
</script>

<style>
  /* Animated marching ants effect - vertical */
  .connector-v-animated {
    background-image: linear-gradient(
      to bottom,
      #ec4899 50%,
      transparent 50%
    );
    background-size: 2px 12px;
    animation: march 0.5s linear infinite;
  }
  
  .connector-h-animated {
    background-image: linear-gradient(
      to right,
      #ec4899 50%,
      transparent 50%
    );
    background-size: 12px 2px;
    animation: march-h 0.5s linear infinite;
  }
  
  .connector-v-static {
    background-color: #d1d5db; /* gray-300 */
  }
  
  /* Active Pink Styles */
  .line-active {
    border-color: #ec4899; /* pink-500 */
    border-style: dashed;
    animation: pulse-pink 2s infinite;
  }
  
  /* Inactive Gray Styles */
  .line-inactive {
    border-color: #d1d5db; /* gray-300 */
    border-style: solid;
    animation: none !important;
  }
  
  @keyframes march {
    0% { background-position: 0 0; }
    100% { background-position: 0 12px; }
  }
  @keyframes march-h {
    0% { background-position: 0 0; }
    100% { background-position: 12px 0; }
  }

  @keyframes pulse-pink {
    0%, 100% { border-color: #ec4899; }
    50% { border-color: #f9a8d4; } /* pink-300 */
  }
  
  /* Highlight Glow Effect */
  .node-highlight {
    box-shadow: 0 0 0 2px #ec4899, 0 0 8px rgba(236, 72, 153, 0.5); /* pink-500 */
    animation: glow-pulse 1.5s infinite alternate;
  }

  @keyframes glow-pulse {
    from { box-shadow: 0 0 0 2px #ec4899, 0 0 4px rgba(236, 72, 153, 0.3); }
    to { box-shadow: 0 0 0 2px #ec4899, 0 0 12px rgba(236, 72, 153, 0.6); }
  }
  
  :global(.dark) .line-inactive {
    border-color: #4b5563; /* gray-600 */
  }
  :global(.dark) .connector-v-static {
    background-color: #4b5563;
  }
</style>

<div class="inline-flex flex-col items-center">
  <!-- Node box -->
  <div 
    id="node-{node.id}"
    on:click={handleClick} 
    role="button"
    tabindex="0"
    on:keypress={(e) => e.key === 'Enter' && handleClick(e)}
    class="px-3 py-1.5 rounded-lg border-2 text-xs font-medium whitespace-nowrap z-20 transition-all duration-200 cursor-pointer select-none
    bg-white dark:bg-gray-800
    {node.highlighted ? 'node-highlight scale-105' : ''}
    {node.isFallback 
      ? 'border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
      : node.active 
        ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700'
        : 'border-gray-200 dark:border-gray-700'} group">
    
    <div class="flex items-center gap-1.5">
      <!-- Check mark selection indicator (Always visible if selected) -->
      {#if node.selected}
        <span class="text-green-500 dark:text-green-400 font-bold text-sm">✓</span>
      {/if}

      {#if node.isFallback}
        <span class="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></span>
      {/if}
      <span class="{node.active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}">
        {node.displayName}
      </span>
      {#if node.history}
        <span class="text-pink-600 dark:text-pink-400 font-bold">
          ({node.history})
        </span>
      {/if}

      <!-- Hover Actions (Expand on Hover) -->
      <div class="flex items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-2 group-hover:pl-2 group-hover:border-l border-gray-200 dark:border-gray-600">
        <!-- Toggle Select -->
        <button 
            on:click|stopPropagation={startSelection}
            class="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-green-500 transition-colors"
            title="Toggle Selection"
        >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </button>
        
        <!-- Goto Dialogflow -->
        <a 
            href={getConsoleUrl(node.name)} 
            target="_blank"
            on:click|stopPropagation 
            class="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-blue-500 transition-colors"
            title="Open in Dialogflow"
        >
             <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      </div>
    </div>
  </div>
  
  <!-- Children section -->
  {#if visibleChildren.length > 0}
    <!-- Vertical line from parent -->
    <div class="w-0.5 h-4 {node.active && hasActiveChild ? 'connector-v-animated' : 'connector-v-static'}"></div>
    
    <!-- Dot at junction -->
    <div class="w-2 h-2 rounded-full z-20 {node.active && hasActiveChild ? 'bg-pink-500' : 'bg-gray-400'}"></div>
    
    {#if hasMultipleChildren}
      <div class="flex items-start pt-1">
        {#each visibleChildren as child, idx}
          <!-- Wrapper with padding for spacing -->
          <div class="flex flex-col items-center relative mx-1">
            
            <!-- CONNECTORS -->
            <!-- 1. First Child (Leftmost) -->
            {#if idx === 0}
              <!-- Container for the connection arm: Starts from Child Center (50%-1px) extends to Right Edge + Margin -->
              <div class="absolute left-[calc(50%-1px)] -top-[5px] h-4 w-[calc(50%+5px)]">
                <!-- If active, use split animated line + dashed corner. If inactive, use border connection. -->
                {#if child.active}
                   <!-- Corner Piece (Left side so clear border-l aligns with center) -->
                   <div class="absolute left-0 top-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-xl line-active box-border"></div>
                   <!-- Straight Line (Right side) -->
                   <div class="absolute right-0 top-0 h-[2px] w-[calc(100%-15px)] connector-h-animated"></div>
                {:else}
                   <!-- Inactive: standard border approach -->
                   <div class="w-full h-full border-t-2 border-l-2 rounded-tl-xl line-inactive"></div>
                {/if}
              </div>


            <!-- 2. Last Child (Rightmost) -->
            {:else if idx === visibleChildren.length - 1}
              <!-- Container: Starts from Left Edge - Margin extends to Child Center (50%+1px)
                   Since we position from Right, it is right: calc(50% - 1px). Width covers to gap. -->
              <div class="absolute right-[calc(50%-1px)] -top-[5px] h-4 w-[calc(50%+5px)]">
                 {#if child.active}
                   <!-- Corner Piece (Right side) -->
                   <div class="absolute right-0 top-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-xl line-active box-border"></div>
                   <!-- Straight Line (Left side) -->
                   <div class="absolute left-0 top-0 h-[2px] w-[calc(100%-15px)] connector-h-animated"></div>
                 {:else}
                   <div class="w-full h-full border-t-2 border-r-2 rounded-tr-xl line-inactive"></div>
                 {/if}
              </div>


            <!-- 3. Middle Child -->
            {:else}
              <!-- Horizontal Bar -->
              <div class="absolute left-1/2 -translate-x-1/2 -top-[5px] h-[2px] w-[calc(100%+8px)]
                   {child.active ? 'connector-h-animated' : 'bg-gray-300 dark:bg-gray-600'}"></div>
              
              <!-- Vertical Drop -->
               <div class="absolute left-1/2 -translate-x-1/2 -top-[5px] w-0.5 h-4
                    {child.active ? 'connector-v-animated' : 'bg-gray-300 dark:bg-gray-600'}"></div>
            {/if}

            <!-- Spacer for the connector height -->
            <div class="h-2"></div>
            
            <svelte:self node={child} on:select on:check />
          </div>
        {/each}
      </div>
    {:else}
      <!-- Single child - just vertical line -->
      <div class="w-0.5 h-3 {visibleChildren[0]?.active ? 'connector-v-animated' : 'connector-v-static'}"></div>
      <svelte:self node={visibleChildren[0]} on:select on:check />
    {/if}
  {/if}
</div>
