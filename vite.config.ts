import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import { type ManifestOptions, VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import clsx from 'clsx';

const isInTestMode = process.env.VITEST === 'true';
// We're setting special icons on non-master environments to differentiate PWAs
const isDeployingToMaster = process.env.BRANCH_ENV === 'master';

const appNamePostfix = clsx(!isDeployingToMaster && ' - dev');
const appIconPostfix = clsx(!isDeployingToMaster && '-dev');

const manifest: Partial<ManifestOptions> = {
  name: `Pillage First! (Ask Questions Later)${appNamePostfix}`,
  short_name: `Pillage First!${appNamePostfix}`,
  description:
    'Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions later!',
  start_url: '/',
  display: 'standalone',
  background_color: '#111111',
  theme_color: '#ffffff',
  orientation: 'portrait',
  icons: [
    { src: `/logo${appIconPostfix}-192.png`, type: 'image/png', sizes: '192x192' },
    { src: `/logo${appIconPostfix}-512.png`, type: 'image/png', sizes: '512x512', purpose: 'maskable' },
    { src: `/logo${appIconPostfix}-512.png`, type: 'image/png', sizes: '512x512' },
  ],
  scope: '/',
  lang: 'en',
  dir: 'ltr',
  categories: ['games', 'strategy', 'browser-game'],
};

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [
    !isInTestMode && reactRouter(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest,
    }),
  ],
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
  define: {
    'import.meta.env.BRANCH_ENV': JSON.stringify(isDeployingToMaster ? 'master' : 'develop'),
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
