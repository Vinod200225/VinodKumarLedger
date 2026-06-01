import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/VinodKumarLedger/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/192.png', 'icons/512.png'],
      manifest: {
        name: 'Ledger',
        short_name: 'Ledger',
        description: 'Personal finance tracker',
        display: 'standalone',
        start_url: '/VinodKumarLedger/',
        scope: '/VinodKumarLedger/',
        background_color: '#0f172a',
        theme_color: '#6366f1',
        icons: [
          { src: 'icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://sheets.googleapis.com',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sheets-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    open: true
  }
})
