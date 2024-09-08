import type { PersistedClient } from '@tanstack/query-persist-client-core';
import type { DehydratedState } from '@tanstack/react-query';
import { getRootHandle, writeFileContents } from 'app/utils/opfs';
import type { Server } from 'interfaces/models/game/server';

export type CreateServerWorkerPayload = {
  server: Server;
  dehydratedState: DehydratedState;
};

self.addEventListener('message', async (event: MessageEvent<CreateServerWorkerPayload>) => {
  const { dehydratedState, server } = event.data;

  const rootHandle = await getRootHandle();

  const persistedClient: PersistedClient = {
    clientState: dehydratedState,
    timestamp: Date.now(),
    buster: '',
  };

  await writeFileContents(rootHandle, server.slug, persistedClient);

  self.postMessage({ resolved: true });
  self.close();
});
