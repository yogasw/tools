/**
 * SEO Utility Helper
 * Generates SEO meta tags from tool configuration
 */

/**
 * Generate SEO meta tags for a tool page
 * @param {Object} tool - Tool configuration from toolsRegistry
 * @returns {Object} SEO metadata object
 */
export function generateToolSEO(tool) {
  if (!tool) return null;

  return {
    title: tool.seoTitle || tool.name,
    description: tool.seoDescription || tool.description,
    keywords: tool.keywords?.join(', ') || '',
    ogTitle: tool.ogTitle || tool.name,
    ogDescription: tool.ogDescription || tool.description,
    ogImage: tool.ogImage || '/og-default.png',
    ogUrl: tool.canonical || `https://yogasw.my.id/${tool.id}`,
    canonical: tool.canonical || `https://yogasw.my.id/${tool.id}`,
    type: 'website'
  };
}

/**
 * Generate JSON-LD Schema.org markup for a tool
 * @param {Object} tool - Tool configuration from toolsRegistry
 * @returns {string} JSON-LD script content
 */
export function generateToolSchema(tool) {
  if (!tool) return '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.seoDescription || tool.description,
    url: tool.canonical || `https://yogasw.my.id/${tool.id}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    author: {
      '@type': 'Organization',
      name: 'Dev Utilities'
    }
  };

  return JSON.stringify(schema);
}

/**
 * Generate homepage Schema.org markup
 * @returns {string} JSON-LD script content
 */
export function generateHomepageSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Dev Utilities',
    description: 'Free online developer tools collection',
    url: 'https://yogasw.my.id/',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://yogasw.my.id/?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    },
    author: {
      '@type': 'Organization',
      name: 'Dev Utilities',
      url: 'https://yogasw.my.id/'
    }
  };

  return JSON.stringify(schema);
}

/**
 * Generate BreadcrumbList Schema for tool pages
 * @param {Object} tool - Tool configuration
 * @returns {string} JSON-LD script content
 */
export function generateBreadcrumbSchema(tool) {
  if (!tool) return '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://yogasw.my.id/'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: tool.name,
        item: tool.canonical || `https://yogasw.my.id/${tool.id}`
      }
    ]
  };

  return JSON.stringify(schema);
}
