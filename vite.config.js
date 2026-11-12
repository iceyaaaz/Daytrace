import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'script',
    manifest: {
      id: '/', name: '成长日记', short_name: '日记', lang: 'zh-CN',
      start_url: '/', scope: '/', display: 'standalone',
      theme_color: '#f4f7f3', background_color: '#f4f7f3',
      icons: [192, 512].map((size) => ({ src: `/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any maskable' })),
    },
    workbox: {
      globPatterns: ['**/*.{html,js,css,png,webmanifest}'],
      skipWaiting: true,
      clientsClaim: true,
      navigateFallback: null,
      directoryIndex: '__no_precached_directory_index__',
      // 页面优先取线上版本，断网只回退到静态外壳。日记请求不进入缓存。
      runtimeCaching: [{
        urlPattern: ({ request, sameOrigin }) => sameOrigin && request.mode === 'navigate',
        handler: 'NetworkOnly',
        options: { precacheFallback: { fallbackURL: '/index.html' } },
      }],
    },
  })],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/zrender/')) return 'chart-renderer';
        },
      },
    },
  },
});
