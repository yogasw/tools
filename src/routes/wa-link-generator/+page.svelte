<script>
  import { onMount } from 'svelte';
  import WhatsAppLinkGenerator from '$lib/tools/WhatsAppLinkGenerator.svelte';
  import { recentTools } from '$lib/stores/recent.js';

  onMount(() => {
    recentTools.addRecent('wa-link-generator');
  });
</script>

<svelte:head>
  <title>WhatsApp Link Generator - Tools Collection</title>
  <meta name="description" content="Generate WhatsApp click-to-chat links easily. Create custom WhatsApp links with pre-filled messages for business or personal use." />
  <meta name="keywords" content="whatsapp, link generator, click to chat, whatsapp link, wa link, whatsapp business" />
</svelte:head>

<div class="py-8">
  <WhatsAppLinkGenerator />
</div>
