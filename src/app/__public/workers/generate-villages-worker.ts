import { OccupiedOccupiableTile, Tile } from 'interfaces/models/game/tile';
import { Village } from 'interfaces/models/game/village';
import { Server } from 'interfaces/models/game/server';
import { villageFactory } from 'factories/village-factory';
import { Player } from 'interfaces/models/game/player';

export type GenerateVillageWorkerPayload = {
  server: Server;
  tiles: Tile[];
  players: Player[];
};

export type GenerateVillageWorkerReturn = {
  villages: Village[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateVillageWorkerPayload>) => {
  const { server, tiles, players } = event.data;

  const freeTiles: OccupiedOccupiableTile[] = tiles.filter((tile) => tile.type === 'free-tile' && Object.hasOwn(tile, 'ownedBy')) as OccupiedOccupiableTile[];

  const villages: Village[] = freeTiles.map((tile) => {
    const { faction } = players.find(({ id }) => tile.ownedBy === id)!;

    const slug = faction === 'player' ? 'v-1' : tile.tileId;
    return villageFactory({ server, players, tile, slug });
  });

  self.postMessage({ villages });
});
