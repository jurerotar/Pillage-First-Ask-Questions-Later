import type { OpfsSAHPoolDatabase, SAHPoolUtil } from '@sqlite.org/sqlite-wasm';
import { migrateAndSeed } from '@pillage-first/api/db';
import type { Server } from '@pillage-first/types/models/server';
import { env } from '@pillage-first/utils/env';
import {
  createDbFacade,
  type DbFacade,
  type OpfsSahPoolOptions,
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
    }
  | {
      type: 'error';
      message: string;
      stack?: string;
    };

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

      const sqlite3 = await sqlite3InitModule();

      const opfsSahPoolOptions: OpfsSahPoolOptions = {
        directory: `/pillage-first-ask-questions-later/${server.slug}`,
        preserveOnInitFailure: true,
      };

      opfsSahPool = await sqlite3.installOpfsSAHPoolVfs(opfsSahPoolOptions);

      database = new opfsSahPool.OpfsSAHPoolDb(`/${server.slug}.sqlite3`);

      dbFacade = createDbFacade(database);

      dbFacade.execMulti({
        sql: `
          -- Set the page size before the first write to the new database.
          PRAGMA page_size = 16384;
          PRAGMA locking_mode = EXCLUSIVE;
          PRAGMA foreign_keys = OFF;
          PRAGMA journal_mode = DELETE;
          PRAGMA synchronous = FULL;
          PRAGMA temp_store = MEMORY;
          PRAGMA cache_size = -16384;
          PRAGMA user_version = ${encodeAppVersionToDatabaseUserVersion(env.VERSION)};
        `,
      });

      migrateAndSeed(dbFacade, server, () => {
        port.postMessage({
          type: 'progress',
        } satisfies CreateNewGameWorldWorkerResponse);
      });

      port.postMessage({
        type: 'result',
      } satisfies CreateNewGameWorldWorkerResponse);
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error('Unknown error happened while creating game world');

      port.postMessage({
        type: 'error',
        message: normalizedError.message,
        stack: normalizedError.stack,
      } satisfies CreateNewGameWorldWorkerResponse);
    } finally {
      dbFacade?.close();
      database?.close();
      opfsSahPool?.pauseVfs();
      port.close();
      globalThis.close();
    }
  },
  { once: true },
);
