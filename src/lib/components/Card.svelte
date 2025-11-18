<script>
  export let className = '';
  export let padding = 'md'; // sm, md, lg, none

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  $: classes = `bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 ${paddings[padding]} ${className}`;
</script>

<div class={classes} {...$$restProps}>
  <slot />
</div>
