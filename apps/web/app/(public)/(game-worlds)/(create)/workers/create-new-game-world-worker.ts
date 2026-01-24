import { migrateAndSeed } from '@pillage-first/db';
import type { Server } from '@pillage-first/types/models/server';
import { createDbFacade } from '@pillage-first/utils/facades/database';

export type CreateNewGameWorldWorkerPayload = {
  server: Server;
};

globalThis.addEventListener(
  'message',
  async (event: MessageEvent<CreateNewGameWorldWorkerPayload>) => {
    const { default: sqlite3InitModule } = await import(
      '@sqlite.org/sqlite-wasm'
      );
    const { server } = event.data;

    const sqlite3 = await sqlite3InitModule();
    const opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
      directory: `/pillage-first-ask-questions-later/${server.slug}`,
    });

    const database = new opfsSahPool.OpfsSAHPoolDb(`/${server.slug}.sqlite3`);

    const dbFacade = createDbFacade(database, false);

    dbFacade.exec({
      sql: `
        PRAGMA locking_mode=EXCLUSIVE;
        PRAGMA foreign_keys=OFF;
        PRAGMA journal_mode=OFF;
        PRAGMA synchronous=OFF;
        PRAGMA temp_store=MEMORY;
        PRAGMA cache_size=-20000;
      `
    });

    migrateAndSeed(dbFacade, server);

    database.close();

    globalThis.postMessage({ resolved: true });
    globalThis.close();
  },
);
