import { defineConfig, type ViteUserConfig } from 'vitest/config';

const vitestConfig: ViteUserConfig = defineConfig({
  test: {
    root: './',
    watch: false,
    fsModuleCache: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/guards**/*.ts'],
    },
  },
});

export default vitestConfig;
