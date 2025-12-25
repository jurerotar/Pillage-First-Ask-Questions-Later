import {
  type DehydratedState,
  dehydrate,
  hydrate,
  QueryClient,
} from '@tanstack/react-query';
import { serverCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Server } from 'app/interfaces/models/game/server';
import { getRootHandle, writeFileContents } from 'app/utils/opfs';

export type ImportGameWorldWorkerPayload = {
  fileText: string;
};

export type ImportGameWorldWorkerResponse =
  | {
      resolved: true;
      serverSlug: Server['slug'];
      server: Server;
    }
  | {
      resolved: false;
      error: string;
    };

self.addEventListener(
  'message',
  async (event: MessageEvent<ImportGameWorldWorkerPayload>) => {
    const { fileText } = event.data;

    let dehydratedState: DehydratedState;
    const queryClient = new QueryClient();

    try {
      // Parse uploaded JSON into DehydratedState and hydrate a QueryClient
      dehydratedState = JSON.parse(fileText) satisfies DehydratedState;
      hydrate(queryClient, dehydratedState);
    } catch {
      self.postMessage({
        resolved: false,
        error: 'Corrupted or incompatible file. Failed to load game state.',
      } satisfies ImportGameWorldWorkerResponse);
      self.close();
      return;
    }

    const server = queryClient.getQueryData<Server>([serverCacheKey]);

    if (!server) {
      self.postMessage({
        resolved: false,
        error: 'Invalid import file: missing server state',
      } satisfies ImportGameWorldWorkerResponse);
      self.close();
      return;
    }

    queryClient.setQueryData<Server>([serverCacheKey], (server) => {
      const id = crypto.randomUUID();
      const slug = `s-${id.substring(0, 4)}`;

      server!.id = id;
      server!.slug = slug;

      return server;
    });

    // Write imported state to OPFS under (possibly updated) server slug
    const rootHandle = await getRootHandle();
    await writeFileContents(rootHandle, server.slug, dehydrate(queryClient));

    self.postMessage({
      resolved: true,
      serverSlug: server.slug,
      server,
    } satisfies ImportGameWorldWorkerResponse);

    self.close();
  },
);
