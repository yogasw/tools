<script>
  import { configUrl, configAuthorization, configCookie, error } from '$lib/dialogflow/dialogflow-store.js';
  
  export let showAdvanced = false;
</script>

<div class="px-4 pb-4 bg-gray-50/50 dark:bg-gray-900/30">
  <div class="grid gap-3">
    <!-- URL -->
    <div>
      <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">API URL</label>
      <input 
        type="text" 
        bind:value={$configUrl}
        placeholder="https://dialogflow.clients6.google.com/v2beta1/..."
        class="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-mono"
      />
    </div>
    
    <!-- Auth & Cookie -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Authorization</label>
        <input 
          type="text" 
          bind:value={$configAuthorization}
          placeholder="Bearer ..."
          class="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-mono"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Cookie</label>
        <input 
          type="text"
          bind:value={$configCookie}
          placeholder="Cookie header value"
          class="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-mono"
        />
      </div>
    </div>
    
    {#if $error}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <p class="text-sm text-red-600 dark:text-red-400">⚠️ {$error}</p>
      </div>
    {/if}
  </div>
</div>
