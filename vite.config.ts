import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
        demo: resolve(__dirname, 'demo/index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
        offline: resolve(__dirname, 'offline.html'),
        notFound: resolve(__dirname, '404.html'),
      },
    },
  },
});
