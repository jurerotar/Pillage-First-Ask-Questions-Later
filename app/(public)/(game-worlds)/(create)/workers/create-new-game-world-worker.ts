import type { Server } from 'app/interfaces/models/game/server';
import { getRootHandle, writeFileContents } from 'app/utils/opfs';
import { initializeServer } from 'app/(public)/(game-worlds)/(create)/utils/create-new-server';
import { dehydrate } from '@tanstack/react-query';

export type CreateNewGameWorldWorkerPayload = {
  server: Server;
};

self.addEventListener(
  'message',
  async (event: MessageEvent<CreateNewGameWorldWorkerPayload>) => {
    const { server } = event.data;

    const serverState = await initializeServer(server);

    const rootHandle = await getRootHandle();

    await writeFileContents(rootHandle, server.slug, dehydrate(serverState));

    self.postMessage({ resolved: true });
    self.close();
  },
);
