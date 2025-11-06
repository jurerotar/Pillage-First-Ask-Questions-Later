import type { Server } from 'app/interfaces/models/game/server';
import { createNewServer } from 'app/(public)/(create-new-server)/workers/utils/create-new-server';

export type CreateServerWorkerPayload = {
  server: Server;
};

self.addEventListener(
  'message',
  async (event: MessageEvent<CreateServerWorkerPayload>) => {
    const { default: sqlite3InitModule } = await import(
      '@sqlite.org/sqlite-wasm'
    );

    const { server } = event.data;

    const sqlite3 = await sqlite3InitModule();
    const opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
      directory: `/pillage-first-ask-questions-later/${server.slug}`,
    });
    const opfsDb = new opfsSahPool.OpfsSAHPoolDb(`/${server.slug}.sqlite3`);

    opfsDb.exec(`
      PRAGMA locking_mode=EXCLUSIVE;
      PRAGMA foreign_keys=OFF;
      PRAGMA journal_mode=OFF;
      PRAGMA synchronous=OFF;
      PRAGMA temp_store=MEMORY;
      PRAGMA cache_size=-20000;
    `);

    createNewServer(opfsDb, server);

    opfsDb.close();

    self.postMessage({ resolved: true });
    self.close();
  },
);
