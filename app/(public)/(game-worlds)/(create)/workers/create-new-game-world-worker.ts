import type { Server } from 'app/interfaces/models/game/server';
import { createNewServer } from 'app/(public)/(game-worlds)/(create)/utils/create-new-server';
import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';

export type CreateNewGameWorldWorkerPayload = {
  server: Server;
};

self.addEventListener(
  'message',
  async (event: MessageEvent<CreateNewGameWorldWorkerPayload>) => {
    const { default: sqlite3InitModule } = await import(
      '@sqlite.org/sqlite-wasm'
    );
    const { server } = event.data;

    const sqlite3 = await sqlite3InitModule({
      locateFile: () => sqliteWasmUrl,
    });

    const database = new sqlite3.oo1.OpfsDb(
      `/pillage-first-ask-questions-later/${server.slug}.sqlite3`,
    );

    database.exec(`
      PRAGMA locking_mode=EXCLUSIVE;
      PRAGMA foreign_keys=OFF;
      PRAGMA journal_mode=OFF;
      PRAGMA synchronous=OFF;
      PRAGMA temp_store=MEMORY;
      PRAGMA cache_size=-20000;
    `);

    createNewServer(database, server);

    database.close();

    self.postMessage({ resolved: true });
    self.close();
  },
);
