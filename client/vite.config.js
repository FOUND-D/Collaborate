import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_API_URL || 'https://collaborate-1.onrender.com';
  const socketTarget = env.VITE_SOCKET_URL || 'https://collaborate-1.onrender.com';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: socketTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/leetcode-proxy': {
          target: 'https://leetcode-api-faisalshohag.vercel.app',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/leetcode-proxy/, ''),
        },
      },
    },
  };
});
