<script>
  import { 
    generateCurlCommand, 
    generateHttpRequest, 
    importFromJson 
  } from "./core";
  
  import RequestEditor from "./components/RequestEditor.svelte";
  import ResponseViewer from "./components/ResponseViewer.svelte";
  import ImportConfigSidebar from "./components/ImportConfig.svelte";
  import MappingModal from "./components/MappingModal.svelte";

  // State
  let method = $state("GET");
  let url = $state("");
  let headers = $state([]);
  let body = $state("");
  
  let response = $state("");
  let activeTab = $state("curl");
  let isLoading = $state(false);
  let responseStatus = $state(null);
  let responseTime = $state(null);
  let showImportSidebar = $state(true);
  let showMappingModal = $state(false);

  // Import State
  let importJsonInput = $state("");
  let importConfig = $state({
    url: "",
    method: "",
    headers: "",
    body: ""
  });
  let availableImportKeys = $state([]);

  // Derived
  let curlCommand = $derived(generateCurlCommand(method, url, headers, body));
  let httpRequest = $derived(generateHttpRequest(method, url, headers, body));
  
  // Import Logic Effect
  $effect(() => {
    if (importJsonInput) {
       const result = importFromJson(importJsonInput, importConfig);
       availableImportKeys = result.availableKeys;
       
       if (result.config.url && !importConfig.url) importConfig.url = result.config.url;
       if (result.config.method && !importConfig.method) importConfig.method = result.config.method;
       if (result.config.headers && !importConfig.headers) importConfig.headers = result.config.headers;
       if (result.config.body && !importConfig.body) importConfig.body = result.config.body;

       // Update State from Import
       if (result.url) url = result.url;
       if (result.method) method = result.method;
       if (result.headers) headers = result.headers;
       if (result.body) body = result.body;
    } else {
      // Clear state when input is empty
      url = "";
      method = "GET";
      headers = [];
      body = "";
      availableImportKeys = [];
      // Optionally clear config? User might want to keep mapping if they just clear text to paste new text.
    }
  });

  async function handleSend() {
    isLoading = true;
    activeTab = "response";
    response = "";
    responseStatus = null;
    const startTime = Date.now();

    try {
      const headersObj = new Headers();
      headers.forEach(h => {
        if (h.key) headersObj.append(h.key, h.value);
      });

      const options = {
        method,
        headers: headersObj,
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        options.body = body;
      }

      const res = await fetch(url, options);
      responseStatus = res.status;
      
      const text = await res.text();
      try {
        response = JSON.stringify(JSON.parse(text), null, 2);
      } catch (e) {
        response = text;
      }
    } catch (e) {
      response = JSON.stringify({ error: e.message }, null, 2);
    } finally {
      responseTime = Date.now() - startTime;
      isLoading = false;
    }
  }
</script>

<div class="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
  <!-- Header -->
  <div class="flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
    <div class="flex items-center justify-between px-4 py-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🚀 JSON to CURL & Request Simulator
        </h1>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Build requests, generate CURL commands, and simulate API calls
        </p>
      </div>
    </div>
  </div>

  <!-- Main Content Area with Split View -->
  <div class="flex-1 flex overflow-hidden relative">
    
    {#if showImportSidebar}
      <ImportConfigSidebar 
        bind:importJsonInput
        onconfigure={() => showMappingModal = true}
      />
    {/if}

    <!-- Sidebar Toggle (Floating/Sticky) -->
    <div class="relative z-10 flex flex-col justify-center pointer-events-none">
       <button
        onclick={() => showImportSidebar = !showImportSidebar}
        class="pointer-events-auto absolute transform transition-all duration-300 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-20 group {showImportSidebar ? 'left-0 -translate-x-1/2' : 'left-4 translate-x-0'}"
        title={showImportSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        <svg class="w-4 h-4 transition-transform {showImportSidebar ? '' : 'rotate-180'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Right Content: Request Builder & Output -->
    <div class="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-all duration-300 {showImportSidebar ? 'p-4' : 'p-6 lg:p-8'}">
      <div class="{showImportSidebar ? 'max-w-5xl' : 'max-w-7xl'} mx-auto space-y-6 transition-all duration-300">
        
        <RequestEditor 
          bind:method 
          bind:url 
          bind:headers 
          bind:body 
          bind:isLoading
          onsend={handleSend}
        />

        <ResponseViewer 
          bind:activeTab 
          {curlCommand}
          {httpRequest}
          bind:response 
          {responseStatus}
          {responseTime}
        />

      </div>
    </div>
  </div>

  <MappingModal 
    bind:showMappingModal
    bind:importConfig 
    {availableImportKeys}
    onclose={() => showMappingModal = false}
  />
</div>
