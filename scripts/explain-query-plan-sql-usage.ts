import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

type QueryPlanTaskModule = {
  main: () => Promise<void>;
};

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const server = await createServer({
  appType: 'custom',
  clearScreen: false,
  logLevel: 'error',
  root: repoRoot,
  server: {
    hmr: false,
    middlewareMode: true,
  },
});

try {
  const task = (await server.ssrLoadModule(
    '/scripts/explain-query-plan-sql-usage-task.ts',
  )) as QueryPlanTaskModule;

  await task.main();
} finally {
  await server.close();
}
