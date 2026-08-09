import React from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { StaticRouter } from 'react-router';
import App from './App';

export async function render(url: string): Promise<{ html: string; head: string }> {
  const helmetContext: { helmet?: any } = {};

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <App />
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

  return { html, head };
}
