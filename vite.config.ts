import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import viteReact from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [viteReact(), VitePWA({ registerType: 'autoUpdate', manifest: false })],
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
  // TODO: Consider using node sub-paths for this in the future
  resolve: {
    alias: {
      app: resolve(__dirname, 'app'),
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
});

// https://vitest.dev/config/
const vitestConfig = defineVitestConfig({
  test: {
    root: './',
    watch: false,
    globals: true,
    environment: 'happy-dom',
    setupFiles: './vitest-setup.ts',
    reporters: ['default'],
  },
});

export default mergeConfig(viteConfig, vitestConfig);
