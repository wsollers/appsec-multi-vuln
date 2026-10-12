import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies API + GraphQL to the backend so the SPA uses same-origin
// relative paths in development (and a strict CSP in production hosting).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/graphql': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
