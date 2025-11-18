<script>
  import { onMount } from 'svelte';
  import Base64Tool from '$lib/tools/Base64Tool.svelte';
  import { recentTools } from '$lib/stores/recent.js';

  onMount(() => {
    recentTools.addRecent('base64');
  });
</script>

<svelte:head>
  <title>Base64 Encoder/Decoder - Tools Collection</title>
  <meta name="description" content="Encode text to Base64 or decode Base64 strings. Fast, free, and privacy-friendly Base64 encoder/decoder tool." />
  <meta name="keywords" content="base64, encoder, decoder, encode, decode, base64 tool, online base64" />
</svelte:head>

<div class="py-8">
  <Base64Tool />
</div>
