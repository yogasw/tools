<script>
  export let value = '';
  export let type = 'text';
  export let placeholder = '';
  export let label = '';
  export let id = '';
  export let disabled = false;
  export let className = '';
  export let error = '';

  const inputClasses = 'w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed';
  const errorClasses = 'border-red-500 focus:ring-red-500';

  $: finalClasses = `${inputClasses} ${error ? errorClasses : ''} ${className}`;
</script>

<div class="w-full">
  {#if label}
    <label for={id} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {label}
    </label>
  {/if}
  <input
    {id}
    {type}
    {placeholder}
    {disabled}
    bind:value
    class={finalClasses}
    on:input
    on:change
    on:blur
    on:focus
    {...$$restProps}
  />
  {#if error}
    <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
  {/if}
</div>
