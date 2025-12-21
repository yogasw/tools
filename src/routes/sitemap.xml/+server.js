import { toolsRegistry } from '$lib/stores/tools.js';

// Enable prerendering for static hosting (GitHub Pages, etc)
export const prerender = true;

/**
 * Generate dynamic sitemap.xml from toolsRegistry
 * This automatically updates when new tools are added
 */
export async function GET() {
  const baseUrl = 'https://yogasw.my.id';
  const today = new Date().toISOString().split('T')[0];

  // Generate sitemap entries for all internal tools
  const toolEntries = toolsRegistry
    .filter(tool => tool.type === 'internal') // Only include internal tools
    .map(tool => `
  <url>
    <loc>${baseUrl}/${tool.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`)
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${toolEntries}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=0, s-maxage=3600'
    }
  });
}
