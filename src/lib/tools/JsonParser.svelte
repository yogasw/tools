<script>
  import JsonTreeNode from './JsonTreeNode.svelte';

  let inputText = '';
  let keysToParse = '';
  let outputText = '';
  let parsedOutput = null;
  let error = '';
  let showCopied = false;
  let viewMode = 'text'; // 'text' or 'tree'
  let expandedNodes = new Set();
  let showFormatsInfo = false;

  function expandAllNodes(obj, path = '') {
    if (obj && typeof obj === 'object') {
      expandedNodes.add(path);
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const newPath = path ? `${path}.[${index}]` : `[${index}]`;
          expandAllNodes(item, newPath);
        });
      } else {
        Object.keys(obj).forEach(key => {
          const newPath = path ? `${path}.${key}` : key;
          expandAllNodes(obj[key], newPath);
        });
      }
    }
  }

  function collapseAllNodes() {
    expandedNodes.clear();
    expandedNodes = expandedNodes;
  }

  function parseJsonString(jsonString) {
    // For Ruby format
    let oldString = jsonString;
    try {
      jsonString = jsonString.replace(/=>/g, ':');
      jsonString = jsonString.replace(/nil/g, 'null');
      return JSON.parse(jsonString);
    } catch (e) {
      // Restore original string if Ruby parsing fails
      jsonString = oldString;
    }

    // Fixing the JSON string which might contain escape characters
    let fixedJsonString = jsonString.replace(/\\"/g, '\\"');

    // Replacing single quotes with double quotes
    fixedJsonString = fixedJsonString.replace(/'/g, '"');

    // For Python format
    fixedJsonString = fixedJsonString.replace(/None/g, 'null');
    fixedJsonString = fixedJsonString.replace(/True/g, 'true');
    fixedJsonString = fixedJsonString.replace(/False/g, 'false');

    return JSON.parse(fixedJsonString);
  }

  function processData(input, listArrayKey) {
    let parsedInput = null;
    try {
      parsedInput = JSON.parse(input);
    } catch (e) {
      parsedInput = parseJsonString(input);
    }

    if (!listArrayKey || listArrayKey.length === 0 || listArrayKey[0] === "") {
      return JSON.stringify(parsedInput, null, 2);
    } else {
      let result = JSON.stringify(parsedInput);
      for (let i = 0; i < listArrayKey.length; i++) {
        let key = listArrayKey[i].trim();
        let j = JSON.parse(result);

        if (j.hasOwnProperty(key)) {
          if (typeof j[key] === "string") {
            result = j[key];
          } else {
            result = JSON.stringify(j[key]);
          }
        } else {
          if (key.includes("[") && key.includes("]") && Array.isArray(j)) {
            let keyArray = key.replace(/\[|\]/g, '');
            if (j[keyArray]) {
              result = JSON.stringify(j[keyArray]);
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }

      let p = "";
      try {
        p = JSON.parse(result);
      } catch (e) {
        p = result;
      }

      if (typeof p === "string") {
        try {
          p = JSON.parse(p);
        } catch (e) {
          p = result;
        }
      }
      return JSON.stringify(p, null, 2);
    }
  }

  function processJson() {
    error = '';
    outputText = '';
    parsedOutput = null;

    if (!inputText.trim()) {
      return;
    }

    try {
      let listKey = keysToParse ? keysToParse.split(",").map(k => k.trim()).filter(k => k) : [];
      let result = processData(inputText, listKey);
      outputText = result;

      // Parse for tree view
      try {
        parsedOutput = JSON.parse(result);
        // Auto expand all nodes by default
        expandedNodes.clear();
        expandAllNodes(parsedOutput, '');
        expandedNodes = expandedNodes; // trigger reactivity
      } catch (e) {
        parsedOutput = result;
      }
    } catch (e) {
      error = `Parse error: ${e.message}`;
    }
  }

  function toggleNode(path) {
    if (expandedNodes.has(path)) {
      expandedNodes.delete(path);
    } else {
      expandedNodes.add(path);
    }
    expandedNodes = expandedNodes; // trigger reactivity
  }

  function isExpanded(path) {
    return expandedNodes.has(path);
  }

  function copyOutput() {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      showCopied = true;
      setTimeout(() => {
        showCopied = false;
      }, 2000);
    }
  }

  function clear() {
    inputText = '';
    keysToParse = '';
    outputText = '';
    error = '';
  }

  function formatJson() {
    if (!inputText.trim()) {
      error = 'Please enter JSON text';
      return;
    }

    try {
      let parsed = JSON.parse(inputText);
      inputText = JSON.stringify(parsed, null, 2);
      error = '';
    } catch (e) {
      try {
        let parsed = parseJsonString(inputText);
        inputText = JSON.stringify(parsed, null, 2);
        error = '';
      } catch (e2) {
        error = `Format error: ${e2.message}`;
      }
    }
  }

  // Auto process when inputs change
  $: if (inputText || keysToParse !== undefined) {
    processJson();
  }
</script>

<div class="h-full flex flex-col overflow-hidden">
  <!-- Header -->
  <div class="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex-1">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🔍 JSON Parser Tools
        </h1>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Parse JSON from multiple formats and extract specific keys
        </p>
      </div>

      <!-- Formats Info Button -->
      <button
        on:click={() => showFormatsInfo = !showFormatsInfo}
        class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Supported Formats
      </button>
    </div>

    <!-- Collapsible Formats Info -->
    {#if showFormatsInfo}
      <div class="px-4 pb-3 border-t border-gray-200 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/10">
        <div class="grid grid-cols-3 gap-3 mt-3">
          <div class="bg-white dark:bg-gray-900 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
            <div class="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">JavaScript/JSON</div>
            <code class="text-xs text-gray-600 dark:text-gray-400">{"{"}"key": "value"{"}"}</code>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
            <div class="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Python</div>
            <code class="text-xs text-gray-600 dark:text-gray-400">None, True, False</code>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
            <div class="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Ruby</div>
            <code class="text-xs text-gray-600 dark:text-gray-400">:key => nil</code>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Main Content - Side by Side Layout -->
  <div class="flex-1 grid lg:grid-cols-2 gap-4 px-4 pb-4 overflow-hidden pt-4">
    <!-- Left Side - Input -->
    <div class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex flex-col overflow-hidden">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">Input</h2>
      <div class="flex-1 flex flex-col space-y-3 overflow-hidden">
      <div class="flex-1 flex flex-col overflow-hidden">
        <label for="input-text" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex-shrink-0">
          Input JSON Text
        </label>
        <textarea
          id="input-text"
          bind:value={inputText}
          class="flex-1 w-full px-3 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors font-mono text-sm resize-none overflow-auto"
        ></textarea>
        {#if error}
          <p class="mt-2 text-sm text-red-600 dark:text-red-400 flex-shrink-0">{error}</p>
        {/if}
      </div>

        <div class="flex-shrink-0">
          <label for="keys-to-parse" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Keys to Parse (optional)
          </label>
          <input
            id="keys-to-parse"
            type="text"
            bind:value={keysToParse}
            placeholder="data,[0],value"
            class="w-full px-3 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors font-mono text-xs"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Ex: <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">data,[0],value</code>
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 flex-shrink-0">
          <button
            on:click={formatJson}
            class="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-xs"
          >
            Format
          </button>
          <button
            on:click={clear}
            class="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium text-xs"
          >
            Clear
          </button>
        </div>
      </div>
    </div>

    <!-- Right Side - Output -->
    <div class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex flex-col overflow-hidden">
      <div class="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Output</h2>
        <div class="flex items-center gap-2">
          <!-- View Mode Toggle -->
          <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              on:click={() => viewMode = 'text'}
              class="px-3 py-1 text-xs font-medium rounded transition-colors {viewMode === 'text' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}"
            >
              Text
            </button>
            <button
              on:click={() => viewMode = 'tree'}
              class="px-3 py-1 text-xs font-medium rounded transition-colors {viewMode === 'tree' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}"
            >
              Tree
            </button>
          </div>

          <!-- Tree Controls (only show in tree mode) -->
          {#if viewMode === 'tree' && outputText}
            <button
              on:click={() => { expandAllNodes(parsedOutput, ''); expandedNodes = expandedNodes; }}
              class="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Expand All
            </button>
            <button
              on:click={collapseAllNodes}
              class="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Collapse All
            </button>
          {/if}

          {#if outputText}
            <button
              on:click={copyOutput}
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          {/if}
        </div>
      </div>

      <div class="flex-1 overflow-hidden">
        {#if error}
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        {:else if outputText}
          <!-- Text Mode -->
          {#if viewMode === 'text'}
            <div class="h-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-auto">
              <pre class="text-sm text-gray-900 dark:text-white font-mono whitespace-pre-wrap break-all">{outputText}</pre>
            </div>

          <!-- Tree Mode -->
          {:else if viewMode === 'tree'}
            <div class="h-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-auto">
              <JsonTreeNode value={parsedOutput} path="" {isExpanded} {toggleNode} />
            </div>
          {/if}
        {:else}
          <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-sm">Enter JSON to see output here</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Copied Notification -->
  {#if showCopied}
    <div class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      Copied to clipboard!
    </div>
  {/if}
</div>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
</style>
