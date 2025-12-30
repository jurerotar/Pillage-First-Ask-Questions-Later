import { prngMulberry32 } from 'ts-seedrandom';
import { items } from '@pillage-first/game-assets/items';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { HeroItem } from '@pillage-first/types/models/hero-item';
import type { VillageSize } from '@pillage-first/types/models/village';
import type { WorldItem } from '@pillage-first/types/models/world-item';
import { partition } from '@pillage-first/utils/array';
import {
  seededRandomArrayElement,
  seededRandomArrayElements,
} from '@pillage-first/utils/random';
import type { Seeder } from '../types/seeder';
import { batchInsert } from '../utils/batch-insert';
import { getVillageSize } from '../utils/village-size';

type Row = {
  tile_id: number;
  x: number;
  y: number;
};

type RowWithSize = Row & {
  size: VillageSize;
};

export const worldItemsSeeder: Seeder = (database, server): void => {
  const prng = prngMulberry32(server.seed);

  const results: [HeroItem['id'], number, number, HeroItem['category']][] = [];

  const [miscellaneousHeroItems, wearableAndArtifactItems] = partition(
    items,
    ({ category }) => ['consumable', 'resource', 'currency'].includes(category),
  );
  const epicHeroItems = wearableAndArtifactItems.filter(
    ({ rarity }) => rarity === 'epic',
  );
  const rareHeroItems = wearableAndArtifactItems.filter(
    ({ rarity }) => rarity === 'rare',
  );
  const uncommonHeroItems = wearableAndArtifactItems.filter(
    ({ rarity }) => rarity === 'uncommon',
  );
  const commonHeroItems = wearableAndArtifactItems.filter(
    ({ rarity }) => rarity === 'common',
  );

  const rows = database.selectObjects(
    `
    SELECT tiles.id AS tile_id,
           tiles.x,
           tiles.y
    FROM villages
           JOIN players ON villages.player_id = players.id
           JOIN tiles ON villages.tile_id = tiles.id
    WHERE players.id != $player_id;
  `,
    {
      $player_id: PLAYER_ID,
    },
  ) as Row[];

  const rowsWithSize: RowWithSize[] = rows.map((row) => {
    return {
      ...row,
      size: getVillageSize(server.configuration.mapSize, row.x, row.y),
    };
  });

  // Artifacts
  const epicHeroItemCandidates = rowsWithSize.filter(
    ({ size }) => size === '4xl',
  );
  const epicHeroItemTiles = seededRandomArrayElements(
    prng,
    epicHeroItemCandidates,
    epicHeroItems.length,
  );

  const epicHeroItemWorldItems: WorldItem[] = epicHeroItemTiles.map(
    (tile, index) => {
      const { id, category, name } = epicHeroItems[index];
      return {
        id,
        name,
        type: category,
        amount: 1,
        tileId: tile.tile_id,
      };
    },
  );

  // Rare hero items
  const rareHeroItemCandidates = rowsWithSize.filter((tile) =>
    ['3xl', '2xl'].includes(tile.size),
  );
  const rareHeroItemTiles = seededRandomArrayElements(
    prng,
    rareHeroItemCandidates,
    rareHeroItems.length,
  );
  const rareHeroWorldItems: WorldItem[] = rareHeroItemTiles.map(
    (tile, index) => {
      const { id, category, name } = rareHeroItems[index];
      return {
        id,
        name,
        type: category,
        tileId: tile.tile_id,
        amount: 1,
      };
    },
  );

  // Uncommon hero items
  const uncommonHeroItemCandidates = rowsWithSize.filter((tile) =>
    ['xl', 'lg'].includes(tile.size),
  );
  const uncommonHeroItemTiles = seededRandomArrayElements(
    prng,
    uncommonHeroItemCandidates,
    uncommonHeroItems.length,
  );
  const uncommonHeroWorldItems: WorldItem[] = uncommonHeroItemTiles.map(
    (tile, index) => {
      const { id, category, name } = uncommonHeroItems[index];
      return {
        id,
        name,
        type: category,
        tileId: tile.tile_id,
        amount: 1,
      };
    },
  );

  // Common hero items
  const commonHeroItemCandidates = rowsWithSize.filter((tile) =>
    ['md', 'sm'].includes(tile.size),
  );
  const commonHeroItemTiles = seededRandomArrayElements(
    prng,
    commonHeroItemCandidates,
    commonHeroItems.length,
  );
  const commonHeroWorldItems: WorldItem[] = commonHeroItemTiles.map(
    (tile, index) => {
      const { id, category, name } = commonHeroItems[index];
      return {
        id,
        name,
        type: category,
        tileId: tile.tile_id,
        amount: 1,
      };
    },
  );

  // Consumable hero items
  const tilesWithWorldItems = [
    ...epicHeroItemWorldItems,
    ...rareHeroWorldItems,
    ...uncommonHeroWorldItems,
    ...commonHeroWorldItems,
  ];

  const occupiedIds = new Set(tilesWithWorldItems.map(({ tileId }) => tileId));
  const consumableHeroItemCandidates = rowsWithSize.filter(({ tile_id }) => {
    return !occupiedIds.has(tile_id);
  });
  // Half of remaining villages should have non-wearable items
  const amountOfVillagesToPick = consumableHeroItemCandidates.length / 2;
  const consumableHeroItemTiles = seededRandomArrayElements(
    prng,
    consumableHeroItemCandidates,
    amountOfVillagesToPick,
  );
  const consumableHeroWorldItems: WorldItem[] = consumableHeroItemTiles.map(
    (tile) => {
      const { id, category, name } = seededRandomArrayElement(
        prng,
        miscellaneousHeroItems,
      );

      // TODO: All of these amounts should increase the further we get from the center

      if (category === 'resource') {
        // TODO: We're adding only a single resource world item, make sure all 4 resources are added to hero's inventory after battle!
        return {
          id,
          name,
          type: 'resource',
          tileId: tile.tile_id,
          amount: 1,
        };
      }

      if (category === 'currency') {
        return {
          id,
          name,
          type: 'currency',
          tileId: tile.tile_id,
          amount: 1,
        };
      }

      return {
        id,
        name,
        type: 'consumable',
        tileId: tile.tile_id,
        amount: 1,
      };
    },
  );

  const allWorldItems: WorldItem[] = [
    ...epicHeroItemWorldItems,
    ...rareHeroWorldItems,
    ...uncommonHeroWorldItems,
    ...commonHeroWorldItems,
    ...consumableHeroWorldItems,
  ];

  for (const wi of allWorldItems) {
    results.push([wi.id, wi.amount, wi.tileId, wi.type]);
  }

  batchInsert(
    database,
    'world_items',
    ['item_id', 'amount', 'tile_id', 'type'],
    results,
  );
};
