import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@liar/message-types': path.resolve(__dirname, '../../packages/message-types'),
    },
  },
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
      '/uploads': {
        target: 'http://backend:3000',
      },
      '/socket.io': {
        target: 'http://backend:3000',
        ws: true,
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
