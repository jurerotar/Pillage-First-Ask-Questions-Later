import { defineConfig, type ViteUserConfig } from 'vitest/config';
import repoPackageJson from '../../package.json' with { type: 'json' };

const vitestConfig: ViteUserConfig = defineConfig({
  define: {
    'import.meta.env.VERSION': JSON.stringify(repoPackageJson.version),
  },
  test: {
    root: './',
    watch: false,
    reporters: ['default'],
    pool: 'threads',
    isolate: false,
    fsModuleCache: true,
    globalSetup: './src/testing/global-setup.ts',
  },
});

export default vitestConfig;
