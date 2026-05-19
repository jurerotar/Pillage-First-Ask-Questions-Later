import type {
  OpfsSAHPoolDatabase,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { upgradeDb } from '@pillage-first/db';
import type {
  ApiNotificationEvent,
  ControllerErrorEvent,
  DatabaseInitializationErrorEvent,
} from '@pillage-first/types/api-events';
import { env } from '@pillage-first/utils/env';
import {
  createDbFacade,
  type DbFacade,
} from '@pillage-first/utils/facades/database';
import { retryWhenFileSystemLocked } from '@pillage-first/utils/opfs-lock-retry';
import {
  parseAppVersion,
  parseDatabaseUserVersion,
} from '@pillage-first/utils/version';
import { OutdatedDatabaseSchemaError } from './errors';
import {
  postWorkerMessage,
  setNotificationPort,
  setShouldPostNotifications,
} from './notification-port';
import { matchRoute } from './routes/route-matcher';
import {
  cancelScheduling,
  initScheduler,
  scheduleNextEvent,
} from './scheduler/scheduler';
import { createSchedulerDataSource } from './scheduler/scheduler-data-source';

let sqlite3: Sqlite3Static | null = null;
let database: OpfsSAHPoolDatabase | null = null;
let dbFacade: DbFacade | null = null;

globalThis.addEventListener('message', async (event: MessageEvent) => {
  const { data } = event;
  const { type } = data;

  switch (type) {
    case 'WORKER_INIT': {
      try {
        const [port] = event.ports;

        if (!port) {
          throw new Error('Missing notification port during worker init');
        }

        setNotificationPort(port);

        const urlParams = new URLSearchParams(globalThis.location.search);
        const serverSlug = urlParams.get('server-slug')!;

        if (sqlite3 === null) {
          const { default: sqlite3InitModule } = await import(
            '@sqlite.org/sqlite-wasm'
          );

          sqlite3 = await sqlite3InitModule();
        }

        const opfsSahPoolOptions = {
          directory: `/pillage-first-ask-questions-later/${serverSlug}`,
          forceReinitIfPreviouslyFailed: true,
        };

        const initializedSqlite3 = sqlite3;

        const initializedOpfsSahPool = await retryWhenFileSystemLocked(() =>
          initializedSqlite3.installOpfsSAHPoolVfs(opfsSahPoolOptions),
        );

        // Database doesn't exist, common when opening game worlds created before the engine rewrite or when opening a deleted game world
        if (initializedOpfsSahPool.getFileCount() === 0) {
          throw new OutdatedDatabaseSchemaError();
        }

        database = new initializedOpfsSahPool.OpfsSAHPoolDb(
          `/${serverSlug}.sqlite3`,
        );

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
          throw new OutdatedDatabaseSchemaError();
        }

        const [, dbMinor] = parseDatabaseUserVersion(version);
        const [, appMinor] = parseAppVersion(env.VERSION);

        if (dbMinor !== appMinor) {
          throw new OutdatedDatabaseSchemaError();
        }

        upgradeDb(dbFacade);

        const dataSource = createSchedulerDataSource(dbFacade);

        initScheduler(dataSource);
        scheduleNextEvent(dataSource);

        postWorkerMessage(
          {
            eventKey: 'event:database-initialization-success',
          } satisfies ApiNotificationEvent,
          { force: true },
        );
        break;
      } catch (error) {
        postWorkerMessage(
          {
            eventKey: 'event:database-initialization-error',
            error: error as Error,
          } satisfies DatabaseInitializationErrorEvent,
          { force: true },
        );
        break;
      }
    }
    case 'WORKER_START_NOTIFICATION_POSTING': {
      setShouldPostNotifications(true);
      break;
    }
    case 'WORKER_STOP_NOTIFICATION_POSTING': {
      setShouldPostNotifications(false);
      break;
    }
    case 'WORKER_MESSAGE': {
      const { data, ports } = event;

      const [port] = ports;
      const { url, method, body } = data;

      try {
        const {
          controller,
          path,
          query,
          url: rawUrl,
        } = matchRoute(url, method);
        const result = controller(dbFacade!, {
          path,
          query,
          body,
          url: rawUrl,
        });

        port.postMessage({
          data: result,
        });

        break;
      } catch (error) {
        console.error(error);
        const errorEvent = {
          eventKey: 'event:error',
          error: error as Error,
        } satisfies ControllerErrorEvent;

        port.postMessage(errorEvent);
        postWorkerMessage(errorEvent);
        break;
      }
    }
    case 'WORKER_CLOSE': {
      setShouldPostNotifications(false);
      cancelScheduling();

      dbFacade!.close();
      dbFacade = null;

      database!.close();
      database = null;

      postWorkerMessage({ type: 'WORKER_CLOSE_SUCCESS' }, { force: true });
      break;
    }
  }
});
