<script>
  import JsonParser from "./JsonParser.svelte";
  import { onMount, tick } from "svelte";

  let method = "GET";
  let url = "https://jsonplaceholder.typicode.com/posts/1";
  let headers = [
    { key: "Content-Type", value: "application/json" },
    { key: "Authorization", value: "Bearer token123" }
  ];
  let body = '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}';
  let response = "";
  let activeTab = "curl"; // 'curl', 'http', 'response'
  let isLoading = false;
  let responseStatus = null;
  let responseTime = null;
  let showImportSidebar = true;

  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

  // Import Feature State
  let importJsonInput = "";
  let importConfig = {
    url: "",
    method: "",
    headers: "", // Key path for headers object/array
    body: ""     // Key path for body payload
  };
  let availableImportKeys = [];
  let importViewMode = 'text'; // 'text' or 'tree' for sidebar

  function addHeader() {
    headers = [...headers, { key: "", value: "" }];
  }

  function removeHeader(index) {
    headers = headers.filter((_, i) => i !== index);
  }

  // Generate CURL Command
  $: curlCommand = (() => {
    let cmd = `curl -X ${method} "${url || 'http://localhost'}"`;
    
    headers.forEach(h => {
      if (h.key && h.value) {
        cmd += ` \\\n  -H "${h.key}: ${h.value}"`;
      }
    });

    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      // Escape single quotes for shell safety
      const escapedBody = body.replace(/'/g, "'\\''");
      cmd += ` \\\n  -d '${escapedBody}'`;
    }

    return cmd;
  })();

  // Generate Raw HTTP Request Preview
  $: httpRequest = (() => {
    let path = "/";
    let host = "localhost";
    
    try {
      const urlObj = new URL(url || "http://localhost");
      path = urlObj.pathname + urlObj.search;
      host = urlObj.host;
    } catch (e) {}

    let req = `${method} ${path} HTTP/1.1\n`;
    req += `Host: ${host}\n`;
    
    headers.forEach(h => {
      if (h.key && h.value) {
        req += `${h.key}: ${h.value}\n`;
      }
    });

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      req += `\n${body}`;
    }

    return req;
  })();

  // Get default mappings from toolsRegistry (allows user customization in tools.js)
  import { toolsRegistry } from '$lib/stores/tools.js';
  const toolConfig = toolsRegistry.find(t => t.id === 'json-to-curl');
  const DEFAULT_MAPPINGS = toolConfig?.defaultMappings || {
    url: ['url', 'endpoint', 'path', 'uri'],
    method: ['method', 'type', 'verb'],
    headers: ['headers', 'header', 'request_headers'],
    body: ['body', 'payload', 'data', 'content', 'request_body']
  };

  function extractKeys(obj, prefix = "") {
    let keys = [];
    if (obj && typeof obj === "object") {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const key = prefix ? `${prefix}[${index}]` : `[${index}]`;
          keys.push(key);
          if (typeof item === 'object') keys = keys.concat(extractKeys(item, key));
        });
      } else {
        Object.keys(obj).forEach(key => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          keys.push(fullKey);
          if (typeof obj[key] === 'object') keys = keys.concat(extractKeys(obj[key], fullKey));
        });
      }
    }
    return keys;
  }

  // Helper to find best matching key from available keys
  function findBestMatch(availableKeys, keywords) {
    const LowerKeys = availableKeys.map(k => k.toLowerCase());
    for (const keyword of keywords) {
      // 1. Exact match
      if (availableKeys.includes(keyword)) return keyword;
      
      // 2. Case-insensitive match
      const index = LowerKeys.indexOf(keyword.toLowerCase());
      if (index !== -1) return availableKeys[index];

      // 3. Ends with keyword (e.g. "request.url" matches "url")
      const suffixMatch = availableKeys.find(k => k.toLowerCase().endsWith(`.${keyword}`));
      if (suffixMatch) return suffixMatch;
    }
    return "";
  }

  // Update available import keys and apply defaults
  $: if (importJsonInput) {
    try {
      const parsed = JSON.parse(importJsonInput);
      availableImportKeys = extractKeys(parsed);
      
      // Apply default mappings if config is empty
      if (!importConfig.url) importConfig.url = findBestMatch(availableImportKeys, DEFAULT_MAPPINGS.url);
      if (!importConfig.method) importConfig.method = findBestMatch(availableImportKeys, DEFAULT_MAPPINGS.method);
      if (!importConfig.headers) importConfig.headers = findBestMatch(availableImportKeys, DEFAULT_MAPPINGS.headers);
      if (!importConfig.body) importConfig.body = findBestMatch(availableImportKeys, DEFAULT_MAPPINGS.body);

      processImport();
    } catch (e) {
      availableImportKeys = [];
    }
  }


  // Auto-apply import when config changes
  $: if (importConfig.url || importConfig.method || importConfig.headers || importConfig.body) {
    processImport();
  }

  // getValue helper (lodash.get style)
  function getNestedValue(obj, path) {
    if (!path) return undefined;
    
    // Handle bracket notation directly without full splitting if possible for simple cases
    // But for full compatibility with extractKeys output:
    const pathParts = [];
    let currentPart = '';
    let inBracket = false;
    
    // Simple parser for path: a.b[0].c
    // This regex approach in original code `path.replace(/\[(\d+)\]/g, '.$1').split('.')` handles `[0]` well
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    
    let current = obj;
    for (const p of parts) {
      if (p === "") continue; // split might produce empty strings if path starts with .
      if (current === undefined || current === null) return undefined;
      current = current[p];
    }
    return current;
  }

  function processImport() {
    if (!importJsonInput) return;
    
    try {
      const data = JSON.parse(importJsonInput);
      
      // Import URL
      if (importConfig.url) {
        const val = getNestedValue(data, importConfig.url);
        if (val !== undefined) url = String(val);
      }

      // Import Method
      if (importConfig.method) {
        const val = getNestedValue(data, importConfig.method);
        if (val) {
          const m = String(val).toUpperCase();
          if (methods.includes(m)) method = m;
        }
      }

      // Import Body
      if (importConfig.body) {
        const val = getNestedValue(data, importConfig.body);
        if (val) {
          body = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
        }
      }

      // Import Headers
      if (importConfig.headers) {
        const val = getNestedValue(data, importConfig.headers);
        if (val && typeof val === 'object') {
          if (Array.isArray(val)) {
             // Handle array of {key, value} or {name, value}
             headers = val.map(h => ({
               key: h.key || h.name || Object.keys(h)[0],
               value: h.value || Object.values(h)[0]
             }));
          } else {
            // Handle object { "Content-Type": "application/json" }
            headers = Object.entries(val).map(([k, v]) => ({ key: k, value: String(v) }));
          }
        }
      }
    } catch (e) {
      // Silent error for auto-import, or show toast?
      console.error("Auto import error", e);
    }
  }

  async function sendRequest() {
    isLoading = true;
    activeTab = "response";
    response = "";
    responseStatus = null;
    const startTime = Date.now();

    try {
      // Prepare headers object
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
        // Try to format if it's JSON
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

  let showMappingModal = false;

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  function closeModal() {
    showMappingModal = false;
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
        on:click={() => showImportSidebar = !showImportSidebar}
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
      <!-- Left Sidebar: Import Config -->
      <div class="w-1/3 min-w-[300px] max-w-[500px] border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
         <!-- JsonParser with Input Only (hideOutput=true) -->
         <div class="flex-1 overflow-hidden">
           <JsonParser bind:inputText={importJsonInput} hideHeader={true} hideOutput={true} />
         </div>

         <!-- Configure Mapping Button - Fixed at bottom -->
         <div class="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
            <button 
              on:click={() => showMappingModal = true}
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Configure Field Mapping
            </button>
         </div>
      </div>
    {/if}

    <!-- Right Content: Request Builder & Output -->
    <div class="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-5xl mx-auto space-y-6">
        
        <!-- Request Builder Section -->
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
              on:click={sendRequest}
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
                on:click={addHeader}
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
                    on:click={() => removeHeader(i)}
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
          {#if ['POST', 'PUT', 'PATCH'].includes(method)}
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

        <!-- Output Section -->
        <div class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex flex-col h-[600px]">
          <div class="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
            <button 
              on:click={() => activeTab = 'curl'}
              class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {activeTab === 'curl' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}"
            >
              CURL
            </button>
            <button 
              on:click={() => activeTab = 'http'}
              class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {activeTab === 'http' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}"
            >
              HTTP
            </button>
            <button 
              on:click={() => activeTab = 'response'}
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
                  on:click={() => copyToClipboard(curlCommand)}
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
                  on:click={() => copyToClipboard(httpRequest)}
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
                     <JsonParser bind:inputText={response} hideHeader={true} />
                  </div>
               </div>
            {/if}
          </div>
        </div>

      </div>
    </div>
  </div>
  <!-- Field Mapping Modal -->
  {#if showMappingModal}
    <div class="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg overflow-hidden animate-scale-in">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Configure Field Mapping</h3>
          <button 
            on:click={closeModal}
            aria-label="Close modal"
            title="Close modal"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div class="p-6 space-y-6">
           <p class="text-sm text-gray-600 dark:text-gray-400">
             Map keys from your imported JSON to the request fields. Updates are applied automatically.
           </p>

           <div class="space-y-4">
              <!-- URL -->
              <div>
                <label for="modal-import-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL / Endpoint</label>
                <select id="modal-import-url" bind:value={importConfig.url} class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Select Key --</option>
                  {#each availableImportKeys as key}<option value={key}>{key}</option>{/each}
                </select>
              </div>
              
              <!-- Method -->
              <div>
                <label for="modal-import-method" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
                <select id="modal-import-method" bind:value={importConfig.method} class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Select Key --</option>
                  {#each availableImportKeys as key}<option value={key}>{key}</option>{/each}
                </select>
              </div>

              <!-- Headers -->
              <div>
                <label for="modal-import-headers" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headers</label>
                <select id="modal-import-headers" bind:value={importConfig.headers} class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                   <option value="">-- Select Key --</option>
                  {#each availableImportKeys as key}<option value={key}>{key}</option>{/each}
                </select>
              </div>

              <!-- Body -->
              <div>
                <label for="modal-import-body" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body / Payload</label>
                <select id="modal-import-body" bind:value={importConfig.body} class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Select Key --</option>
                  {#each availableImportKeys as key}<option value={key}>{key}</option>{/each}
                </select>
              </div>
           </div>
        </div>
        
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
          <button 
             on:click={closeModal}
             class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>
