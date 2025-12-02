// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [
        // Added to fix the current "fsevents" error
        'fsevents',

        // These were previously necessary fixes for your Vite version
        'node:fs',
        'node:path',
        'node:url',
        'node:util',
        'node:process'
      ],
    }
  }
});
