import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  plugins: [react()],
  test: {
    root: '.',
    environment: 'jsdom',
    globals: true,
  },
  server: {
    port: 3000,
    host: true,
    open: false
  }
});
