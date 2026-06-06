import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      includeAssets: ['logo.png', 'favicon.svg', 'logo.svg'], 
      manifest: {
        name: 'Sistema de gestión de reportes',
        short_name: 'SGR',
        description: 'Sistema de gestión de servicios de campo',
        theme_color: '#D75501',
        background_color: '#D75501',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        lang: 'es-CO',
        icons: [
          {
            src: 'logo-white.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo-white.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'logo-white.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});