import { defineConfig, type ViteUserConfig } from 'vitest/config';

const vitestConfig: ViteUserConfig = defineConfig({
  test: {
    root: './',
    watch: false,
    reporters: ['default'],
  },
});

export default vitestConfig;
