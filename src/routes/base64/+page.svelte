<script>
  import { onMount } from 'svelte';
  import Base64Tool from '$lib/tools/Base64Tool.svelte';
  import { recentTools } from '$lib/stores/recent.js';
  import { toolsRegistry } from '$lib/stores/tools.js';
  import SEO from '$lib/components/SEO.svelte';
  import { generateToolSEO, generateToolSchema, generateBreadcrumbSchema } from '$lib/utils/seo.js';

  const tool = toolsRegistry.find(t => t.id === 'base64');
  const seoData = generateToolSEO(tool);

  onMount(() => {
    recentTools.addRecent('base64');
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

<div class="py-8">
  <Base64Tool />
</div>
