<script>
  import JsonTreeNode from "./JsonTreeNode.svelte";

  let inputText = "";
  let keysToParse = "";
  let outputText = "";
  let parsedOutput = null;
  let error = "";
  let showCopied = false;
  let viewMode = "text"; // 'text' or 'tree'
  let expandedNodes = new Set();
  let showFormatsInfo = false;

  // Autocomplete state
  let availableKeys = [];
  let showSuggestions = false;
  let filteredSuggestions = [];
  let selectedSuggestionIndex = 0;
  let keysInput;
  let suggestionsContainer;

  function expandAllNodes(obj, path = "") {
    if (obj && typeof obj === "object") {
      expandedNodes.add(path);

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const newPath = path ? `${path}.[${index}]` : `[${index}]`;
          expandAllNodes(item, newPath);
        });
      } else {
        Object.keys(obj).forEach((key) => {
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
      jsonString = jsonString.replace(/=>/g, ":");
      jsonString = jsonString.replace(/nil/g, "null");
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
    fixedJsonString = fixedJsonString.replace(/None/g, "null");
    fixedJsonString = fixedJsonString.replace(/True/g, "true");
    fixedJsonString = fixedJsonString.replace(/False/g, "false");

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
      let current = parsedInput;

      for (let i = 0; i < listArrayKey.length; i++) {
        let key = listArrayKey[i].trim();

        // Handle array[0] or object.key or [0] format
        if (key.includes("[") && key.includes("]")) {
          // Split by array notation: e.g., "buttons[0]" or "[0]"
          const match = key.match(/^(.+?)?\[(\d+)\]$/);
          if (match) {
            const objKey = match[1]; // could be undefined for "[0]"
            const index = parseInt(match[2]);

            // First access object key if exists
            if (
              objKey &&
              current &&
              typeof current === "object" &&
              !Array.isArray(current)
            ) {
              current = current[objKey];
            }

            // Then access array index
            if (Array.isArray(current) && current[index] !== undefined) {
              current = current[index];
            } else {
              current = undefined;
              break;
            }
          }
        } else {
          // Regular object key access
          if (
            current &&
            typeof current === "object" &&
            !Array.isArray(current) &&
            current.hasOwnProperty(key)
          ) {
            current = current[key];
          } else {
            current = undefined;
            break;
          }
        }

        //handle stringified JSON at each step
        if (typeof current === "string") {
          let oldCurrent = current;
          try {
            current = JSON.parse(current);
          } catch (e) {
            current = oldCurrent;
          }
        }
      }

      // Handle result
      let result;
      if (current === undefined) {
        result = parsedInput;
      }

      result = current;
      if (typeof result === "string") {
        return result;
      }

      return JSON.stringify(current, null, 2);
    }
  }

  function processJson() {
    error = "";
    outputText = "";
    parsedOutput = null;

    if (!inputText.trim()) {
      return;
    }

    try {
      let listKey = keysToParse
        ? keysToParse
            .split(".")
            .map((k) => k.trim())
            .filter((k) => k)
        : [];
      let result = processData(inputText, listKey);
      outputText = result;

      // Parse for tree view
      try {
        parsedOutput = JSON.parse(result);
        // Auto expand all nodes by default
        expandedNodes.clear();
        expandAllNodes(parsedOutput, "");
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
    inputText = "";
    keysToParse = "";
    outputText = "";
    error = "";
  }

  function formatJson() {
    if (!inputText.trim()) {
      error = "Please enter JSON text";
      return;
    }

    try {
      let parsed = JSON.parse(inputText);
      inputText = JSON.stringify(parsed, null, 2);
      error = "";
    } catch (e) {
      try {
        let parsed = parseJsonString(inputText);
        inputText = JSON.stringify(parsed, null, 2);
        error = "";
      } catch (e2) {
        error = `Format error: ${e2.message}`;
      }
    }
  }

  // Extract all keys from JSON object
  function extractKeys(obj, prefix = "") {
    let keys = [];

    if (obj && typeof obj === "object") {
      if (Array.isArray(obj)) {
        // For arrays, add index notation without dot prefix
        obj.forEach((item, index) => {
          const indexKey = `${prefix}[${index}]`;
          keys.push(indexKey);
          if (item && typeof item === "object") {
            const nestedKeys = extractKeys(item, indexKey);
            keys = [...keys, ...nestedKeys];
          }
        });
      } else {
        // For objects, add key names
        Object.keys(obj).forEach((key) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          keys.push(fullKey);
          if (obj[key] && typeof obj[key] === "object") {
            const nestedKeys = extractKeys(obj[key], fullKey);
            keys = [...keys, ...nestedKeys];
          } else if (typeof obj[key] === "string") {
            // try to parse stringified JSON
            try {
              const parsedString = JSON.parse(obj[key]);
              const nestedKeys = extractKeys(parsedString, fullKey);
              keys = [...keys, ...nestedKeys];
            } catch (e) {}
          }
        });
      }
    }

    return keys;
  }

  // Update available keys when input changes
  function updateAvailableKeys() {
    if (!inputText.trim()) {
      availableKeys = [];
      return;
    }

    try {
      let parsed;
      try {
        parsed = JSON.parse(inputText);
        if (typeof parsed === "string") {
          try {
            parsed = parseJsonString(parsed);
          } catch (e) {}
        }
      } catch (e) {
        parsed = parseJsonString(inputText);
      }
      availableKeys = extractKeys(parsed);
    } catch (e) {
      availableKeys = [];
    }
  }

  // Handle key input and show suggestions
  function handleKeyInput(event) {
    const input = event.target.value;
    const cursorPos = event.target.selectionStart;

    // Get the current segment being typed (after last comma)
    const beforeCursor = input.substring(0, cursorPos);
    const lastCommaIndex = beforeCursor.lastIndexOf(",");
    const currentSegment = beforeCursor.substring(lastCommaIndex + 1).trim();

    if (currentSegment && availableKeys.length > 0) {
      // Filter suggestions based on current segment
      filteredSuggestions = availableKeys.filter((key) =>
        key.toLowerCase().includes(currentSegment.toLowerCase()),
      );

      showSuggestions = filteredSuggestions.length > 0;
      selectedSuggestionIndex = 0;
    } else if (!currentSegment && availableKeys.length > 0) {
      // Show all suggestions when input is empty or just after comma
      filteredSuggestions = availableKeys;
      showSuggestions = true;
      selectedSuggestionIndex = 0;
    } else {
      showSuggestions = false;
    }
  }

  // Handle keyboard navigation in suggestions
  function handleKeyDown(event) {
    if (!showSuggestions) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectedSuggestionIndex = Math.min(
        selectedSuggestionIndex + 1,
        filteredSuggestions.length - 1,
      );
      scrollToSelectedSuggestion();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
      scrollToSelectedSuggestion();
    } else if (event.key === "Enter" && showSuggestions) {
      event.preventDefault();
      selectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
    } else if (event.key === "Escape") {
      showSuggestions = false;
    }
  }

  function scrollToSelectedSuggestion() {
    if (suggestionsContainer) {
      const selectedElement =
        suggestionsContainer.children[selectedSuggestionIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }

  // Select a suggestion
  function selectSuggestion(suggestion) {
    const cursorPos = keysInput.selectionStart;
    const beforeCursor = keysToParse.substring(0, cursorPos);
    const afterCursor = keysToParse.substring(cursorPos);

    // Find the last comma position
    const lastCommaIndex = beforeCursor.lastIndexOf(",");

    if (lastCommaIndex >= 0) {
      // Replace the segment after the last comma
      keysToParse =
        beforeCursor.substring(0, lastCommaIndex + 1) +
        suggestion +
        afterCursor;
    } else {
      // Replace entire input if no comma
      keysToParse = suggestion + afterCursor;
    }

    showSuggestions = false;
    keysInput.focus();
  }

  // Close suggestions when clicking outside
  function handleClickOutside(event) {
    if (
      keysInput &&
      !keysInput.contains(event.target) &&
      suggestionsContainer &&
      !suggestionsContainer.contains(event.target)
    ) {
      showSuggestions = false;
    }
  }

  // Auto process when inputs change
  $: if (inputText || keysToParse !== undefined) {
    processJson();
  }

  // Update available keys when input text changes
  $: if (inputText) {
    updateAvailableKeys();
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="h-full flex flex-col overflow-hidden">
  <!-- Header -->
  <div class="flex-shrink-0 dark:border-gray-800">
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex-1">
        <h1
          class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
        >
          🔍 JSON Parser Tools
        </h1>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Parse JSON from multiple formats and extract specific keys
        </p>
      </div>

      <!-- Formats Info Button -->
      <button
        on:click={() => (showFormatsInfo = !showFormatsInfo)}
        class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Supported Formats
      </button>
    </div>

    <!-- Collapsible Formats Info -->
    {#if showFormatsInfo}
      <div
        class="px-4 pb-3 bg-blue-50/50 dark:bg-blue-900/10"
      >
        <div class="grid grid-cols-3 gap-3 mt-3">
          <div
            class="bg-white dark:bg-gray-900 rounded-lg p-2 border border-blue-200 dark:border-blue-800"
          >
            <div
              class="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1"
            >
              JavaScript/JSON
            </div>
            <code class="text-xs text-gray-600 dark:text-gray-400"
              >{"{"}"key": "value"{"}"}</code
            >
          </div>
          <div
            class="bg-white dark:bg-gray-900 rounded-lg p-2 border border-blue-200 dark:border-blue-800"
          >
            <div
              class="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1"
            >
              Python
            </div>
            <code class="text-xs text-gray-600 dark:text-gray-400"
              >None, True, False</code
            >
          </div>
          <div
            class="bg-white dark:bg-gray-900 rounded-lg p-2 border border-blue-200 dark:border-blue-800"
          >
            <div
              class="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1"
            >
              Ruby
            </div>
            <code class="text-xs text-gray-600 dark:text-gray-400"
              >:key => nil</code
            >
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Main Content - Side by Side Layout -->
  <div class="flex-1 grid lg:grid-cols-2 gap-4 px-4 pb-4 overflow-hidden pt-4">
    <!-- Left Side - Input -->
    <div
      class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex flex-col overflow-hidden"
    >
      <h2
        class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0"
      >
        Input
      </h2>
      <div class="flex-1 flex flex-col space-y-3 overflow-hidden">
        <div class="flex flex-col" style="height: 35%;">
          <label
            for="input-text"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex-shrink-0"
          >
            Input JSON Text
          </label>
          <textarea
            id="input-text"
            bind:value={inputText}
            class="flex-1 w-full px-3 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors font-mono text-sm resize-none overflow-auto"
          ></textarea>
          {#if error}
            <p
              class="mt-2 text-sm text-red-600 dark:text-red-400 flex-shrink-0"
            >
              {error}
            </p>
          {/if}
        </div>

        <div class="flex-shrink-0 relative">
          <label
            for="keys-to-parse"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Keys to Parse (optional)
          </label>
          <input
            id="keys-to-parse"
            type="text"
            bind:value={keysToParse}
            bind:this={keysInput}
            on:input={handleKeyInput}
            on:keydown={handleKeyDown}
            on:focus={handleKeyInput}
            placeholder="data.[0].value"
            autocomplete="off"
            class="w-full px-3 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors font-mono text-xs"
          />

          <!-- Autocomplete Suggestions -->
          {#if showSuggestions && filteredSuggestions.length > 0}
            <div
              bind:this={suggestionsContainer}
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            >
              {#each filteredSuggestions as suggestion, index}
                <button
                  type="button"
                  on:click={() => selectSuggestion(suggestion)}
                  class="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors {index ===
                  selectedSuggestionIndex
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                    : 'text-gray-900 dark:text-gray-100'}"
                >
                  {suggestion}
                </button>
              {/each}
            </div>
          {/if}

          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Ex: <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded"
              >data.[0].value</code
            >
            {#if availableKeys.length > 0}
              <span class="text-green-600 dark:text-green-400"
                >• {availableKeys.length} keys available</span
              >
            {/if}
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
    <div
      class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex flex-col overflow-hidden"
    >
      <div class="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Output
        </h2>
        <div class="flex items-center gap-2">
          <!-- View Mode Toggle -->
          <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              on:click={() => (viewMode = "text")}
              class="px-3 py-1 text-xs font-medium rounded transition-colors {viewMode ===
              'text'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'}"
            >
              Text
            </button>
            <button
              on:click={() => (viewMode = "tree")}
              class="px-3 py-1 text-xs font-medium rounded transition-colors {viewMode ===
              'tree'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'}"
            >
              Tree
            </button>
          </div>

          <!-- Tree Controls (only show in tree mode) -->
          {#if viewMode === "tree" && outputText}
            <button
              on:click={() => {
                expandAllNodes(parsedOutput, "");
                expandedNodes = expandedNodes;
              }}
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
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </button>
          {/if}
        </div>
      </div>

      <div class="flex-1 overflow-hidden">
        {#if error}
          <div
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
          >
            <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        {:else if outputText}
          <!-- Text Mode -->
          {#if viewMode === "text"}
            <div
              class="h-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-auto"
            >
              <pre
                class="text-sm text-gray-900 dark:text-white font-mono whitespace-pre-wrap break-all">{outputText}</pre>
            </div>

            <!-- Tree Mode -->
          {:else if viewMode === "tree"}
            <div
              class="h-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-auto"
            >
              <JsonTreeNode
                value={parsedOutput}
                path=""
                {isExpanded}
                {toggleNode}
              />
            </div>
          {/if}
        {:else}
          <div
            class="h-full flex items-center justify-center text-gray-400 dark:text-gray-600"
          >
            <div class="text-center">
              <svg
                class="w-12 h-12 mx-auto mb-3 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
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
    <div
      class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
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
