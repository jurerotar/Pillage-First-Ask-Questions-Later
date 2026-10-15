import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { getConfig } from './config.ts';
import { Store } from './store.ts';

const start = async (): Promise<void> => {
  const config = getConfig();
  const store = await Store.create(config.dataDirectory);
  const app = createApp({ config, store });
  const port = Number.parseInt(process.env.PORT ?? '3001', 10);

  serve({ fetch: app.fetch, port });
};

void start();
