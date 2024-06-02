import type { Server } from 'interfaces/models/game/server';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';

export type GenerateServerWorkerPayload = {
  server: Server;
};

export type GenerateServerWorkerReturn = {
  server: Server;
};

self.addEventListener('message', async (event: MessageEvent<GenerateServerWorkerPayload>) => {
  const { server } = event.data;

  const serverHandle = await getServerHandle(server.slug);
  await writeFileContents<Server>(serverHandle, 'server', server);

  self.postMessage({ server });

  self.close();
});
