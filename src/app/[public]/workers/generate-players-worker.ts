import { Server } from 'interfaces/models/game/server';
import { playerFactory } from 'app/[game]/factories/player-factory';
import { Player, PlayerFaction } from 'interfaces/models/game/player';
import { seededRandomArrayElement } from 'app/utils/common';

export type GeneratePlayersWorkerPayload = {
  server: Server;
  factions: PlayerFaction[];
};

export type GeneratePlayersWorkerReturn = {
  players: Player[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

const PLAYER_COUNT = 50;

self.addEventListener('message', (event: MessageEvent<GeneratePlayersWorkerPayload>) => {
  const { server, factions } = event.data;
  const players = [...Array(PLAYER_COUNT)].map((_, index) => {
    const faction = seededRandomArrayElement<PlayerFaction>(server.id, factions);
    return playerFactory({ server, faction, index });
  });

  self.postMessage({ players });
});
