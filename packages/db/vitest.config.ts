import { defineConfig, type ViteUserConfig } from 'vitest/config';

const vitestConfig: ViteUserConfig = defineConfig({
  test: {
    root: './',
    watch: false,
    reporters: ['default'],
    pool: 'threads',
    isolate: false,
    globalSetup: './src/testing/global-setup.ts',
  },
});

export default vitestConfig;
