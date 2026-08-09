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

  const { routes: articleRoutes, articlesMap } = await getPublishedArticlesData();
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
      let preloadedData = null;
      if (route.startsWith('/actualite/')) {
        const rawSlug = route.replace('/actualite/', '');
        const decodedSlug = decodeURIComponent(rawSlug);
        preloadedData = articlesMap[decodedSlug] || articlesMap[rawSlug] || null;
      }

      const { html, head } = await render(route, preloadedData);

      let cleanedTemplate = template
        .replace(/<title>[\s\S]*?<\/title>/gi, '')
        .replace(/<meta\s+name="description"[^>]*>/gi, '')
        .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
        .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
        .replace(/<link\s+rel="canonical"[^>]*>/gi, '');

      let fullHtml = cleanedTemplate;

      if (head) {
        fullHtml = fullHtml.replace('</head>', `${head}\n</head>`);
      }

      if (preloadedData) {
        const script = `<script>window.__PRELOADED_ARTICLE__ = ${JSON.stringify(preloadedData)};</script>`;
        fullHtml = fullHtml.replace('</head>', `${script}\n</head>`);
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
 * Convertit les valeurs de champs Firestore REST en objet JS simple
 */
function parseFirestoreFields(fields) {
  if (!fields) return {};
  const doc = {};
  for (const [key, val] of Object.entries(fields)) {
    if ('stringValue' in val) doc[key] = val.stringValue;
    else if ('booleanValue' in val) doc[key] = val.booleanValue;
    else if ('integerValue' in val) doc[key] = Number(val.integerValue);
    else if ('doubleValue' in val) doc[key] = Number(val.doubleValue);
    else if ('timestampValue' in val) doc[key] = val.timestampValue;
    else if ('mapValue' in val) doc[key] = parseFirestoreFields(val.mapValue?.fields);
    else if ('arrayValue' in val) {
      doc[key] = (val.arrayValue?.values || []).map(item => {
        if ('stringValue' in item) return item.stringValue;
        if ('integerValue' in item) return Number(item.integerValue);
        if ('doubleValue' in item) return Number(item.doubleValue);
        if ('booleanValue' in item) return item.booleanValue;
        return item;
      });
    } else if ('nullValue' in val) {
      doc[key] = null;
    }
  }
  return doc;
}

/**
 * Récupère les routes et données des articles publiés depuis Firestore via l'API REST
 */
async function getPublishedArticlesData() {
  const routes = [];
  const articlesMap = {};

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

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const row of data) {
          const fields = row.document?.fields;
          if (!fields) continue;

          const docName = row.document?.name || '';
          const id = docName.split('/').pop() || '';
          const parsed = parseFirestoreFields(fields);
          const article = { id, ...parsed };

          const metaTitle = article.metaTitle || article.slug || id;
          if (metaTitle) {
            articlesMap[metaTitle] = article;
            const route = `/actualite/${encodeURIComponent(metaTitle)}`;
            if (!routes.includes(route)) routes.push(route);
          }
        }
      }
    } else {
      console.warn('[Prerender] Firestore runQuery HTTP status:', res.status);
    }
  } catch (err) {
    console.warn('[Prerender] Could not fetch articles from Firestore:', err?.message || err);
  }

  return { routes, articlesMap };
}

main().catch((err) => {
  console.error('[Prerender] Fatal error:', err);
  process.exit(1);
});
