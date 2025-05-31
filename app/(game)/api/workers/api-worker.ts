import { dehydrate, type DehydratedState, hydrate, QueryClient } from '@tanstack/react-query';
import { getParsedFileContents, getRootHandle, writeFileContents } from 'app/utils/opfs';
import { matchRoute } from 'app/(game)/api/utils/route-matcher';
import { scheduleNextEvent } from 'app/(game)/api/utils/event-resolvers';
import type { ApiNotificationEvent } from 'app/interfaces/api';
import { eventWorkerReadyKey } from 'app/(game)/keys/event-keys';

const urlParams = new URLSearchParams(self.location.search);
const serverSlug = urlParams.get('server-slug')!;

const queryClient = new QueryClient();
const rootHandle = await getRootHandle();
const serverState = await getParsedFileContents<DehydratedState>(rootHandle, serverSlug!);
hydrate(queryClient, serverState);

await scheduleNextEvent(queryClient);

self.postMessage({ eventKey: eventWorkerReadyKey } satisfies ApiNotificationEvent);

self.addEventListener('message', async ({ data, ports }: MessageEvent) => {
  const [port] = ports;
  const { url, method, body } = data;

  try {
    const { handler, params } = matchRoute(url, method)!;
    // @ts-expect-error: Not sure about this one, fix when you can
    const result = await handler(queryClient, { params, body });

    port.postMessage({
      data: result,
    });

    if (method !== 'GET') {
      await writeFileContents(rootHandle, serverSlug, dehydrate(queryClient));
    }
  } catch (_error) {
    console.error(`Path "${method}@${url}" was not matched to any api routes`);
    return;
  }
});
