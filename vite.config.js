// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [
        // Only keeping the minimum external fixes necessary for stability
        'fsevents',
        'node:fs',
        'node:path',
        'node:process',
      ],
    }
  }
});
