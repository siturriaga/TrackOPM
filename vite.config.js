import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { sourcemap: false }, // helps avoid eval-like behavior in maps
  server: { port: 5173 },
  preview: { port: 4173 },
  esbuild: { legalComments: 'none' }
});
