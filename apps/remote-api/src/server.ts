import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { getConfig } from './config.ts';
import { Store } from './store.ts';
import { cleanupExpiredWorlds } from './world-retention.ts';

const start = async (): Promise<void> => {
  const config = getConfig();
  const store = await Store.create(config.dataDirectory);
  const app = createApp({ config, store });
  const port = Number.parseInt(process.env.PORT ?? '3001', 10);

  const cleanup = async () => {
    try {
      await cleanupExpiredWorlds(config, store);
    } catch (error) {
      console.error('Unable to clean up expired shared worlds', error);
    } finally {
      setTimeout(() => void cleanup(), 60_000).unref();
    }
  };

  await cleanup();

  serve({ fetch: app.fetch, port });
};

void start();
