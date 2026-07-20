/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/arena-web',
  server: {
    port: 4200,
    host: true,
  },
  preview: {
    port: 4200,
    host: 'localhost',
  },
  resolve: {
    // Native Vite 8 tsconfig paths resolution — no plugin needed
    tsconfigPaths: true,
  },
  plugins: [react()],
  build: {
    outDir: '../../dist/apps/arena-web',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
