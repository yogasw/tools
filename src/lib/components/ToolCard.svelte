<script>
  import Card from "./Card.svelte";

  export let tool;
  export let onClick = () => {};
</script>

<button
  on:click={() => onClick(tool.id)}
  class="w-full text-left transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
>
  <Card className="h-full hover:shadow-lg transition-shadow duration-200">
    <div class="flex items-start space-x-4">
      <div class="text-4xl flex-shrink-0">
        {#if tool.icon.startsWith("http://") || tool.icon.startsWith("https://") || tool.icon.startsWith("/")}
          <img
            src={tool.icon}
            alt={tool.name}
            class="w-10 h-10 object-contain"
          />
        {:else}
          {tool.icon}
        {/if}
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {tool.name}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {tool.description}
        </p>
        {#if tool.type === "external"}
          <span
            class="inline-flex items-center mt-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
          >
            External
          </span>
        {/if}
      </div>
    </div>
  </Card>
</button>
