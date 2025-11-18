<script>
  export let value;
  export let path;
  export let keyName = '';
  export let isExpanded;
  export let toggleNode;

  $: isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  $: isArray = Array.isArray(value);
  $: isPrimitive = !isObject && !isArray;
  $: currentPath = path ? (keyName ? `${path}.${keyName}` : path) : keyName;
  $: expanded = isExpanded(currentPath);
  
  function handleToggle() {
    toggleNode(currentPath);
  }

  function getValueType(val) {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
  }

  function getValueColor(val) {
    const type = getValueType(val);
    switch (type) {
      case 'string': return 'text-green-600 dark:text-green-400';
      case 'number': return 'text-blue-600 dark:text-blue-400';
      case 'boolean': return 'text-purple-600 dark:text-purple-400';
      case 'null': return 'text-gray-500 dark:text-gray-500';
      default: return 'text-gray-900 dark:text-white';
    }
  }

  function formatPrimitiveValue(val) {
    if (typeof val === 'string') return `"${val}"`;
    if (val === null) return 'null';
    return String(val);
  }
</script>

<div class="font-mono text-sm">
  {#if isPrimitive}
    <!-- Primitive Value -->
    <span class="text-gray-600 dark:text-gray-400">{keyName}:</span>
    <span class={getValueColor(value)}>{formatPrimitiveValue(value)}</span>

  {:else}
    <!-- Object or Array -->
    <button
      on:click={handleToggle}
      type="button"
      class="flex items-start gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -ml-1 w-full text-left transition-colors"
    >
      <!-- Expand/Collapse Icon -->
      <span class="text-gray-400 dark:text-gray-600 mt-0.5 flex-shrink-0">
        {#if expanded}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        {/if}
      </span>

      <!-- Key Name -->
      <span class="flex-1">
        {#if keyName}
          <span class="text-gray-600 dark:text-gray-400">{keyName}:</span>
        {/if}

        <!-- Type Badge -->
        <span class="text-gray-500 dark:text-gray-500">
          {#if isArray}
            <span class="text-xs">Array[{value.length}]</span>
          {:else}
            <span class="text-xs">Object{'{}'}</span>
          {/if}
        </span>
      </span>
    </button>

    <!-- Children (when expanded) -->
    {#if expanded}
      <div class="ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-2 mt-1 space-y-1">
        {#if isArray}
          {#each value as item, index}
            <svelte:self
              value={item}
              keyName={`[${index}]`}
              path={currentPath}
              {isExpanded}
              {toggleNode}
            />
          {/each}
        {:else}
          {#each Object.entries(value) as [key, val]}
            <svelte:self
              value={val}
              keyName={key}
              path={currentPath}
              {isExpanded}
              {toggleNode}
            />
          {/each}
        {/if}
      </div>
    {/if}
  {/if}
</div>
