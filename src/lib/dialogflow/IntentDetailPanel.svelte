<script>
  /**
   * @typedef {Object} IntentNode
   * @property {string} id
   * @property {string} [name]
   * @property {string} [displayName]
   * @property {string} [action]
   * @property {string[]} [inputContexts]
   * @property {Array<string|{name: string, lifespanCount?: number}>} [outputContexts]
   * @property {any[]} [events]
   */

  /** @type {IntentNode} */
  export let node = null;
  
  import { getConsoleUrl } from '$lib/dialogflow/dialogflow-api.js';

  function getContextDisplay(ctx) {
    if (typeof ctx === 'string') {
      return { name: ctx.split('/').pop(), lifespan: null };
    }
    return { 
      name: ctx.name ? ctx.name.split('/').pop() : 'Unknown',
      lifespan: ctx.lifespanCount 
    };
  }
</script>

{#if node}
  <div class="h-full flex flex-col bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-gray-800 w-[300px] shadow-xl z-20 overflow-y-auto">
    <div class="p-4 border-b border-gray-100 dark:border-gray-800">
      <h3 class="font-bold text-gray-900 dark:text-white text-lg break-words leading-tight">
        {node.displayName || 'Unnamed Intent'}
      </h3>
      <a 
        href={getConsoleUrl(node.name)} 
        target="_blank" 
        rel="noopener noreferrer"
        class="text-blue-500 hover:text-blue-600 text-xs mt-1 inline-flex items-center gap-1"
      >
        Link Dialogflow
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
      </a>
    </div>

    <div class="p-4 space-y-6">
      
      <!-- Contexts Row -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Input Context</h4>
          {#if node.inputContexts && node.inputContexts.length > 0}
            <div class="flex flex-col gap-1">
              {#each node.inputContexts as ctx}
                <span class="text-sm text-gray-800 dark:text-gray-200 break-words font-mono bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded">
                  {typeof ctx === 'string' ? ctx.split('/').pop() : 'Unknown'}
                </span>
              {/each}
            </div>
          {:else}
            <span class="text-xs text-gray-400 italic">None</span>
          {/if}
        </div>
        
        <div>
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Output Context</h4>
          {#if node.outputContexts && node.outputContexts.length > 0}
            <div class="flex flex-col gap-1">
              {#each node.outputContexts as ctx}
                {@const display = getContextDisplay(ctx)}
                <span class="text-sm text-gray-800 dark:text-gray-200 break-words font-mono bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded">
                  {display.name}{#if display.lifespan !== undefined && display.lifespan !== null}<span class="text-gray-400 ml-1">({display.lifespan})</span>{/if}
                </span>
              {/each}
            </div>
          {:else}
            <span class="text-xs text-gray-400 italic">None</span>
          {/if}
        </div>
      </div>

      <!-- Action -->
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Action</h4>
        <div class="text-sm text-gray-900 dark:text-gray-100 break-all font-mono">
           {node.action || '-'}
        </div>
      </div>
      
      <!-- Full ID -->
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resource Name</h4>
        <div class="text-[10px] text-gray-500 break-all font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-800 select-all">
           {node.name || node.id || '-'}
        </div>
      </div>

    </div>
  </div>
{:else}
  <div class="hidden"></div>
{/if}
