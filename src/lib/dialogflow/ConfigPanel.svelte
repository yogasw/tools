<script>
  import { configUrl, configAuthorization, configPageSize, configInteractionsPageSize, error } from '$lib/dialogflow/dialogflow-store.js';
  
  export let showAdvanced = false;
  
  let showHelpModal = false;

  function handleKeydown(e) {
    if (e.key === 'Escape' && showHelpModal) {
      showHelpModal = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="px-4 pb-4 bg-gray-50/50 dark:bg-gray-900/30">
  <div class="grid gap-3">
    <!-- URL -->
    <div>
      <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
        History API URL <span class="text-gray-400 font-normal normal-case ml-1">(Full path link api history dialogflow)</span>
      </label>
      
      <!-- Warning -->
      <div class="mb-3 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md flex items-start gap-2">
        <span class="text-yellow-600 dark:text-yellow-500 text-lg leading-none mt-0.5">🔒</span>
        <p class="text-xs text-yellow-700 dark:text-yellow-400 leading-snug">
          <strong>Privacy Note:</strong> This data is processed locally in your browser. No data is sent to any backend server.
        </p>
      </div>

      <input 
        type="text" 
        bind:value={$configUrl}
        placeholder="https://dialogflow.clients6.google.com/v2beta1/projects/..."
        class="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-mono mb-2"
      />
      
      <!-- Help Image Launcher -->
      <div class="mt-1">
        <button 
          on:click={() => showHelpModal = true}
          class="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline flex items-center gap-1"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How to get this URL?
        </button>
      </div>
    </div>
    
    <!-- Authorization -->
    <div>
      <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Authorization</label>
      <input 
        type="text" 
        bind:value={$configAuthorization}
        placeholder="Bearer ..."
        class="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-mono"
      />
    </div>

    <!-- Page Sizes -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Page Size</label>
        <input 
          type="number" 
          bind:value={$configPageSize}
          placeholder="5000"
          class="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-mono"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Interactions Page Size</label>
        <input 
          type="number"
          bind:value={$configInteractionsPageSize}
          placeholder="50"
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

<!-- Help Modal -->
{#if showHelpModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
      on:click={() => showHelpModal = false}
      role="button"
      tabindex="-1"
      on:keydown={() => {}}
    ></div>

    <!-- Modal Panel -->
    <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-800 flex flex-col">
      <!-- Close Button -->
      <button 
        on:click={() => showHelpModal = false}
        class="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
        aria-label="Close modal"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Image -->
      <div class="p-2">
         <img src="/dialogflow.png" alt="How to find Dialogflow History API URL" class="w-full h-auto rounded-lg" />
      </div>
    </div>
  </div>
{/if}
