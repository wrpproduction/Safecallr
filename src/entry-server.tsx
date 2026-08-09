import React from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { StaticRouter } from 'react-router';
import App from './App';
import { PreloadContext } from './contexts/PreloadContext';

export async function render(url: string, preloadedData?: any): Promise<{ html: string; head: string; htmlAttrs: string }> {
  const helmetContext: { helmet?: any } = {};

  const lang: 'fr' | 'en' | 'es' = (url.startsWith('/en/') || url === '/en')
    ? 'en'
    : (url.startsWith('/es/') || url === '/es')
    ? 'es'
    : 'fr';

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <PreloadContext.Provider value={preloadedData}>
          <App forcedLang={lang} />
        </PreloadContext.Provider>
      </StaticRouter>
    </HelmetProvider>
  );

  const { helmet } = helmetContext;
  const head = [
    helmet?.title?.toString(),
    helmet?.meta?.toString(),
    helmet?.link?.toString(),
    helmet?.script?.toString(),
  ]
    .filter(Boolean)
    .join('\n');

  const htmlAttrs = helmet?.htmlAttributes?.toString() || '';

  return { html, head, htmlAttrs };
}
