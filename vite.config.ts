import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';
import prerender from 'vite-plugin-prerenderer';
import { VitePWA } from 'vite-plugin-pwa';

// Polyfill for environments without full TTY support
if (process.stdout && !process.stdout.clearLine) {
  (process.stdout as any).clearLine = () => {};
  (process.stdout as any).cursorTo = () => {};
}

/**
 * Récupère publiquement les articles de blog publiés depuis Firestore (REST API non authentifiée)
 * pour inclure leurs URLs dynamique dans le tableau de prerender.
 */
async function getPublishedArticleRoutes(): Promise<string[]> {
  const routes: string[] = [];
  try {
    let projectId = "gen-lang-client-0258611834";
    let databaseId = "ai-studio-ffb666f4-67e6-42be-a2e6-2406f74f5b0d";
    let apiKey = "AIzaSyCPrcZlZIeHjJfWT_JiD_PiwzCbhMmmgH0";

    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.projectId) projectId = config.projectId;
        if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
        if (config.apiKey) apiKey = config.apiKey;
      } catch (e) {
        // Ignorer l'erreur de parse
      }
    }

    const collectionsToFetch = ['articles', 'blog'];
    for (const col of collectionsToFetch) {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${col}?key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.documents && Array.isArray(data.documents)) {
          for (const doc of data.documents) {
            const fields = doc.fields || {};
            const isPublished = 
              fields.published?.booleanValue === true || 
              fields.status?.stringValue === 'published' ||
              (!fields.published && !fields.status);

            if (isPublished) {
              const slug = fields.slug?.stringValue || fields.metaTitle?.stringValue;
              const docId = doc.name ? doc.name.split('/').pop() : null;
              const identifier = slug || docId;
              if (identifier) {
                const articleRoute = `/actualite/${identifier}`;
                if (!routes.includes(articleRoute)) {
                  routes.push(articleRoute);
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Vite Prerender] Impossible de charger les articles Firestore au build:', err);
  }
  return routes;
}

export default defineConfig(async ({mode}) => {
  const env = loadEnv(mode, '.', '');

  // Liste réconciliée des vraies routes statiques React Router & Sitemap
  const staticRoutes = [
    '/',
    '/particuliers',
    '/professionnels',
    '/entreprises',
    '/institutions',
    '/company-contact',
    '/how-it-works',
    '/actualite',
    '/sitemap',
    '/plan-du-site',
    '/mentions-legales',
    '/legal-notice',
    '/aviso-legal',
    '/cgu',
    '/terms',
    '/terms-of-use',
    '/terminos',
    '/condiciones-uso',
    '/confidentialite',
    '/privacy',
    '/privacidad',
  ];

  // Récupération des routes dynamiques d'articles publiés au moment du build
  let allPrerenderRoutes = [...staticRoutes];
  if (process.env.ENABLE_PRERENDER === 'true') {
    const articleRoutes = await getPublishedArticleRoutes();
    allPrerenderRoutes = Array.from(new Set([...staticRoutes, ...articleRoutes]));
  }

  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'apple-touch-icon-precomposed.png', 'logo.png'],
        manifest: {
          name: 'SafeCallr',
          short_name: 'SafeCallr',
          description: 'Authentification en temps réel des appels professionnels',
          theme_color: '#0F1B3D',
          background_color: '#0F1B3D',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          lang: 'fr',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'document',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                expiration: {
                  maxEntries: 10,
                },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image' || request.destination === 'style' || request.destination === 'script',
              handler: 'CacheFirst',
              options: {
                cacheName: 'assets',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                },
              },
            },
          ],
        }
      }),
      process.env.ENABLE_PRERENDER === 'true' ? prerender({
        routes: allPrerenderRoutes,
        renderer: '@prerenderer/renderer-puppeteer',
        rendererOptions: {
          renderAfterTime: 500,
        }
      }) : null
    ].filter(Boolean),
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
