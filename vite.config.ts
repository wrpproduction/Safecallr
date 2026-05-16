import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import prerender from 'vite-plugin-prerenderer';

// Polyfill for environments without full TTY support
if (process.stdout && !process.stdout.clearLine) {
  (process.stdout as any).clearLine = () => {};
  (process.stdout as any).cursorTo = () => {};
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      prerender({
        routes: [
          '/', 
          '/particuliers', 
          '/professionnels', 
          '/institutions', 
          '/how-it-works',
          '/contact', 
          '/mentions-legales', 
          '/cgu', 
          '/confidentialite'
        ],
        renderer: '@prerenderer/renderer-puppeteer',
        rendererOptions: {
          renderAfterTime: 500,
        }
      })
    ],
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
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
