import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds the browser-only engine demo (web-demo/) for GitHub Pages.
// Separate from electron.vite.config.ts, which builds the actual desktop app.
export default defineConfig({
  root: resolve(__dirname, 'web-demo'),
  base: '/RealisticNextItem/',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist-demo'),
    emptyOutDir: true,
  },
});
