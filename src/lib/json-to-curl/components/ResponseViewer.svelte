<script lang="ts">
  import JsonParser from "../../tools/JsonParser.svelte";

  let {
    activeTab = $bindable("curl"),
    curlCommand = "",
    httpRequest = "",
    response = $bindable(""),
    responseStatus = null,
    responseTime = null
  }: {
    activeTab?: string;
    curlCommand?: string;
    httpRequest?: string;
    response?: string;
    responseStatus?: number | null;
    responseTime?: number | null;
  } = $props();

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
</script>

<div class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex flex-col h-[600px]">
  <div class="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
    <button 
      onclick={() => activeTab = 'curl'}
      class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {activeTab === 'curl' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}"
    >
      CURL
    </button>
    <button 
      onclick={() => activeTab = 'http'}
      class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {activeTab === 'http' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}"
    >
      HTTP
    </button>
    <button 
      onclick={() => activeTab = 'response'}
      class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {activeTab === 'response' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}"
    >
      Response
      {#if responseStatus}
        <span class="ml-2 px-1.5 py-0.5 text-xs rounded {responseStatus >= 200 && responseStatus < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
          {responseStatus}
        </span>
      {/if}
    </button>
  </div>

  <div class="flex-1 overflow-hidden relative">
    {#if activeTab === 'curl'}
      <div class="absolute inset-0 flex flex-col">
        <textarea 
          readonly 
          class="flex-1 w-full p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-lg resize-none focus:outline-none"
          value={curlCommand}
        ></textarea>
        <button 
          onclick={() => copyToClipboard(curlCommand)}
          class="absolute top-4 right-4 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors shadow-sm"
        >
          Copy
        </button>
      </div>
    {/if}

    {#if activeTab === 'http'}
      <div class="absolute inset-0 flex flex-col">
        <textarea 
          readonly 
          class="flex-1 w-full p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm rounded-lg resize-none border border-gray-200 dark:border-gray-700 focus:outline-none"
          value={httpRequest}
        ></textarea>
        <button 
          onclick={() => copyToClipboard(httpRequest)}
          class="absolute top-4 right-4 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs rounded-lg transition-colors shadow-sm"
        >
          Copy
        </button>
      </div>
    {/if}

    {#if activeTab === 'response'}
       <div class="absolute inset-0 flex flex-col">
          {#if responseTime}
            <div class="mb-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end font-mono">
              Time: {responseTime}ms
            </div>
          {/if}
          <div class="flex-1 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
             <!-- Note: JsonParser is imported from relative path -->
             <JsonParser bind:inputText={response} hideHeader={true} />
          </div>
       </div>
    {/if}
  </div>
</div>
