import { Server } from 'interfaces/models/game/server';
import { PlayerFaction } from 'interfaces/models/game/player';
import { Reputation } from 'interfaces/models/game/reputation';
import { reputationFactory } from 'factories/reputation-factory';

export type GenerateReputationsWorkerPayload = {
  server: Server;
};

export type GenerateReputationsWorkerReturn = {
  reputations: Reputation[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

const factions: PlayerFaction[] = ['player', 'npc1', 'npc2', 'npc3', 'npc4', 'npc5', 'npc6', 'npc7', 'npc8'];

self.addEventListener('message', (event: MessageEvent<GenerateReputationsWorkerPayload>) => {
  const { server } = event.data;
  const reputations = factions.map((faction) =>
    reputationFactory({
      server,
      faction,
    })
  );
  self.postMessage({ reputations });
});
