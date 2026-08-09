import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

const cordovaHtmlPlugin = (enabled) => ({
  name: 'cordova-html',
  transformIndexHtml(html) {
    if (!enabled) {
      return html;
    }

    const withViewport = html.replace(
      'width=device-width, initial-scale=1.0, viewport-fit=cover',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
    );

    const withCsp = withViewport.replace(
      '<title>Collaborate</title>',
      `<title>Collaborate</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://collaborate-1.onrender.com wss://collaborate-1.onrender.com https://* wss://*; img-src 'self' data: https: blob:; media-src *;" />`,
    );

    return withCsp.replace(
      '<div id="root"></div>',
      '<div id="root"></div>\n    <script src="cordova.js"></script>',
    );
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isCordova = mode === 'cordova';
  const backendTarget = env.VITE_API_URL || 'https://collaborate-1.onrender.com';
  const socketTarget = env.VITE_SOCKET_URL || 'https://collaborate-1.onrender.com';

  return {
    base: isCordova ? './' : '/',
    plugins: [react(), cordovaHtmlPlugin(isCordova)],
    build: {
      outDir: isCordova ? '../mobile/www' : 'dist',
      emptyOutDir: true,
    },
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
