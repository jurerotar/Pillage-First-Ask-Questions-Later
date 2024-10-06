import type { DehydratedState } from '@tanstack/react-query';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import type { Server } from 'app/interfaces/models/game/server';
import { getRootHandle, writeFileContents } from 'app/utils/opfs';

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
