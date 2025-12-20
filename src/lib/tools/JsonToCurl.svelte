<script>
  import { 
    generateCurlCommand, 
    generateHttpRequest, 
    importFromJson 
  } from "../json-to-curl/core";
  
  import RequestEditor from "../json-to-curl/components/RequestEditor.svelte";
  import ResponseViewer from "../json-to-curl/components/ResponseViewer.svelte";
  import ImportConfigSidebar from "../json-to-curl/components/ImportConfig.svelte";
  import MappingModal from "../json-to-curl/components/MappingModal.svelte";

  // State
  let method = $state("GET");
  let url = $state("https://jsonplaceholder.typicode.com/posts/1");
  let headers = $state([
    { key: "Content-Type", value: "application/json" },
    { key: "Authorization", value: "Bearer token123" }
  ]);
  let body = $state('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  
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
       // Only run import logic if we have input. 
       // We pass the current config so we can trigger updates if mapping changes.
       // Note: In Svelte 5, we should be careful about infinite loops if we update state that triggers this effect.
       // However, importFromJson returns new values based on input and config.
       
       const result = importFromJson(importJsonInput, importConfig);
       availableImportKeys = result.availableKeys;
       
       // Update config with defaults if new keys found and config was empty
       // We only want to auto-set defaults if they are not set, to avoid overwriting user choices on every keystroke if they manually set it? 
       // Actually `importFromJson` logic handles "defaults applied" in the returned config object if we want.
       // But let's respect the current logic: the core function returns a config with defaults filled if they were empty.
       
       if (result.config.url && !importConfig.url) importConfig.url = result.config.url;
       if (result.config.method && !importConfig.method) importConfig.method = result.config.method;
       if (result.config.headers && !importConfig.headers) importConfig.headers = result.config.headers;
       if (result.config.body && !importConfig.body) importConfig.body = result.config.body;

       // Update State from Import
       if (result.url) url = result.url;
       if (result.method) method = result.method;
       if (result.headers) headers = result.headers;
       if (result.body) body = result.body;
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
      <button
        onclick={() => showImportSidebar = !showImportSidebar}
        class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        {showImportSidebar ? 'Hide Import Config' : 'Show Import Config'}
      </button>
    </div>
  </div>

  <!-- Main Content Area with Split View -->
  <div class="flex-1 flex overflow-hidden">
    
    {#if showImportSidebar}
      <ImportConfigSidebar 
        bind:importJsonInput
        onconfigure={() => showMappingModal = true}
      />
    {/if}

    <!-- Right Content: Request Builder & Output -->
    <div class="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-5xl mx-auto space-y-6">
        
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
