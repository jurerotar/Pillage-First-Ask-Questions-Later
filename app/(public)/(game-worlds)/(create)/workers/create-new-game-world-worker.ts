import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';
import { createNewServer } from 'app/(public)/(game-worlds)/(create)/utils/create-new-server';
import type { Server } from 'app/interfaces/models/game/server';

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

    const sqlite3 = await sqlite3InitModule({
      locateFile: () => sqliteWasmUrl,
    });
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

    globalThis.postMessage({ resolved: true });
    globalThis.close();
  },
);
