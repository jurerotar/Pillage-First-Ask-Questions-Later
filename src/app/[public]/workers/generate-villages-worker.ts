import { OccupiedOccupiableTile, Tile } from 'interfaces/models/game/tile';
import { Village } from 'interfaces/models/game/village';
import { Server } from 'interfaces/models/game/server';
import { villageFactory } from 'app/factories/village-factory';
import { Player } from 'interfaces/models/game/player';
import { database } from 'database/database';
import { chunk } from 'lodash-es';

export type GenerateVillageWorkerPayload = {
  server: Server;
  tiles: Tile[];
  players: Player[];
};

export type GenerateVillageWorkerReturn = {
  villages: Village[];
};

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

self.addEventListener('message', async (event: MessageEvent<GenerateVillageWorkerPayload>) => {
  const { server, tiles, players } = event.data;

  const occupiedTiles: OccupiedOccupiableTile[] = tiles.filter(
    (tile) => tile.type === 'free-tile' && Object.hasOwn(tile, 'ownedBy')
  ) as OccupiedOccupiableTile[];

  const villages: Village[] = occupiedTiles.map((tile) => {
    const player = players.find(({ id }) => tile.ownedBy === id)!;

    const slug = player.faction === 'player' ? 'v-1' : tile.id;
    return villageFactory({ server, player, tile, slug });
  });

  self.postMessage({ villages });

  const promises = [];
  const chunkedVillages = chunk(tiles, 300);

  for (let i = 0; i < chunkedVillages.length; i += 1) {
    promises.push(database.maps.bulkAdd(chunkedVillages[i]));
  }

  await Promise.all(promises);
  self.close();
});
