import { reputationFactory } from 'app/factories/reputation-factory';
import type { PlayerFaction } from 'interfaces/models/game/player';
import type { Reputation } from 'interfaces/models/game/reputation';
import type { Server } from 'interfaces/models/game/server';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';

export type GenerateReputationsWorkerPayload = {
  server: Server;
};

export type GenerateReputationsWorkerReturn = {
  reputations: Reputation[];
};

const factions: PlayerFaction[] = ['player', 'npc1', 'npc2', 'npc3', 'npc4', 'npc5', 'npc6', 'npc7', 'npc8'];

self.addEventListener('message', async (event: MessageEvent<GenerateReputationsWorkerPayload>) => {
  const { server } = event.data;
  const reputations = factions.map((faction) => reputationFactory({ faction }));
  self.postMessage({ reputations });

  const serverHandle = await getServerHandle(server.slug);
  await writeFileContents<Reputation[]>(serverHandle, 'reputations', reputations);

  self.close();
});
