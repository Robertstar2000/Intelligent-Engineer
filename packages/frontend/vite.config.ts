import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.BACKEND_URL': JSON.stringify(env.BACKEND_URL || 'http://localhost:3001'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          '@shared': path.resolve(__dirname, '../shared/src'),
        }
      },
      css: {
        postcss: {
          plugins: [],
        },
      },
    };
});