import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_API_URL || 'http://localhost:3002';
  const socketTarget = env.VITE_SOCKET_URL || 'http://localhost:3002';

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
      },
    },
  };
});
