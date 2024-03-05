import { Server } from 'interfaces/models/game/server';
import { mapFactory } from 'app/[game]/factories/map-factory';
import { Tile } from 'interfaces/models/game/tile';
import { Player } from 'interfaces/models/game/player';

export type GenerateWorldMapWorkerPayload = {
  server: Server;
  players: Player[];
};

export type GenerateWorldMapWorkerReturn = {
  tiles: Tile[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateWorldMapWorkerPayload>) => {
  const { server, players } = event.data;
  const tiles = mapFactory({ server, players });
  self.postMessage({ tiles });
  self.close();
});
