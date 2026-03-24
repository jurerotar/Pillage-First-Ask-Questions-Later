import { resolve } from 'node:path';
import faroRollupPlugin from '@grafana/faro-rollup-plugin';
import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import { reactIconsSprite } from 'react-icons-sprite/vite';
import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { type ManifestOptions, VitePWA } from 'vite-plugin-pwa';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import { reactRouter } from '@react-router/dev/vite';
import repoPackageJson from '../../package.json' with { type: 'json' };
import packageJson from './package.json' with { type: 'json' };

const graphicsVersion =
  packageJson.dependencies['@pillage-first/graphics'] ?? '0.0.0';

const isInTestMode = process.env.VITEST === 'true';
const isDeployingToMaster = process.env.HEAD === 'master';

const manifest: Partial<ManifestOptions> = {
  name: 'Pillage First! (Ask Questions Later)',
  short_name: 'Pillage First!',
  description:
    'Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions later!',
  start_url: '/',
  display: 'standalone',
  background_color: '#111111',
  theme_color: '#ffffff',
  orientation: 'portrait',
  icons: [
    {
      src: `/favicon/web-app-manifest-192x192.png?v=${graphicsVersion}`,
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: `/favicon/web-app-manifest-512x512.png?v=${graphicsVersion}`,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  scope: '/',
  categories: ['games', 'strategy', 'browser-game'],
};

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [
    reactIconsSprite(),
    // !isInTestMode &&
    //   babel({
    //     filter: /\.tsx?$/,
    //     babelConfig: {
    //       presets: ['@babel/preset-typescript'],
    //       plugins: [['babel-plugin-react-compiler']],
    //     },
    //   }),
    !isInTestMode &&
      mdx({ providerImportSource: '@mdx-js/react', development: false }),
    !isInTestMode && devtoolsJson(),
    !isInTestMode && reactRouter(),
    !isInTestMode && tailwindcss(),
    !isInTestMode &&
      VitePWA({
        registerType: 'autoUpdate',
        manifest,
        outDir: 'build/client',
        injectManifest: {
          swSrc: 'app/sw.ts',
          swDest: 'sw.js',
          globIgnores: ['**/*.html'],
        },
      }),
    isDeployingToMaster &&
      faroRollupPlugin({
        appName: 'pillage-first',
        endpoint: process.env.FARO_SOURCEMAP_API_URL!,
        apiKey: process.env.FARO_API_KEY!,
        appId: process.env.FARO_APP_ID!,
        stackId: process.env.FARO_STACK_ID!,
        gzipContents: true,
        keepSourcemaps: false,
        verbose: false,
        recursive: true,
        outputPath: resolve(__dirname, 'build/client'),
      }),
  ],
  server: {
    open: false,
    port: 5173,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rolldownOptions: {
      // There's a ton of nasty warnings about unreferenced files if this option is omitted :(
      external: [/^\/graphic-packs/],
    },
  },
  optimizeDeps: {
    entries: ['app/**/*.{ts,tsx}'],
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  resolve: {
    alias: {
      app: resolve(__dirname, 'app'),
      ...(!isDeployingToMaster && {
        'react-dom/client': 'react-dom/profiling',
        'scheduler/tracing': 'scheduler/tracing-profiling',
      }),
    },
  },
  worker: {
    format: 'es',
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        @use "./app/styles/_globals.scss" as *;
        $graphics-version: "${graphicsVersion}";
        `,
      },
    },
  },
  define: {
    'import.meta.env.VERSION': JSON.stringify(repoPackageJson.version),
    'import.meta.env.GRAPHICS_VERSION': JSON.stringify(graphicsVersion),
    'import.meta.env.COMMIT_REF': JSON.stringify(process.env.COMMIT_REF),
    'import.meta.env.HEAD': JSON.stringify(process.env.HEAD),
    'import.meta.env.URL': JSON.stringify(process.env.URL),
    'import.meta.env.DEPLOY_URL': JSON.stringify(process.env.DEPLOY_URL),
    'import.meta.env.DEPLOY_PRIME_URL': JSON.stringify(
      process.env.DEPLOY_PRIME_URL,
    ),
  },
});

// https://vitest.dev/config/
const vitestConfig = defineVitestConfig({
  test: {
    root: './',
    watch: false,
    setupFiles: './app/tests/vitest-setup.ts',
    reporters: ['default'],
    coverage: {
      include: ['app/**/*.{ts,tsx}'],
    },
  },
});

export default mergeConfig(viteConfig, vitestConfig);
