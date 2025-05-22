import { hydrate, QueryClient } from '@tanstack/react-query';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { matchRoute } from 'app/(game)/api/utils/route-matcher';

const urlParams = new URLSearchParams(self.location.search);
const serverSlug = urlParams.get('server-slug')!;

const queryClient = new QueryClient();
const rootHandle = await getRootHandle();
const serverState = await getParsedFileContents<PersistedClient>(rootHandle, serverSlug!);
hydrate(queryClient, serverState.clientState);

self.addEventListener('message', async ({ data, ports }: MessageEvent) => {
  const [port] = ports;
  const { url, method, body } = data;

  const { handler, params } = matchRoute(url, method)!;
  // @ts-expect-error: Not sure about this one, fix when you can
  const response = await handler(queryClient, { params, body });

  port.postMessage({
    data: response,
  });
});
