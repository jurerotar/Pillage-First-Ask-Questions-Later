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
import type { ApiNotificationEvent } from 'app/interfaces/api';

const urlParams = new URLSearchParams(self.location.search);
const serverSlug = urlParams.get('server-slug')!;

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

await scheduleNextEvent(queryClient);

self.postMessage({
  eventKey: 'event:worker-ready',
} satisfies ApiNotificationEvent);

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
  } catch (_error) {
    console.error(_error);
    return;
  }
});
