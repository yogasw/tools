<script>
  export let intents = [];
  export let searchQuery = '';
  
  $: filteredIntents = searchQuery.trim()
    ? intents.filter(i =>
        i.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.queryText?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : intents;
</script>

<div class="h-full overflow-y-auto p-4">
  <div class="space-y-2">
    {#each filteredIntents as intent}
      <div class="flex gap-3 p-3 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-700 {intent.isFallback ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10' : ''}">
        <div class="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-blue-600 text-white text-xs font-semibold rounded-full">
          {intent.order}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-sm text-gray-900 dark:text-white">
              {#if intent.isFallback}🔖 {/if}{intent.displayName}
            </span>
            <span class="text-[10px] text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
              {(intent.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 truncate">{intent.queryText}</p>
          {#if intent.webhookStatus && intent.webhookStatus !== 'Webhook execution successful'}
            <p class="text-[10px] text-red-500 mt-1">⚠️ {intent.webhookStatus}</p>
          {/if}
        </div>
      </div>
    {/each}
    {#if filteredIntents.length === 0}
      <div class="text-center text-gray-400 dark:text-gray-600 py-8">
        <p class="text-sm">No intents to display</p>
      </div>
    {/if}
  </div>
</div>
