import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      includeAssets: ['logo.webp', 'favicon.svg'],
      manifest: {
        name: 'GMP - Gestión de Mantenimiento',
        short_name: 'GMP',
        description: 'Sistema de Automatización para Reportes de Mantenimiento Preventivo',
        theme_color: '#1a5276',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        lang: 'es-CO',
        icons: [
          {
            src: 'logo.webp',
            sizes: '512x512',
            type: 'image/webp',
          },
          {
            src: 'logo.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webmanifest}'],
        runtimeCaching: [
          {
            // Cache de respuestas de la API para funcionamiento offline básico
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
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
