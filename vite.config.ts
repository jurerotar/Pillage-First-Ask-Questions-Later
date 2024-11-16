import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig, type UserConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import viteReact from '@vitejs/plugin-react';

const isInTestMode = process.env.VITEST === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ...(isInTestMode
      ? [viteReact()]
      : [
          reactRouter({
            buildDirectory: 'dist',
            prerender: true,
          }),
          VitePWA({ registerType: 'autoUpdate', manifest: false }),
        ]),
  ],
  server: {
    open: true,
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    include: [
      // Game data
      // 'assets/buildings',
      // 'assets/units',
      // Third-party deps
      'react',
      'react-dom',
      'react-dom/client',
      'react-router',
      'ts-seedrandom',
      'react-tabs',
      'react-hook-form',
      'react-modal',
      'usehooks-ts',
      'moderndash',
      'clsx',
      'react-icons/gi',
      'react-icons/lu',
      'react-icons/lia',
      'react-icons/gr',
      'react-icons/ti',
      'react-icons/tb',
      'react-icons/si',
      'react-icons/cg',
      'i18next',
      'react-i18next',
      'react-window',
      'react-tooltip',
      '@tanstack/react-query',
      'dayjs',
      'dayjs/plugin/relativeTime',
      'dayjs/plugin/duration',
    ],
  },
  resolve: {
    alias: {
      app: path.resolve(__dirname, 'app'),
    },
  },
  worker: {
    format: 'es',
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        additionalData: '@use "./app/styles/_globals.scss" as *;',
      },
    },
  },
  test: {
    root: './',
    watch: false,
    globals: true,
    environment: 'happy-dom',
    setupFiles: './vitest-setup.ts',
    reporters: ['default'],
  },
}) satisfies UserConfig;
