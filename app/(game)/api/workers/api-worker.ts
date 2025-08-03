import {
  dehydrate,
  type DehydratedState,
  hydrate,
  QueryClient,
} from '@tanstack/react-query';
import {
  enqueueWrite,
  getParsedFileContents,
  getRootHandle,
  writeFileContents,
} from 'app/utils/opfs';
import { matchRoute } from 'app/(game)/api/utils/route-matcher';
import { scheduleNextEvent } from 'app/(game)/api/utils/event-resolvers';
import type {
  ApiNotificationEvent,
  EventApiNotificationEvent,
  WorkerInitializationErrorEvent,
} from 'app/interfaces/api';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

try {
  const urlParams = new URLSearchParams(self.location.search);
  const serverSlug = urlParams.get('server-slug')!;

  const sqlite3 = await sqlite3InitModule();
  const database = new sqlite3.oo1.OpfsDb(
    `/pillage-first-ask-questions-later/${serverSlug}.sqlite3`,
    'w',
  );

  const queryClient = new QueryClient();
  const rootHandle = await getRootHandle();
  const serverState = await getParsedFileContents<DehydratedState>(
    rootHandle,
    serverSlug!,
  );
  hydrate(queryClient, serverState);

  queryClient.getQueryCache().subscribe(({ type }) => {
    if (type !== 'updated') {
      return;
    }
    enqueueWrite(() =>
      writeFileContents(rootHandle, serverSlug, dehydrate(queryClient)),
    );
  });

  await scheduleNextEvent(queryClient, database);

  self.addEventListener('message', async ({ data, ports }: MessageEvent) => {
    const [port] = ports;
    const { url, method, body } = data;

    try {
      const { handler, params } = matchRoute(url, method)!;
      // @ts-expect-error: Not sure about this one, fix when you can
      const result = await handler(queryClient, database, { params, body });

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
