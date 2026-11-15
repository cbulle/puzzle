import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const { PUBLIC_SITE_URL = '' } = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'PUBLIC_');
const configuredSite = PUBLIC_SITE_URL.trim();
const parsedSite = configuredSite ? new URL(configuredSite) : undefined;
const site = parsedSite?.origin || '';

if (!site) {
  console.warn('PUBLIC_SITE_URL is not set; canonical URLs and the sitemap will be omitted until a domain is configured.');
}
if (parsedSite && parsedSite.protocol !== 'https:') {
  throw new Error('PUBLIC_SITE_URL must use HTTPS.');
}
if (parsedSite && (parsedSite.pathname !== '/' || parsedSite.search || parsedSite.hash)) {
  throw new Error('PUBLIC_SITE_URL must contain only the origin, without a path or query string.');
}

export default defineConfig({
  ...(site ? { site } : {}),
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/node_modules/@firebase/auth/')) return 'firebase-auth';
            if (id.includes('/node_modules/@firebase/firestore/')) return 'firebase-firestore';
          }
        }
      }
    }
  },
  build: {
    format: 'file'
  },
  trailingSlash: 'never',
  integrations: site ? [sitemap({
    filter: (page) => {
      const { pathname } = new URL(page);
      return pathname !== '/admin' && pathname !== '/admin.html' && !pathname.startsWith('/admin/');
    },
    serialize(item) {
      const url = new URL(item.url);
      if (url.pathname !== '/' && !url.pathname.endsWith('.html')) {
        url.pathname += '.html';
      }
      return { ...item, url: url.href };
    }
  })] : []
});
