<script>
  import { onMount } from 'svelte';
  import WhatsAppLinkGenerator from '$lib/tools/WhatsAppLinkGenerator.svelte';
  import { recentTools } from '$lib/stores/recent.js';

  onMount(() => {
    recentTools.addRecent('wame-link-generator');
  });
</script>

<svelte:head>
  <title>WhatsApp Link Generator (wa.me) - Tools Collection</title>
  <meta name="description" content="Generate wa.me WhatsApp click-to-chat links easily. Create custom wa.me links with pre-filled messages for business or personal use." />
  <meta name="keywords" content="whatsapp, wa.me, wame, link generator, click to chat, whatsapp link, wa link, whatsapp business" />
</svelte:head>

<div class="py-8">
  <WhatsAppLinkGenerator />
</div>
