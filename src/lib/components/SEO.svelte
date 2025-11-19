<script>
  export let title = '';
  export let description = '';
  export let keywords = '';
  export let canonical = '';
  export let ogTitle = '';
  export let ogDescription = '';
  export let ogImage = '';
  export let ogUrl = '';
  export let schema = '';
  export let type = 'website';
</script>

<svelte:head>
  <!-- Primary Meta Tags -->
  <title>{title}</title>
  <meta name="title" content={title} />
  <meta name="description" content={description} />
  {#if keywords}
    <meta name="keywords" content={keywords} />
  {/if}

  <!-- Canonical URL -->
  {#if canonical}
    <link rel="canonical" href={canonical} />
  {/if}

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={type} />
  <meta property="og:url" content={ogUrl || canonical} />
  <meta property="og:title" content={ogTitle || title} />
  <meta property="og:description" content={ogDescription || description} />
  {#if ogImage}
    <meta property="og:image" content={ogImage} />
  {/if}
  <meta property="og:site_name" content="Dev Utilities" />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={ogUrl || canonical} />
  <meta property="twitter:title" content={ogTitle || title} />
  <meta property="twitter:description" content={ogDescription || description} />
  {#if ogImage}
    <meta property="twitter:image" content={ogImage} />
  {/if}

  <!-- Schema.org JSON-LD -->
  {#if schema}
    {@html `<script type="application/ld+json">${schema}<\/script>`}
  {/if}
</svelte:head>
