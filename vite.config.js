import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

// 从样式令牌读取主题色，供网页和手机安装清单共用。
const themeColor = readFileSync(new URL('./src/styles/tokens.css', import.meta.url), 'utf8').match(/--bg:\s*([^;]+)/)[1].trim();

export default defineConfig({
  plugins: [react(), {
    name: 'app-theme-color',
    transformIndexHtml: (html) => html.replace('__APP_THEME_COLOR__', themeColor),
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
          // 将图表渲染和 Supabase 客户端分别打包，便于浏览器复用缓存。
          if (id.includes('/node_modules/zrender/')) return 'chart-renderer';
          if (id.includes('/node_modules/@supabase/')) return 'supabase-client';
        },
      },
    },
  },
});
