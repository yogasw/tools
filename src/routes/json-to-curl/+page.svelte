<script>
  import { onMount } from 'svelte';
  import JsonToCurl from '$lib/json-to-curl/JsonToCurl.svelte';
  import { recentTools } from '$lib/stores/recent.js';
  import { toolsRegistry } from '$lib/stores/tools.js';
  import SEO from '$lib/components/SEO.svelte';
  import { generateToolSEO, generateToolSchema, generateBreadcrumbSchema } from '$lib/utils/seo.js';

  const tool = toolsRegistry.find(t => t.id === 'json-to-curl');
  const seoData = generateToolSEO(tool);

  onMount(() => {
    recentTools.addRecent('json-to-curl');
  });
</script>

<SEO
  title={seoData.title}
  description={seoData.description}
  keywords={seoData.keywords}
  canonical={seoData.canonical}
  ogTitle={seoData.ogTitle}
  ogDescription={seoData.ogDescription}
  ogImage={seoData.ogImage}
  ogUrl={seoData.ogUrl}
  schema={`[${generateToolSchema(tool)},${generateBreadcrumbSchema(tool)}]`}
/>

<div class="main-content-height overflow-hidden">
  <JsonToCurl />
</div>
