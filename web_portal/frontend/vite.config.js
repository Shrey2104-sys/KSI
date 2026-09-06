import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2018', 'chrome70', 'edge79', 'firefox68', 'safari13'],
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});
