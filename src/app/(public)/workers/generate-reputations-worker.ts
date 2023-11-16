import { Server } from 'interfaces/models/game/server';
import { Player } from 'interfaces/models/game/player';
import { Reputation } from 'interfaces/models/game/reputation';
import { reputationFactory } from 'factories/reputation-factory';

export type GenerateReputationsWorkerPayload = {
  server: Server;
  players: Player[];
};

export type GenerateReputationsWorkerReturn = {
  reputations: Reputation[];
}

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateReputationsWorkerPayload>) => {
  const { server, players } = event.data;
  const npcPlayers = players.filter(({ faction }) => faction !== 'player');
  const reputations = npcPlayers.map(({ faction }) => reputationFactory({ server, faction }))
  self.postMessage({ reputations });
});
