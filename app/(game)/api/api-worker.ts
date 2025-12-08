import { matchRoute } from 'app/(game)/api/utils/route-matcher';
import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';
import type {
  ApiNotificationEvent,
  EventApiNotificationEvent,
  WorkerInitializationErrorEvent,
} from 'app/interfaces/api';
import {
  createDbFacade,
  type DbFacade,
} from 'app/(game)/api/facades/database-facade';
import {
  cancelScheduling,
  scheduleNextEvent,
} from 'app/(game)/api/engine/scheduler';
import type { Database } from 'app/interfaces/db';
import type sqlite3InitModule from '@sqlite.org/sqlite-wasm';

type Sqlite3Module = Awaited<ReturnType<typeof sqlite3InitModule>>;
type OpfsSahPool = Awaited<ReturnType<Sqlite3Module['installOpfsSAHPoolVfs']>>;

let sqlite3: Sqlite3Module | null = null;
let opfsSahPool: OpfsSahPool | null = null;
let database: Database | null = null;
let dbFacade: DbFacade | null = null;

self.addEventListener('message', async (event: MessageEvent) => {
  const { data } = event;
  const { type } = data;

  switch (type) {
    case 'WORKER_INIT': {
      try {
        const urlParams = new URLSearchParams(self.location.search);
        const serverSlug = urlParams.get('server-slug')!;

        if (sqlite3 === null) {
          const { default: sqlite3InitModule } = await import(
            '@sqlite.org/sqlite-wasm'
          );

          sqlite3 = await sqlite3InitModule({
            locateFile: () => sqliteWasmUrl,
          });
        }

        console.log({ sqlite3 });

        opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
          directory: `/pillage-first-ask-questions-later/${serverSlug}`,
        });

        console.log({ opfsSahPool });

        database = new opfsSahPool.OpfsSAHPoolDb(`/${serverSlug}.sqlite3`);

        console.log({ database });

        dbFacade = createDbFacade(database, false);

        console.log({ dbFacade });

        scheduleNextEvent(dbFacade);

        self.postMessage({
          eventKey: 'event:worker-initialization-success',
        } satisfies ApiNotificationEvent);
        break;
      } catch (error) {
        console.error(error);
        self.postMessage({
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
        const { handler, params } = matchRoute(url, method);
        // @ts-expect-error: Not sure about this one, fix when you can
        const result = handler(database, { params, body });

        if (method !== 'GET') {
          self.postMessage({
            eventKey: 'event:worker-event-creation-success',
            ...body,
            ...params,
          } satisfies EventApiNotificationEvent);
        }

        port.postMessage({
          data: result,
        });

        break;
      } catch (error) {
        console.error(error);
        self.postMessage({
          eventKey: 'event:worker-event-creation-error',
          ...body,
        } satisfies EventApiNotificationEvent);
        break;
      }
    }
    case 'WORKER_CLOSE': {
      cancelScheduling();

      sqlite3 = null;

      dbFacade!.close();
      dbFacade = null;

      database!.close();
      database = null;

      opfsSahPool!.pauseVfs();
      opfsSahPool = null;

      self.close();
      break;
    }
  }
});
