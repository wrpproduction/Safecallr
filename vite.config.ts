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
      } catch (e) { /* ignore */ }
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery?key=${apiKey}`;
    const body = {
      structuredQuery: {
        from: [{ collectionId: 'articles' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'published' },
            op: 'EQUAL',
            value: { booleanValue: true },
          },
        },
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn('[Vite Prerender] runQuery HTTP', res.status);
      return routes;
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      for (const row of data) {
        const fields = row.document?.fields;
        if (!fields) continue; // ignore les lignes readTime sans document
        const metaTitle = fields.metaTitle?.stringValue;
        if (metaTitle) {
          const route = `/actualite/${encodeURIComponent(metaTitle)}`;
          if (!routes.includes(route)) routes.push(route);
        }
      }
    }
    console.log(`[Vite Prerender] ${routes.length} article(s) publié(s) trouvé(s).`);
  } catch (err) {
    console.warn('[Vite Prerender] Articles Firestore non chargés au build:', err);
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

  // Récupération des routes dynamiques d'articles publiés et options de prerender
  let allPrerenderRoutes = [...staticRoutes];
  let prerenderRendererOptions: any = {
    renderAfterTime: 4000,
  };
  let enablePrerenderPlugin = false;

  if (process.env.ENABLE_PRERENDER === 'true') {
    try {
      const articleRoutes = await getPublishedArticleRoutes();
      allPrerenderRoutes = Array.from(new Set([...staticRoutes, ...articleRoutes]));

      const chromium = (await import('@sparticuz/chromium')).default;
      // Rendu HTML simple : pas besoin du mode graphique
      chromium.setGraphicsMode = false;
      const executablePath = await chromium.executablePath();

      if (executablePath) {
        prerenderRendererOptions = {
          renderAfterTime: 4000,
          maxConcurrentRoutes: 1,
          launchOptions: {
            headless: true,
            executablePath: executablePath,
            args: chromium.args,
          },
        };
        enablePrerenderPlugin = true;
      } else {
        console.warn('[Vite Prerender] Aucun chemin exécutable Chromium trouvé.');
      }
    } catch (err) {
      console.warn('[Vite Prerender] Erreur init @sparticuz/chromium, désactivation du prerender:', err);
      enablePrerenderPlugin = false;
    }
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
      enablePrerenderPlugin ? prerender({
        routes: allPrerenderRoutes,
        renderer: '@prerenderer/renderer-puppeteer',
        rendererOptions: prerenderRendererOptions
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
