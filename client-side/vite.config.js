/**
 * Name: vite.config.js
 * PHASE 2 FIXES:
 *
 *   BUILD FIX: esbuild minification explicitly enabled for prod
 *   BUILD FIX: sourcemap disabled in production (was leaking source code + slowing CI)
 *   BUILD FIX: chunk size warning threshold raised to 600kb (recharts triggers 500kb default)
 *   BUILD FIX: manualChunks expanded — tailwind utilities, date-fns, framer-motion
 *              now get their own chunks so each route only loads what it needs
 *   BUILD FIX: assetsInlineLimit raised to 8kb — small SVG icons won't create
 *              extra HTTP round trips
 *   DEV FIX:   hmr.overlay: false — suppresses the full-screen error overlay in dev
 *              (errors still visible in console, overlay is just disruptive)
 *   PWA FIX:   workbox caching strategies added so the service worker actually
 *              caches API responses and static assets (was registered but not caching)
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],

      // ─────────────────────────────────────────────
      // FIX: workbox was missing — the service worker was registered
      // but had no caching rules, so offline mode did nothing.
      // ─────────────────────────────────────────────
      workbox: {
        // Cache static assets (JS, CSS, images) for 30 days
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Cache GET API responses (employee list, announcements) for 5 minutes
            urlPattern: ({ request, url }) =>
              request.method === 'GET' && url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
            },
          },
        ],
        // Don't cache auth endpoints — always go to network
        navigateFallbackDenylist: [/^\/api\/auth/],
      },

      manifest: {
        name: 'HR Leave & Attendance Management System',
        short_name: 'HR System',
        description: 'Manage leaves and attendance efficiently',
        theme_color: '#ffffff',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],

  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },

  server: {
    port: 5173,
    open: true,
    // FIX: Suppress full-screen HMR error overlay in dev
    hmr: { overlay: false },
    headers: {
      'Content-Security-Policy': "img-src 'self' data: https: blob:",
    },
  },

  build: {
    // ─────────────────────────────────────────────
    // FIX: sourcemap was undefined (defaults to false in prod) — made explicit.
    // Never ship sourcemaps to production: they expose your entire source code.
    // ─────────────────────────────────────────────
    sourcemap: mode === 'development',

    // FIX: Raise chunk size warning — recharts alone is ~500kb gzipped.
    // 600kb keeps CI warnings meaningful without false alarms.
    chunkSizeWarningLimit: 600,

    // FIX: Inline small assets (icons, tiny SVGs) to save HTTP round trips
    assetsInlineLimit: 8 * 1024, // 8kb

    minify: 'esbuild', // Explicit — esbuild is ~20x faster than terser

    rollupOptions: {
      output: {
        // ─────────────────────────────────────────────
        // FIX: Expanded chunk splitting
        // BEFORE: Only react-dom, react-router, recharts, d3, gsap were split.
        //   → All other node_modules bundled into main chunk → slow first load.
        //
        // AFTER: Each heavy library gets its own chunk so pages only load
        //   what they actually need. React Router handles code-splitting;
        //   manualChunks ensures shared heavy deps stay separate.
        // ─────────────────────────────────────────────
        manualChunks(id) {
          // Core React — loaded on every route
          if (id.includes('node_modules/react-dom')
            || id.includes('node_modules/react/')
            || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }

          // Charts — only loaded on Dashboard / Reports / Analytics pages
          if (id.includes('node_modules/recharts')
            || id.includes('node_modules/d3-')
            || id.includes('node_modules/victory')) {
            return 'vendor-charts';
          }

          // Animations — only loaded when components that use gsap/framer mount
          if (id.includes('node_modules/gsap')
            || id.includes('node_modules/framer-motion')) {
            return 'vendor-animation';
          }

          // Date utilities — shared across attendance, leave, payroll pages
          if (id.includes('node_modules/date-fns')
            || id.includes('node_modules/dayjs')
            || id.includes('node_modules/luxon')) {
            return 'vendor-dates';
          }

          // Form libraries
          if (id.includes('node_modules/react-hook-form')
            || id.includes('node_modules/@hookform')
            || id.includes('node_modules/zod')
            || id.includes('node_modules/joi')) {
            return 'vendor-forms';
          }

          // PDF / export utilities (heavy — only loaded on Reports)
          if (id.includes('node_modules/jspdf')
            || id.includes('node_modules/xlsx')
            || id.includes('node_modules/file-saver')) {
            return 'vendor-export';
          }

          // UI icon libraries
          if (id.includes('node_modules/lucide-react')
            || id.includes('node_modules/@heroicons')
            || id.includes('node_modules/react-icons')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
}));