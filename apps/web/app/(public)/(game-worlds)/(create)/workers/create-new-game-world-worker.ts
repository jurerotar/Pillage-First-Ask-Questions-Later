import type {
  OpfsSAHPoolDatabase,
  SAHPoolUtil,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import { migrateAndSeed } from '@pillage-first/db';
import type { Server } from '@pillage-first/types/models/server';
import { env } from '@pillage-first/utils/env';
import {
  createDbFacade,
  type DbFacade,
} from '@pillage-first/utils/facades/database';
import { encodeAppVersionToDatabaseUserVersion } from '@pillage-first/utils/version';

export type CreateNewGameWorldWorkerPayload = {
  server: Server;
  port: MessagePort;
};

export type CreateNewGameWorldWorkerResponse =
  | {
      type: 'progress';
    }
  | {
      type: 'result';
      migrationDuration: number;
    };

let sqlite3: Sqlite3Static | null = null;
let opfsSahPool: SAHPoolUtil | null = null;
let database: OpfsSAHPoolDatabase | null = null;
let dbFacade: DbFacade | null = null;

globalThis.addEventListener(
  'message',
  async (event: MessageEvent<CreateNewGameWorldWorkerPayload>) => {
    const { server, port } = event.data;

    try {
      const { default: sqlite3InitModule } = await import(
        '@sqlite.org/sqlite-wasm'
      );

      sqlite3 ??= await sqlite3InitModule();

      opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
        directory: `/pillage-first-ask-questions-later/${server.slug}`,
      });

      database = new opfsSahPool.OpfsSAHPoolDb(`/${server.slug}.sqlite3`);

      dbFacade = createDbFacade(database, false);

      dbFacade.exec({
        sql: `
        PRAGMA user_version=${encodeAppVersionToDatabaseUserVersion(env.VERSION)};
        PRAGMA locking_mode=EXCLUSIVE;
        PRAGMA foreign_keys=OFF;
        PRAGMA journal_mode=OFF;
        PRAGMA synchronous=OFF;
        PRAGMA temp_store=MEMORY;
        PRAGMA cache_size=-20000;
      `,
      });

      const migrationDuration = migrateAndSeed(dbFacade, server, () => {
        port.postMessage({
          type: 'progress',
        } satisfies CreateNewGameWorldWorkerResponse);
      });

      port.postMessage({
        type: 'result',
        migrationDuration,
      } satisfies CreateNewGameWorldWorkerResponse);
    } finally {
      dbFacade?.close();
      database?.close();
      opfsSahPool?.pauseVfs();
      port.close();
      globalThis.close();
    }
  },
);
