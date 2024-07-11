import type { OPFSFileName } from 'interfaces/models/common';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';
import { hydrate, QueryClient } from '@tanstack/react-query';

export const queryKeysToIncludeInFullSync: OPFSFileName[] = ['troops', 'events', 'villages', 'reputations', 'effects'];

type SyncWorkerIndividualSyncPayload = {
  type: 'individual-sync';
  name: OPFSFileName;
  data: unknown;
};

type SyncWorkerFullSyncPayload = {
  type: 'full-sync';
  gameState: string;
};

type SyncWorkerPayload = SyncWorkerIndividualSyncPayload | SyncWorkerFullSyncPayload;

export type SyncWorkerType = Worker & {
  postMessage: (args: SyncWorkerPayload) => void;
};

self.addEventListener('message', async (event: MessageEvent<SyncWorkerPayload>) => {
  const { type } = event.data;

  const url = new URL(self.location.href);
  const params = new URLSearchParams(url.search);
  const serverId = params.get('server-id')!;

  const serverSlug = `s-${serverId.substring(0, 4)}`;

  const serverHandle = await getServerHandle(serverSlug);

  // Used for stuff like map filters change, hero attribute change,...
  if (type === 'individual-sync') {
    const { name, data } = event.data;
    await writeFileContents(serverHandle, name, data);
  }

  // Used for app-wide data sync, basically so we don't have to do it individually
  else if (type === 'full-sync') {
    const { gameState } = event.data;

    const queryClient = new QueryClient();
    const dehydratedState = JSON.parse(gameState);
    hydrate(queryClient, dehydratedState);

    const queries = queryClient.getQueryCache().getAll();
    for await (const { queryKey } of queries) {
      const key = queryKey.join('') as OPFSFileName;
      if (queryKeysToIncludeInFullSync.includes(key)) {
        await writeFileContents(serverHandle, key, queryClient.getQueryData(queryKey));
      }
    }
  }
});
