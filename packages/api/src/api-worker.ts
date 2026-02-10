import type {
  OpfsSAHPoolDatabase,
  SAHPoolUtil,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import type {
  ApiNotificationEvent,
  EventApiNotificationEvent,
  WorkerInitializationErrorEvent,
} from '@pillage-first/types/api-events';
import {
  createDbFacade,
  type DbFacade,
} from '@pillage-first/utils/facades/database';
import { DatabaseNotFoundError } from './errors';
import {
  cancelScheduling,
  initScheduler,
  scheduleNextEvent,
} from './scheduler/scheduler';
import { createSchedulerDataSource } from './scheduler/scheduler-data-source';
import { matchRoute } from './utils/route-matcher';

let sqlite3: Sqlite3Static | null = null;
let opfsSahPool: SAHPoolUtil | null = null;
let database: OpfsSAHPoolDatabase | null = null;
let dbFacade: DbFacade | null = null;

globalThis.addEventListener('message', async (event: MessageEvent) => {
  const { data } = event;
  const { type } = data;

  switch (type) {
    case 'WORKER_INIT': {
      try {
        const urlParams = new URLSearchParams(globalThis.location.search);
        const serverSlug = urlParams.get('server-slug')!;

        if (sqlite3 === null) {
          const { default: sqlite3InitModule } = await import(
            '@sqlite.org/sqlite-wasm'
          );

          sqlite3 = await sqlite3InitModule();
        }

        opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
          directory: `/pillage-first-ask-questions-later/${serverSlug}`,
        });

        // Database doesn't exist, common when opening game worlds created before the engine rewrite or when opening a deleted game world
        if (opfsSahPool.getFileCount() === 0) {
          throw new DatabaseNotFoundError();
        }

        database = new opfsSahPool.OpfsSAHPoolDb(`/${serverSlug}.sqlite3`);

        database.exec({
          sql: `
          PRAGMA foreign_keys = ON;        -- keep referential integrity
          PRAGMA locking_mode = EXCLUSIVE; -- single-writer optimization
          PRAGMA journal_mode = OFF;       -- fastest; no rollback journal
          PRAGMA synchronous = OFF;        -- don't wait for OS to flush (fast, risky)
          PRAGMA temp_store = MEMORY;      -- temp tables + indices kept in RAM
          PRAGMA cache_size = -20000;      -- negative = KB, so -20000 => 20 MB cache
          PRAGMA secure_delete = OFF;      -- faster deletes (don't overwrite freed pages)
          PRAGMA wal_autocheckpoint = 0;   -- no WAL checkpointing (noop unless WAL used)
        `,
        });

        dbFacade = createDbFacade(database, false);

        const dataSource = createSchedulerDataSource(dbFacade);

        initScheduler(dataSource);
        scheduleNextEvent(dataSource);

        globalThis.postMessage({
          eventKey: 'event:worker-initialization-success',
        } satisfies ApiNotificationEvent);
        break;
      } catch (error) {
        globalThis.postMessage({
          eventKey: 'event:worker-initialization-error',
          error: error as Error,
        } satisfies WorkerInitializationErrorEvent);
        break;
      }
    }
    case 'WORKER_MESSAGE': {
      const { data, ports } = event;

      const [port] = ports;
      const { url, method, body } = data;

      try {
        const { controller, path, query } = matchRoute(url, method);
        const result = controller(dbFacade!, { path, query, body });

        if (method !== 'GET') {
          globalThis.postMessage({
            eventKey: 'event:worker-event-creation-success',
            ...body,
            ...path,
          } satisfies EventApiNotificationEvent);
        }

        port.postMessage({
          data: result,
        });

        break;
      } catch (error) {
        console.error(error);
        globalThis.postMessage({
          eventKey: 'event:worker-event-creation-error',
          ...body,
        } satisfies EventApiNotificationEvent);
        break;
      }
    }
    case 'WORKER_CLOSE': {
      cancelScheduling();

      dbFacade!.close();
      dbFacade = null;

      database!.close();
      database = null;

      globalThis.postMessage({ type: 'WORKER_CLOSE_SUCCESS' });
      break;
    }
  }
});
