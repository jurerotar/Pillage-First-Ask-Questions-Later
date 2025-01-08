import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import viteReact from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { reactRouter } from '@react-router/dev/vite';

const isInTestMode = process.env.VITEST === 'true';

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [...(isInTestMode ? [viteReact()] : [reactRouter(), VitePWA({ registerType: 'autoUpdate', manifest: false })])],
  server: {
    open: true,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      // There's a ton of nasty warnings about unreferenced files if this option is omitted :(
      external: [/^\/graphic-packs/],
    },
  },
  optimizeDeps: {
    entries: ['app/**/*.{ts,tsx}'],
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
    setupFiles: './app/tests/vitest-setup.ts',
    reporters: ['default'],
  },
});

export default mergeConfig(viteConfig, vitestConfig);
