<script>
  export let messages = [];
  export let searchQuery = '';
  
  let expandedRaw = new Set();
  
  function toggleRaw(order) {
    if (expandedRaw.has(order)) {
      expandedRaw.delete(order);
    } else {
      expandedRaw.add(order);
    }
    expandedRaw = expandedRaw;
  }
  
  $: filteredMessages = searchQuery.trim() 
    ? messages.filter(m => 
        m.userText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.intentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.botText?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;
</script>

<div class="h-full overflow-y-auto p-4">
  <div class="space-y-4">
    {#each filteredMessages as interaction}
      <div class="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-700 p-4 {interaction.isFallback ? 'border-yellow-300 dark:border-yellow-700' : ''}">
        <!-- Header: Number + Intent Name + Raw Button + Timestamp -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full">
              {interaction.order}
            </div>
            <span class="font-medium text-sm text-gray-900 dark:text-white">
              {interaction.intentName}
            </span>
            <span class="text-[10px] text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
              {(interaction.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button 
              on:click={() => toggleRaw(interaction.order)}
              class="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title="View Raw JSON"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <span class="text-xs text-gray-400 dark:text-gray-500">
              {interaction.timestamp?.slice(11, 19) || ''}
            </span>
          </div>
        </div>
        
        <!-- Chat Messages: User (right) then Bot (left) -->
        <div class="space-y-2 mb-3">
          <!-- User Message (Right) -->
          <div class="flex justify-end">
            <div class="flex items-start gap-2 max-w-[80%]">
              <div class="px-4 py-2 bg-blue-600 text-white rounded-2xl rounded-br-md">
                <p class="text-sm">{interaction.userText || '—'}</p>
              </div>
              <div class="flex-shrink-0 w-7 h-7 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-xs">
                👤
              </div>
            </div>
          </div>
          
          <!-- Bot Message (Left) -->
          <div class="flex justify-start">
            <div class="flex items-start gap-2 max-w-[80%]">
              <div class="flex-shrink-0 w-7 h-7 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xs">
                🤖
              </div>
              <div class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-md">
                <p class="text-sm">{interaction.botText || '(No response)'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Contexts & Webhook Status -->
        <div class="text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5 border-t border-gray-100 dark:border-gray-800 pt-2">
          {#if interaction.inputContexts?.length > 0}
            <p>Input Contexts: {interaction.inputContexts.join(', ')}</p>
          {/if}
          {#if interaction.outputContexts?.length > 0}
            <p>Output Contexts: {interaction.outputContexts.join(', ')}</p>
          {/if}
          {#if interaction.webhookStatus}
            <p class="{interaction.webhookStatus === 'Webhook execution successful' ? '' : 'text-red-500'}">
              Webhook: {interaction.webhookStatus}
            </p>
          {/if}
        </div>
        
        <!-- Raw JSON (Expandable) -->
        {#if expandedRaw.has(interaction.order)}
          <div class="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Raw Interaction Log</span>
              <button 
                on:click={() => navigator.clipboard.writeText(JSON.stringify(interaction.rawData, null, 2))}
                class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Copy
              </button>
            </div>
            <div class="bg-gray-50 dark:bg-[#0a0a0a] p-3 max-h-80 overflow-auto">
              <pre class="text-xs text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">{JSON.stringify(interaction.rawData, null, 2)}</pre>
            </div>
          </div>
        {/if}
      </div>
    {/each}
    
    {#if filteredMessages.length === 0}
      <div class="text-center text-gray-400 dark:text-gray-600 py-8">
        <p class="text-sm">No interactions to display</p>
      </div>
    {/if}
  </div>
</div>
