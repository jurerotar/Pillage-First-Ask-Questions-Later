import type { PersistedClient } from '@tanstack/react-query-persist-client';
import type { Server } from 'app/interfaces/models/game/server';
import { getRootHandle, writeFileContents } from 'app/utils/opfs';

type SyncWorkerPayload = {
  serverSlug: Server['slug'];
  client: PersistedClient;
};

let isFileLocked = false;
let queuedMessage: SyncWorkerPayload | null = null;
let rootHandle: FileSystemDirectoryHandle | null = null;

const saveState = async () => {
  if (isFileLocked || !queuedMessage) {
    return;
  }

  const { client, serverSlug } = queuedMessage;
  queuedMessage = null;
  isFileLocked = true;

  if (!rootHandle) {
    rootHandle = await getRootHandle();
  }

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
