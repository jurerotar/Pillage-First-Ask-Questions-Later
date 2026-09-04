import type {
  OpfsSAHPoolDatabase,
  SAHPoolUtil,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import {
  createDbFacade,
  type DbFacade,
} from '@pillage-first/utils/facades/database';
import { retryWhenFileSystemLocked } from '@pillage-first/utils/opfs-lock-retry';

export type RenameGameWorldWorkerPayload = {
  serverId: string;
  serverSlug: string;
  name: string;
};

export type RenameGameWorldWorkerResponse =
  | { resolved: true }
  | { resolved: false; error: string };

let sqlite3: Sqlite3Static | null = null;
let opfsSahPool: SAHPoolUtil | null = null;
let database: OpfsSAHPoolDatabase | null = null;
let dbFacade: DbFacade | null = null;

globalThis.addEventListener(
  'message',
  async (event: MessageEvent<RenameGameWorldWorkerPayload>) => {
    const { serverId, serverSlug, name } = event.data;

    try {
      const { default: sqlite3InitModule } = await import(
        '@sqlite.org/sqlite-wasm'
      );

      sqlite3 ??= await sqlite3InitModule();
      const initializedSqlite3 = sqlite3;

      const opfsSahPoolOptions = {
        directory: `/pillage-first-ask-questions-later/${serverSlug}`,
        forceReinitIfPreviouslyFailed: true,
      };

      opfsSahPool = await retryWhenFileSystemLocked(() =>
        initializedSqlite3.installOpfsSAHPoolVfs(opfsSahPoolOptions),
      );

      database = new opfsSahPool.OpfsSAHPoolDb(`/${serverSlug}.sqlite3`);
      dbFacade = createDbFacade(database, false);

      dbFacade.exec({
        sql: 'UPDATE servers SET name = $name WHERE id = $serverId;',
        bind: {
          $name: name,
          $serverId: serverId,
        },
      });

      globalThis.postMessage({
        resolved: true,
      } satisfies RenameGameWorldWorkerResponse);
    } catch (error) {
      globalThis.postMessage({
        resolved: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      } satisfies RenameGameWorldWorkerResponse);
    } finally {
      dbFacade?.close();
      database?.close();
      opfsSahPool?.pauseVfs();
      globalThis.close();
    }
  },
);
