import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
  server: {
    open: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'esm-seedrandom',
      'dexie',
      'formik',
      'sha1-uint8array',
      'react-helmet-async',
      'react-modal',
      'tailwind-override',
      'usehooks-ts',
      'clsx',
      'react-icons',
      'i18next',
      'react-i18next',
      'react-window',
      'react-transition-group',
      'react-tooltip',
      '@tanstack/react-query',
    ],
  },
  resolve: {
    alias: {
      app: path.resolve(__dirname, 'src/app'),
      components: path.resolve(__dirname, 'src/components'),
      database: path.resolve(__dirname, 'src/database'),
      factories: path.resolve(__dirname, 'src/factories'),
      utils: path.resolve(__dirname, 'src/utils'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      i18n: path.resolve(__dirname, 'src/i18n'),
      interfaces: path.resolve(__dirname, 'src/interfaces'),
      styles: path.resolve(__dirname, 'src/styles'),
      assets: path.resolve(__dirname, 'src/assets'),
      config: path.resolve(__dirname, 'config'),
      mocks: path.resolve(__dirname, '__mocks__'),
      'test-utils': path.resolve(__dirname, 'src/test-utils'),
    },
  },
  worker: {
    format: 'es',
  },
}) satisfies UserConfig;
