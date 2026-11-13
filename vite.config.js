import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

import { themeBoot } from './src/themes/boot.js';
const { script, themeColor } = themeBoot(readFileSync(new URL('./src/themes/palettes.css', import.meta.url), 'utf8'));

export default defineConfig({
  plugins: [react(), {
    name: 'app-theme-color',
    transformIndexHtml: (html) => html.replace('__APP_THEME_COLOR__', themeColor).replace('__APP_THEME_BOOT__', () => script),
  }, VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'script',
    // 安装清单定义主屏幕名称、图标和独立窗口的启动方式。
    manifest: {
      id: '/', name: '日迹', short_name: '日迹', description: '时间与成长记录', lang: 'zh-CN',
      start_url: '/', scope: '/', display: 'standalone',
      theme_color: themeColor, background_color: themeColor,
      icons: [192, 512].map((size) => ({ src: `/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any maskable' })),
    },
    workbox: {
      globPatterns: ['**/*.{html,js,css,png,webmanifest}'],
      globIgnores: ['**/BeastHero-*.js'],
      skipWaiting: true,
      clientsClaim: true,
      navigateFallback: null,
      directoryIndex: '__no_precached_directory_index__',
      // 页面优先取线上版本，断网只回退到静态外壳。日记请求不进入缓存。
      runtimeCaching: [{
        urlPattern: ({ request, sameOrigin }) => sameOrigin && request.mode === 'navigate',
        handler: 'NetworkOnly',
        options: { precacheFallback: { fallbackURL: '/index.html' } },
      }, {
        urlPattern: ({ url, sameOrigin }) => sameOrigin && /\/assets\/BeastHero-[\w-]+\.js$/.test(url.pathname),
        handler: 'CacheFirst',
        options: { cacheName: 'daytrace-theme-art', expiration: { maxEntries: 4 } },
      }],
    },
  })],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@supabase/')) return 'supabase-client';
        },
      },
    },
  },
});
