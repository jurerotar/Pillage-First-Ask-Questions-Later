import { OccupiedOccupiableTile } from 'interfaces/models/game/tile';
import { Village } from 'interfaces/models/game/village';
import { Server } from 'interfaces/models/game/server';
import { villageFactory } from 'app/factories/village-factory';
import { Player } from 'interfaces/models/game/player';
import { database } from 'database/database';
import { chunk } from 'lodash-es';

export type GenerateVillageWorkerPayload = {
  server: Server;
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
  players: Player[];
};

export type GenerateVillageWorkerReturn = {
  playerStartingVillage: Village;
};

self.addEventListener('message', async (event: MessageEvent<GenerateVillageWorkerPayload>) => {
  const { server, occupiedOccupiableTiles, players } = event.data;

  const userPlayer = players.find(({ faction }) => faction === 'player')!;
  const playerStartingTile = occupiedOccupiableTiles.find(({ coordinates: { x, y } }) => x === 0 && y === 0)!;
  const playerStartingVillage = villageFactory({ server, player: userPlayer, tile: playerStartingTile, slug: 'v-1' });

  // Send the player starting village asap, because it's needed in other factories
  self.postMessage({ playerStartingVillage });

  const npcOccupiedTiles = occupiedOccupiableTiles.filter(({ ownedBy }) => ownedBy !== 'player');

  const villages: Village[] = npcOccupiedTiles.map((tile) => {
    const player = players.find(({ id }) => tile.ownedBy === id)!;

    const slug = player.faction === 'player' ? 'v-1' : tile.id;
    return villageFactory({ server, player, tile, slug });
  });

  const promises = [];
  const chunkedVillages = chunk(villages, 300);

  for (let i = 0; i < chunkedVillages.length; i += 1) {
    promises.push(database.villages.bulkAdd(chunkedVillages[i]));
  }

  await Promise.all(promises);

  self.close();
});
