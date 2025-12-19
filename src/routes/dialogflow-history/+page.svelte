<script>
  import { onMount } from 'svelte';
  import {
    configUrl,
    isLoading,
    openTabs,
    activeTabIndex,
    detailSearchQuery,
    detailViewMode,
    currentTabData,
    closeTab,
    selectTab,
    isLoadingIntents
  } from '$lib/dialogflow/dialogflow-store.js';
  
  import { fetchHistory, extractChatMessages, extractIntentHistory, refreshAllData } from '$lib/dialogflow/dialogflow-api.js';
  
  import ConfigPanel from '$lib/dialogflow/ConfigPanel.svelte';
  import HistoryList from '$lib/dialogflow/HistoryList.svelte';
  import ChatView from '$lib/dialogflow/ChatView.svelte';
  import IntentView from '$lib/dialogflow/IntentView.svelte';
  
  let configCollapsed = false;
  let showCopied = false;
  
  onMount(() => {
    if ($configUrl?.trim()) {
      handleFetch();
    }
  });
  
  async function handleFetch() {
    const result = await fetchHistory();
    if (result?.sessionConversations) {
      configCollapsed = true;
    }
  }
  
  function copyRawJson() {
    if (!$currentTabData?.data) return;
    navigator.clipboard.writeText(JSON.stringify($currentTabData.data, null, 2));
    showCopied = true;
    setTimeout(() => showCopied = false, 2000);
  }
  
  $: chatMessages = $currentTabData?.data ? extractChatMessages($currentTabData.data) : [];
  $: intentHistory = $currentTabData?.data ? extractIntentHistory($currentTabData.data) : [];
  
  $: isRefreshing = $isLoading || $isLoadingIntents;
</script>

<svelte:head>
  <title>Dialogflow History Tool</title>
  <meta name="description" content="Modern tool for viewing and searching Dialogflow conversation history" />
</svelte:head>

<div class="h-full flex flex-col overflow-hidden">
  <!-- Header -->
  <div class="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex-1">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          💬 Dialogflow History Tool
        </h1>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          View and search Dialogflow conversation history
        </p>
      </div>
      
      <div class="flex items-center gap-2">
        <button
          on:click={handleFetch}
          disabled={$isLoading}
          class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
        >
          {#if $isLoading}
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Fetching...
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Fetch History
          {/if}
        </button>
        
        <button
          on:click={() => configCollapsed = !configCollapsed}
          class="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5 {!$configUrl ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md ring-2 ring-blue-500/50' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Config Authorization 
        </button>
      </div>
    </div>
    
    {#if !configCollapsed}
      <ConfigPanel />
    {/if}
  </div>
  
  <!-- Main Content -->
  <div class="flex-1 grid grid-cols-[300px_1fr] overflow-hidden">
    <!-- Left Panel -->
    <HistoryList />
    
    <!-- Right Panel -->
    <div class="bg-gray-50 dark:bg-[#0f0f0f] flex flex-col overflow-hidden">
      {#if $openTabs.length === 0}
        <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p class="text-sm">Select a conversation to view details</p>
          </div>
        </div>
      {:else}
        <!-- Tabs -->
        <div class="flex-shrink-0 flex items-center gap-1 px-2 py-2 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          {#each $openTabs as tab, idx}
            <div 
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs {$activeTabIndex === idx ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}"
              role="button"
              tabindex="0"
              on:click={() => selectTab(idx)}
              on:keydown={(e) => e.key === 'Enter' && selectTab(idx)}
            >
              <span class="truncate max-w-[100px]">{tab.sessionId.slice(-8)}</span>
              <button 
                class="ml-1 hover:text-red-500 transition-colors"
                on:click|stopPropagation={() => closeTab(idx)}
              >×</button>
            </div>
          {/each}
        </div>
        
        <!-- Detail Header -->
        <div class="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
          <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              on:click={() => $detailViewMode = 'chat'}
              class="px-3 py-1 text-xs font-medium rounded transition-colors {$detailViewMode === 'chat' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}"
            >
              💬 Chat
            </button>
            <button
              on:click={() => $detailViewMode = 'intent'}
              class="px-3 py-1 text-xs font-medium rounded transition-colors {$detailViewMode === 'intent' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}"
            >
              🎯 Intents
            </button>
          </div>
          
          <input 
            type="search" 
            bind:value={$detailSearchQuery}
            placeholder="Search in conversation..."
            class="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-xs"
          />
          
          <button
            on:click={copyRawJson}
            class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          
          <button
            on:click={() => refreshAllData()}
            disabled={isRefreshing}
            class="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
            title="Refresh intents & history"
          >
            <svg class="w-4 h-4 {isRefreshing ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        <!-- Content - Fixed height scroll container -->
        <div class="flex-1 min-h-0 overflow-hidden">
          {#if $detailViewMode === 'chat'}
            <ChatView messages={chatMessages} searchQuery={$detailSearchQuery} />
          {:else}
            <IntentView sessionData={$currentTabData?.data} searchQuery={$detailSearchQuery} />
          {/if}
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Copied Notification -->
  {#if showCopied}
    <div class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      Copied!
    </div>
  {/if}
</div>
