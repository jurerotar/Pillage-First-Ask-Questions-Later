import { Server } from 'interfaces/models/game/server';
import { playerFactory } from 'factories/player-factory';
import { Player, PlayerFaction } from 'interfaces/models/game/player';

export type GeneratePlayersWorkerPayload = {
  server: Server;
};

export type GeneratePlayersWorkerReturn = {
  players: Player[];
}

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

const factions: PlayerFaction[] = [
  'player', 'npc1', 'npc2', 'npc3', 'npc4'
];

self.addEventListener('message', (event: MessageEvent<GeneratePlayersWorkerPayload>) => {
  const { server } = event.data;
  const players = factions.map((faction: PlayerFaction) => playerFactory({ server, faction }))
  self.postMessage({ players });
});
