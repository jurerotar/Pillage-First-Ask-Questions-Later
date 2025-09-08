import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import { type ManifestOptions, VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import packageJson from './package.json' with { type: 'json' };
import devtoolsJson from 'vite-plugin-devtools-json';
// import { visualizer } from "rollup-plugin-visualizer";
import { reactIconsSprite } from 'react-icons-sprite/vite';

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

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [
    reactIconsSprite({ spriteUrlVersion: graphicsVersion }),
    // !isInTestMode &&
    //   babel({
    //     filter: /\.tsx?$/,
    //     babelConfig: {
    //       presets: ['@babel/preset-typescript'],
    //       plugins: [['babel-plugin-react-compiler']],
    //     },
    //   }),
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
    // usehooks-ts is bundling lodash.debounce, which adds ~ 10kb of bloat. Until this is resolved, we're manually
    // replacing the dependency. Remove once/if this gets resolved.
    // https://github.com/juliencrn/usehooks-ts/discussions/669#discussioncomment-11922434
    {
      name: 'replace-lodash-debounce',
      enforce: 'pre',
      transform: (code, id) => {
        if (!id.includes('usehooks-ts')) {
          return;
        }

        return code.replace(
          `import debounce from 'lodash.debounce';`,
          `import { debounce } from 'moderndash';`,
        );
      },
    },
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
    'import.meta.env.VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.GRAPHICS_VERSION': JSON.stringify(graphicsVersion),
    'import.meta.env.BRANCH_ENV': JSON.stringify(
      isDeployingToMaster ? 'master' : 'develop',
    ),
  },
});

// https://vitest.dev/config/
const vitestConfig = defineVitestConfig({
  test: {
    root: './',
    watch: false,
    environment: 'happy-dom',
    setupFiles: './app/tests/vitest-setup.ts',
    reporters: ['default'],
    coverage: {
      include: ['app/**/*.{ts,tsx}'],
      exclude: ['**/*-mock.ts', '**/icon-*.tsx', '**/interfaces/**/*.ts'],
    },
  },
});

export default mergeConfig(viteConfig, vitestConfig);
