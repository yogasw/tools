<script lang="ts">
  import type { Header } from '../core';

  let {
    method = $bindable("GET"),
    url = $bindable(""),
    headers = $bindable([]),
    body = $bindable(""),
    isLoading = $bindable(false),
    onsend
  }: {
    method?: string;
    url: string;
    headers: Header[];
    body?: string;
    isLoading?: boolean;
    onsend?: () => void;
  } = $props();

  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

  function addHeader() {
    headers = [...headers, { key: "", value: "" }];
  }

  function removeHeader(index: number) {
    headers = headers.filter((_, i) => i !== index);
  }

  function sendRequest() {
    onsend?.();
  }
</script>

<div class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
  <div class="flex items-center justify-between mb-4">
     <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Request Builder</h2>
     {#if isLoading}
        <span class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">Request in progress...</span>
     {/if}
  </div>
  
  <!-- URL Bar -->
  <div class="flex gap-2 mb-4">
    <select 
      bind:value={method}
      class="w-24 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
    >
      {#each methods as m}
        <option value={m}>{m}</option>
      {/each}
    </select>
    <input 
      type="text" 
      bind:value={url}
      placeholder="Enter URL (e.g., https://api.example.com/v1/users)"
      class="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
    />
    <button 
      onclick={sendRequest}
      disabled={isLoading || !url}
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
    >
      {#if !isLoading}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      {/if}
      Send
    </button>
  </div>

  <!-- Headers -->
  <div class="mb-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Headers</span>
      <button 
        onclick={addHeader}
        class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        + Add Header
      </button>
    </div>
    <div class="space-y-2 max-h-40 overflow-y-auto">
      {#each headers as header, i}
        <div class="flex gap-2">
          <input 
            type="text" 
            placeholder="Key"
            bind:value={header.key}
            class="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white"
          />
          <input 
            type="text" 
            placeholder="Value"
            bind:value={header.value}
            class="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white"
          />
          <button 
            onclick={() => removeHeader(i)}
            class="p-2 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove header"
            title="Remove header"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      {/each}
      {#if headers.length === 0}
        <p class="text-xs text-gray-500 italic">No headers set.</p>
      {/if}
    </div>
  </div>

  <!-- Body Input -->
  {#if ['POST', 'PUT', 'PATCH'].includes(method || "")}
    <div class="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
      <span class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Request Body (JSON)</span>
      <textarea 
        bind:value={body}
        placeholder={'{"key": "value"}'}
        class="w-full h-[200px] px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-mono text-sm resize-none"
      ></textarea>
    </div>
  {/if}
</div>
