import { matchRoute } from 'app/(game)/api/utils/route-matcher';
import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';
import type {
  ApiNotificationEvent,
  EventApiNotificationEvent,
  WorkerInitializationErrorEvent,
} from 'app/interfaces/api';
import { createDbFacade } from 'app/(game)/api/facades/database-facade';
import {
  cancelScheduling,
  scheduleNextEvent,
} from 'app/(game)/api/engine/scheduler';

const { default: sqlite3InitModule } = await import('@sqlite.org/sqlite-wasm');

try {
  const urlParams = new URLSearchParams(self.location.search);
  const serverSlug = urlParams.get('server-slug')!;

  const sqlite3 = await sqlite3InitModule({
    locateFile: () => sqliteWasmUrl,
  });
  const opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
    directory: `/pillage-first-ask-questions-later/${serverSlug}`,
  });

  console.log('isPaused', opfsSahPool.isPaused(), { opfsSahPool });
  const opfsDb = new opfsSahPool.OpfsSAHPoolDb(`/${serverSlug}.sqlite3`);

  const database = createDbFacade(opfsDb, false);

  scheduleNextEvent(database);

  self.addEventListener('message', (event: MessageEvent) => {
    const { data, ports } = event;
    const { type } = data;

    if (type !== 'WORKER_MESSAGE') {
      return;
    }

    event.stopImmediatePropagation();

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
    } catch (error) {
      console.error(error);
      self.postMessage({
        eventKey: 'event:worker-event-creation-error',
        ...body,
      } satisfies EventApiNotificationEvent);
      return;
    }
  });

  self.addEventListener('message', (event: MessageEvent) => {
    const { data } = event;
    const { type } = data;

    if (type !== 'WORKER_CLOSE') {
      return;
    }

    event.stopImmediatePropagation();

    cancelScheduling();
    database.close();
    opfsDb.close();
    self.close();
  });

  self.postMessage({
    eventKey: 'event:worker-initialization-success',
  } satisfies ApiNotificationEvent);
} catch (error: unknown) {
  console.error(error);
  self.postMessage({
    eventKey: 'event:worker-initialization-error',
    error: error as Error,
  } satisfies WorkerInitializationErrorEvent);
}
