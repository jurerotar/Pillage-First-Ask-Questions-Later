import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { getRootHandle, writeFileContents } from 'app/utils/opfs';
import type { Server } from 'interfaces/models/game/server';

type SyncWorkerPayload = {
  serverSlug: Server['slug'];
  client: PersistedClient;
};

let isFileLocked = false;
let queuedMessage: SyncWorkerPayload | null = null;

const saveState = async () => {
  if (isFileLocked || !queuedMessage) {
    return;
  }

  const { client, serverSlug } = queuedMessage;
  queuedMessage = null;
  isFileLocked = true;
  const rootHandle = await getRootHandle();
  await writeFileContents(rootHandle, serverSlug, client);
  isFileLocked = false;

  if (queuedMessage) {
    await saveState();
  }
};

self.addEventListener('message', async (event: MessageEvent<SyncWorkerPayload>) => {
  queuedMessage = event.data;

  await saveState();
});
