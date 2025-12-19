<script>
  import { historyData, filteredHistory, selectedSessionIndex, historySearchQuery, addTab } from '$lib/dialogflow/dialogflow-store.js';
  
  function handleSelectSession(index, sessionData) {
    $selectedSessionIndex = index;
    addTab(index, sessionData);
  }
</script>

<div class="bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
  <div class="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-800">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Conversations</h2>
      {#if $historyData?.sessionConversations}
        <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
          {$filteredHistory.length} / {$historyData.sessionConversations.length}
        </span>
      {/if}
    </div>
    <input 
      type="search" 
      bind:value={$historySearchQuery}
      placeholder="Search sessions, intents..."
      class="w-full px-3 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-xs"
    />
  </div>
  
  <div class="flex-1 overflow-y-auto p-2">
    {#if !$historyData?.sessionConversations}
      <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
        <div class="text-center">
          <svg class="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="text-xs">No data loaded</p>
          <p class="text-xs opacity-60">Configure and fetch above</p>
        </div>
      </div>
    {:else if $filteredHistory.length === 0}
      <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
        <p class="text-xs">No results found</p>
      </div>
    {:else}
      {#each $filteredHistory as session}
        <button 
          class="w-full text-left p-3 rounded-lg mb-1 transition-colors {$selectedSessionIndex === session.no - 1 ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'}"
          on:click={() => handleSelectSession(session.no - 1, session)}
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
              {session.conversationResponse?.sessionId?.slice(-12) || `Session ${session.no}`}
            </span>
            <span class="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              {session.total_interactions || 0}
            </span>
          </div>
          <p class="text-xs text-gray-900 dark:text-white truncate mb-1">
            {session.conversationResponse?.queryText || ''}
          </p>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-400 dark:text-gray-500">
              {session.startTime?.slice(0, 16).replace('T', ' ') || ''}
            </span>
            {#if session.webhook_error_status}
              <span class="text-xs" title={session.webhook_error_status}>⚠️</span>
            {/if}
          </div>
        </button>
      {/each}
    {/if}
  </div>
</div>
