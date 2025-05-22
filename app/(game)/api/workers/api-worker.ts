import { hydrate, QueryClient } from '@tanstack/react-query';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { routes } from 'app/(game)/api/routes';

const urlParams = new URLSearchParams(self.location.search);
const serverSlug = urlParams.get('server-slug')!;

const queryClient = new QueryClient();
const rootHandle = await getRootHandle();
const serverState = await getParsedFileContents<PersistedClient>(rootHandle, serverSlug!);
hydrate(queryClient, serverState.clientState);

type ApiWorkerMessageParams = {
  url: keyof typeof routes;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body: unknown;
};

self.addEventListener('message', async ({ data, ports }: MessageEvent<ApiWorkerMessageParams>) => {
  const [port] = ports;
  const { url, method, body } = data;

  const route = routes[url];

  const handler = route[method as keyof typeof route];
  // @ts-expect-error
  const response = await handler(queryClient, body);

  port.postMessage({
    data: response,
  });
});
