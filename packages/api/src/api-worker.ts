import type {
  OpfsSAHPoolDatabase,
  SAHPoolUtil,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { upgradeDb } from '@pillage-first/db';
import type {
  ApiNotificationEvent,
  ControllerErrorEvent,
  DatabaseInitializationErrorEvent,
  EventApiNotificationEvent,
} from '@pillage-first/types/api-events';
import { env } from '@pillage-first/utils/env';
import {
  createDbFacade,
  type DbFacade,
} from '@pillage-first/utils/facades/database';
import {
  parseAppVersion,
  parseDatabaseUserVersion,
} from '@pillage-first/utils/version';
import { DatabaseInitializationError } from './errors';
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
          throw new DatabaseInitializationError();
        }

        database = new opfsSahPool.OpfsSAHPoolDb(`/${serverSlug}.sqlite3`);

        dbFacade = createDbFacade(database, false);

        dbFacade.exec({
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

        const version = dbFacade.selectValue({
          sql: 'PRAGMA user_version',
          schema: z.number().nullable(),
        });

        // TODO: This check can be removed in a couple of weeks, since all newly-created game worlds will have user_version
        if (!version) {
          throw new DatabaseInitializationError();
        }

        const [, dbMinor] = parseDatabaseUserVersion(version);
        const [, appMinor] = parseAppVersion(env.VERSION);

        if (dbMinor !== appMinor) {
          throw new DatabaseInitializationError();
        }

        upgradeDb(dbFacade);

        const dataSource = createSchedulerDataSource(dbFacade);

        initScheduler(dataSource);
        scheduleNextEvent(dataSource);

        globalThis.postMessage({
          eventKey: 'event:database-initialization-success',
        } satisfies ApiNotificationEvent);
        break;
      } catch (error) {
        globalThis.postMessage({
          eventKey: 'event:database-initialization-error',
          error: error as Error,
        } satisfies DatabaseInitializationErrorEvent);
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
            eventKey: 'event:controller-success',
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
        port.postMessage({
          eventKey: 'event:controller-error',
          error: error as Error,
        } satisfies ControllerErrorEvent);
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
