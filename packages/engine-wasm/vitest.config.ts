import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  test: {
    root,
    pool: 'forks',
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 180_000,
    hookTimeout: 60_000,
    projects: [
      {
        test: {
          name: 'scripts',
          root,
          include: ['scripts/__tests__/*.test.ts'],
        },
      },
      {
        test: {
          name: 'engine',
          root,
          include: ['src/__tests__/*.test.ts'],
          globalSetup: ['./src/__tests__/setup.ts'],
          testTimeout: 180_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
