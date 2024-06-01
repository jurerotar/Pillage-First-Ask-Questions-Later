import { type DehydratedState, hydrate, QueryClient } from '@tanstack/react-query';
import type { OPFSFileName } from 'interfaces/models/common';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';

type SyncWorkerIndividualSyncPayload = {
  type: 'individual-sync';
  name: OPFSFileName;
  data: unknown;
};

type SyncWorkerFullSyncPayload = {
  type: 'full-sync';
  dehydratedState: DehydratedState;
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

  // Used for stuff like map filters change, hero attribute change,...
  if (type === 'individual-sync') {
    const { name, data } = event.data;
    const serverHandle = await getServerHandle(serverSlug);
    await writeFileContents(serverHandle, name, data);
  }

  // Used for app-wide data sync, basically so we don't have to do it individually
  else if (type === 'full-sync') {
    const { dehydratedState } = event.data;
    const queryClient = new QueryClient();
    hydrate(queryClient, dehydratedState);

    const _serverHandle = await getServerHandle(serverSlug);
  }
});
