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
import {
  broadcast,
  broadcastChannel,
  setBroadcastChannel,
} from './broadcast/broadcast.ts';
import { DatabaseInitializationError } from './errors';
import { matchRoute } from './routes/route-matcher.ts';
import {
  cancelScheduling,
  initScheduler,
  scheduleNextEvent,
} from './scheduler/scheduler';
import { createSchedulerDataSource } from './scheduler/scheduler-data-source';

let sqlite3: Sqlite3Static | null = null;
let opfsSahPool: SAHPoolUtil | null = null;
let database: OpfsSAHPoolDatabase | null = null;
let dbFacade: DbFacade | null = null;
let isActuallyTheLockHolder = false;

const handleMessage = async (event: MessageEvent) => {
  const { data } = event;
  const { type } = data;

  switch (type) {
    case 'WORKER_INIT': {
      try {
        const urlParams = new URLSearchParams(globalThis.location.search);
        const serverSlug = urlParams.get('server-slug')!;

        if (!broadcastChannel) {
          setBroadcastChannel(new BroadcastChannel(`api-worker-${serverSlug}`));
        }

        const isLockHeld = await new Promise<boolean>((resolve) => {
          const timeout = setTimeout(
            () => {
              broadcastChannel?.removeEventListener('message', listener);
              resolve(false);
            },
            250 + Math.random() * 250,
          ); // Randomized timeout to reduce collision probability

          const listener = (event: MessageEvent) => {
            if (event.data.type === 'DB_LOCK_HELD') {
              clearTimeout(timeout);
              broadcastChannel?.removeEventListener('message', listener);
              resolve(true);
            }
          };

          broadcastChannel?.addEventListener('message', listener);
          broadcastChannel?.postMessage({ type: 'DB_LOCK_REQUEST' });
        });

        broadcastChannel!.onmessage = (event) => {
          if (
            event.data.type === 'DB_LOCK_REQUEST' &&
            isActuallyTheLockHolder
          ) {
            broadcastChannel?.postMessage({ type: 'DB_LOCK_HELD' });
          }

          if (event.data.type === 'DB_EXEC' && isActuallyTheLockHolder) {
            dbFacade?.exec(event.data.args);
          }

          if (
            event.data.type === 'WORKER_MESSAGE_PROXY' &&
            isActuallyTheLockHolder
          ) {
            const { requestId, data } = event.data;
            const { url, method, body } = data;
            try {
              const { controller, path, query } = matchRoute(url, method);
              const result = controller(dbFacade!, { path, query, body });

              broadcastChannel?.postMessage({
                type: 'WORKER_MESSAGE_RESPONSE',
                requestId,
                result,
              });
            } catch (error) {
              broadcastChannel?.postMessage({
                type: 'WORKER_MESSAGE_RESPONSE',
                requestId,
                error,
              });
            }
          }

          if (
            event.data.eventKey === 'event:controller-success' ||
            event.data.eventKey === 'event:event-resolve-success' ||
            event.data.eventKey === 'event:event-resolve-error'
          ) {
            globalThis.postMessage(event.data);
          }
        };

        if (isLockHeld) {
          const response = {
            eventKey: 'event:database-initialization-success',
          } satisfies ApiNotificationEvent;

          globalThis.postMessage(response);
          break;
        }

        isActuallyTheLockHolder = true;
        broadcastChannel?.postMessage({ type: 'DB_LOCK_HELD' });

        if (sqlite3 === null) {
          const { default: sqlite3InitModule } = await import(
            '@sqlite.org/sqlite-wasm'
          );

          sqlite3 = await sqlite3InitModule();
        }

        if (database === null) {
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
        }

        const response = {
          eventKey: 'event:database-initialization-success',
        } satisfies ApiNotificationEvent;

        globalThis.postMessage(response);
        break;
      } catch (error) {
        const response = {
          eventKey: 'event:database-initialization-error',
          error: error as Error,
        } satisfies DatabaseInitializationErrorEvent;

        globalThis.postMessage(response);
        break;
      }
    }
    case 'WORKER_MESSAGE': {
      const { data, ports: eventPorts } = event;

      const [replyPort] = eventPorts;
      const { url, method, body } = data;

      if (!isActuallyTheLockHolder) {
        const requestId = crypto.randomUUID();
        const listener = (event: MessageEvent) => {
          if (
            event.data.type === 'WORKER_MESSAGE_RESPONSE' &&
            event.data.requestId === requestId
          ) {
            broadcastChannel?.removeEventListener('message', listener);
            if (event.data.error) {
              replyPort.postMessage({
                eventKey: 'event:controller-error',
                error: event.data.error,
              } satisfies ControllerErrorEvent);
            } else {
              replyPort.postMessage({
                data: event.data.result,
              });
            }
          }
        };

        broadcastChannel?.addEventListener('message', listener);
        broadcastChannel?.postMessage({
          type: 'WORKER_MESSAGE_PROXY',
          requestId,
          data,
        });
        break;
      }

      try {
        const { controller, path, query } = matchRoute(url, method);
        const result = controller(dbFacade!, { path, query, body });

        if (method !== 'GET') {
          broadcast({
            eventKey: 'event:controller-success',
            ...body,
            ...path,
          } satisfies EventApiNotificationEvent);
        }

        replyPort.postMessage({
          data: result,
        });

        break;
      } catch (error) {
        console.error(error);
        replyPort.postMessage({
          eventKey: 'event:controller-error',
          error: error as Error,
        } satisfies ControllerErrorEvent);
        break;
      }
    }
    case 'WORKER_CLOSE': {
      cancelScheduling();

      dbFacade?.close();
      dbFacade = null;

      database?.close();
      database = null;

      broadcastChannel?.close();
      setBroadcastChannel(null);

      globalThis.postMessage({ type: 'WORKER_CLOSE_SUCCESS' });
      break;
    }
  }
};

globalThis.addEventListener('message', async (event: MessageEvent) => {
  await handleMessage(event);
});
