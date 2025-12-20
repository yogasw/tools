<script lang="ts">
  import type { ImportConfig } from '../core';

  let {
    showMappingModal = $bindable(false),
    importConfig = $bindable(),
    availableImportKeys = [],
    onclose
  }: {
    showMappingModal: boolean;
    importConfig: ImportConfig;
    availableImportKeys: string[];
    onclose?: () => void;
  } = $props();

  function closeModal() {
    onclose?.();
  }
</script>

{#if showMappingModal}
  <div class="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
    <div class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg overflow-hidden animate-scale-in">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Configure Field Mapping</h3>
        <button 
          onclick={closeModal}
          aria-label="Close modal"
          title="Close modal"
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div class="p-6 space-y-6">
         <p class="text-sm text-gray-600 dark:text-gray-400">
           Map keys from your imported JSON to the request fields. You can select a key or type a template variable (e.g. <code>$host/$path</code>).
         </p>

         <datalist id="available-keys">
            {#each availableImportKeys as key}
              <option value={key}></option>
            {/each}
         </datalist>

         <div class="space-y-4">
            <!-- URL -->
            <div>
              <label for="modal-import-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL / Endpoint</label>
              <div class="relative">
                 <input 
                    type="text" 
                    id="modal-import-url" 
                    bind:value={importConfig.url} 
                    list="available-keys"
                    placeholder="Select key or type $variable/path"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                 />
              </div>
            </div>
            
            <!-- Method -->
            <div>
              <label for="modal-import-method" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
              <div class="relative">
                 <input 
                    type="text" 
                    id="modal-import-method" 
                    bind:value={importConfig.method} 
                    list="available-keys"
                    placeholder="Select key or type GET/POST"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                 />
               </div>
            </div>

            <!-- Headers -->
            <div>
              <label for="modal-import-headers" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headers</label>
              <div class="relative">
                 <input 
                    type="text" 
                    id="modal-import-headers" 
                    bind:value={importConfig.headers} 
                    list="available-keys"
                    placeholder="Select key for headers object"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                 />
              </div>
            </div>

            <!-- Body -->
            <div>
              <label for="modal-import-body" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body / Payload</label>
              <div class="relative">
                 <input 
                    type="text" 
                    id="modal-import-body" 
                    bind:value={importConfig.body} 
                    list="available-keys"
                    placeholder="Select key for body"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                 />
              </div>
            </div>
         </div>
      </div>
      
      <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
        <button 
           onclick={closeModal}
           class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  </div>
{/if}
