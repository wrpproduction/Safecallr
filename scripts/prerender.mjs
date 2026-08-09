import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function main() {
  // 1. Ne s'exécuter que si ENABLE_PRERENDER === 'true'
  if (process.env.ENABLE_PRERENDER !== 'true') {
    console.log('[Prerender] ENABLE_PRERENDER is not "true". Skipping node prerender.');
    process.exit(0);
  }

  console.log('[Prerender] Starting Node SSR Prerender...');

  // 2. Lire le gabarit dist/index.html
  const distDir = path.resolve('dist');
  const templatePath = path.join(distDir, 'index.html');

  if (!fs.existsSync(templatePath)) {
    console.error('[Prerender] Error: dist/index.html not found. Run "vite build" first.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');

  // 3. Construire la liste des routes
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

  const articleRoutes = await getPublishedArticleRoutes();
  const allRoutes = Array.from(new Set([...staticRoutes, ...articleRoutes]));

  console.log(`[Prerender] ${allRoutes.length} route(s) to prerender.`);

  // 4. Importer la fonction render du bundle serveur (dist-server/entry-server.js)
  const serverEntryPath = path.resolve('dist-server/entry-server.js');
  if (!fs.existsSync(serverEntryPath)) {
    console.error('[Prerender] Error: dist-server/entry-server.js not found. Compile entry-server.tsx first.');
    process.exit(1);
  }

  let render;
  try {
    const serverModule = await import(pathToFileURL(serverEntryPath).href);
    render = serverModule.render;
    if (typeof render !== 'function') {
      throw new Error('Exported "render" is not a function.');
    }
  } catch (err) {
    console.error('[Prerender] Failed to load dist-server/entry-server.js:', err);
    process.exit(1);
  }

  // 5. Génération HTML pour chaque route
  let successCount = 0;

  for (const route of allRoutes) {
    try {
      const { html, head } = await render(route);

      let cleanedTemplate = template
        .replace(/<title>[\s\S]*?<\/title>/i, '')
        .replace(/<meta\s+name="description"[^>]*>/gi, '')
        .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
        .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
        .replace(/<link\s+rel="canonical"[^>]*>/gi, '');

      let fullHtml = cleanedTemplate;

      if (head) {
        fullHtml = fullHtml.replace('</head>', `${head}\n</head>`);
      }

      if (html) {
        fullHtml = fullHtml.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${html}</div>`);
      }

      let outPath;
      if (route === '/') {
        outPath = templatePath;
      } else {
        // Ex: /particuliers -> dist/particuliers/index.html
        const cleanRoute = decodeURIComponent(route);
        outPath = path.join(distDir, cleanRoute, 'index.html');
      }

      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, fullHtml, 'utf-8');
      successCount++;
    } catch (err) {
      console.warn(`[Prerender] Warning: Failed to prerender route "${route}":`, err?.message || err);
    }
  }

  // 6. Récapitulatif final
  console.log(`[Prerender] Complete. ${successCount}/${allRoutes.length} page(s) prerendered successfully.`);
}

/**
 * Récupère les routes des articles publiés depuis Firestore via l'API REST REST
 */
async function getPublishedArticleRoutes() {
  const routes = [];
  try {
    let projectId = 'gen-lang-client-0258611834';
    let databaseId = 'ai-studio-ffb666f4-67e6-42be-a2e6-2406f74f5b0d';
    let apiKey = 'AIzaSyCPrcZlZIeHjJfWT_JiD_PiwzCbhMmmgH0';

    const configPath = path.resolve('firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.projectId) projectId = config.projectId;
        if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
        if (config.apiKey) apiKey = config.apiKey;
      } catch (e) {
        /* ignore */
      }
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
      console.warn('[Prerender] Firestore runQuery HTTP status:', res.status);
      return routes;
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      for (const row of data) {
        const fields = row.document?.fields;
        if (!fields) continue;
        const metaTitle = fields.metaTitle?.stringValue;
        if (metaTitle) {
          const route = `/actualite/${encodeURIComponent(metaTitle)}`;
          if (!routes.includes(route)) routes.push(route);
        }
      }
    }
  } catch (err) {
    console.warn('[Prerender] Could not fetch articles from Firestore:', err?.message || err);
  }
  return routes;
}

main().catch((err) => {
  console.error('[Prerender] Fatal error:', err);
  process.exit(1);
});
