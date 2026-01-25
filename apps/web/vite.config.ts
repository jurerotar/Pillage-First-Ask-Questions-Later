import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
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

// import { visualizer } from "rollup-plugin-visualizer";

const graphicsVersion =
  packageJson.dependencies['@pillage-first/graphics'] ?? '0.0.0';

const isInTestMode = process.env.VITEST === 'true';
const isDeployingToMaster = process.env.BRANCH_ENV === 'master';

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
      src: `/web-app-manifest-192x192.png?v=${graphicsVersion}`,
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: `/web-app-manifest-512x512.png?v=${graphicsVersion}`,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  scope: '/',
  categories: ['games', 'strategy', 'browser-game'],
};

// Custom plugin to run i18n hashing after build in production
const i18nHashPlugin = () => ({
  name: 'i18n-hash',
  closeBundle() {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.USE_I18N_HASHED === 'true'
    ) {
      console.log('Running i18n hash transformation...');
      try {
        execSync('node scripts/i18n-transform-to-hashed.ts', {
          stdio: 'inherit',
        });
        console.log('i18n hash transformation completed');
      } catch (error) {
        console.error('Error during i18n hash transformation:', error);
        throw error;
      }
    }
  },
});

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
    // Add i18n hash plugin only for production builds
    process.env.NODE_ENV === 'production' &&
      process.env.USE_I18N_HASHED === 'true' &&
      i18nHashPlugin(),
    // visualizer({ open: true }) as PluginOption,
  ],
  server: {
    open: false,
  },
  build: {
    target: 'esnext',
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
    'import.meta.env.BRANCH_ENV': JSON.stringify(
      isDeployingToMaster ? 'master' : 'develop',
    ),
    'import.meta.env.COMMIT_REF': JSON.stringify(process.env.COMMIT_REF),
    'import.meta.env.HEAD': JSON.stringify(process.env.HEAD),
    'import.meta.env.USE_I18N_HASHED': JSON.stringify(
      process.env.USE_I18N_HASHED,
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
