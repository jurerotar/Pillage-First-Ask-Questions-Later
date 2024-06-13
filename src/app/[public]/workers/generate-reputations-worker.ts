import { generateReputations } from 'app/factories/reputation-factory';
import type { Reputation } from 'interfaces/models/game/reputation';
import type { Server } from 'interfaces/models/game/server';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';

export type GenerateReputationsWorkerPayload = {
  server: Server;
};

export type GenerateReputationsWorkerReturn = {
  reputations: Reputation[];
};

self.addEventListener('message', async (event: MessageEvent<GenerateReputationsWorkerPayload>) => {
  const { server } = event.data;

  const reputations = generateReputations();

  self.postMessage({ reputations });

  const serverHandle = await getServerHandle(server.slug);
  await writeFileContents<Reputation[]>(serverHandle, 'reputations', reputations);

  self.close();
});
