import { defineConfig, type ViteUserConfig } from 'vitest/config';
import repoPackageJson from '../../package.json' with { type: 'json' };

const vitestConfig: ViteUserConfig = defineConfig({
  define: {
    'import.meta.env.VERSION': JSON.stringify(repoPackageJson.version),
  },
  test: {
    root: './',
    watch: false,
    pool: 'threads',
    fsModuleCache: true,
    globalSetup: './src/db/testing/global-setup.ts',
  },
});

export default vitestConfig;
