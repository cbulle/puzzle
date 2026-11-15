const siteUrl = import.meta.env.PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');

export function GET() {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    ...(siteUrl ? [`Sitemap: ${new URL('/sitemap-index.xml', siteUrl).href}`] : [])
  ];

  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
