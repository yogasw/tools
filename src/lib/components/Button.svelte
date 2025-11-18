<script>
  export let variant = 'primary'; // primary, secondary, outline, ghost
  export let size = 'md'; // sm, md, lg
  export let disabled = false;
  export let type = 'button';
  export let className = '';

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100',
    outline: 'border-2 border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  $: classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
</script>

<button
  {type}
  {disabled}
  class={classes}
  on:click
  {...$$restProps}
>
  <slot />
</button>
