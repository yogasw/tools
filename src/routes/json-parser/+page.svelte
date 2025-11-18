<script>
  import { onMount } from 'svelte';
  import JsonParser from '$lib/tools/JsonParser.svelte';
  import { recentTools } from '$lib/stores/recent.js';

  onMount(() => {
    recentTools.addRecent('json-parser');
  });
</script>

<svelte:head>
  <title>JSON Parser Tools - Parse JSON from Multiple Formats</title>
  <meta name="description" content="Parse JSON from JavaScript, Python, Ruby formats. Extract specific keys and values from complex JSON structures easily." />
  <meta name="keywords" content="json parser, json tool, parse json, python json, ruby json, json formatter, json viewer" />
</svelte:head>

<JsonParser />
