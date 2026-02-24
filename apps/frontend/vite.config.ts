import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['localhost', '.ngrok-free.dev', '.ngrok.io', '.ngrok.app', '.ngrok-free.app'],
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        // changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    hmr: process.env.HMR_HOST
      ? {
          host: process.env.HMR_HOST.replace(/^https?:\/\//, ''), // убираем https://
          protocol: process.env.HMR_HOST.includes('ngrok') ? 'wss' : 'ws',
        }
      : undefined,
  },
});
