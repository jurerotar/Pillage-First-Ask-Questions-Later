import type { Seeder } from 'app/interfaces/db';
import { prngMulberry32 } from 'ts-seedrandom';
import {
  partition,
  seededRandomArrayElement,
  seededRandomArrayElements,
} from 'app/utils/common';
import { items } from 'app/(game)/(village-slug)/assets/items';
import type { HeroItem } from 'app/interfaces/models/game/hero';
import type { TileModel } from 'app/interfaces/models/game/tile';
import { PLAYER_ID } from 'app/constants/player';
import type { VillageSize } from 'app/interfaces/models/game/village';
import { getVillageSize } from 'app/db/utils/village-size';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { batchInsert } from 'app/db/utils/batch-insert';

type Row = {
  tile_id: TileModel['id'];
  x: TileModel['x'];
  y: TileModel['y'];
};

type RowWithSize = Row & {
  size: VillageSize;
};

export const worldItemsSeeder: Seeder = (database, server): void => {
  const prng = prngMulberry32(server.seed);

  const results: [
    HeroItem['id'],
    number,
    TileModel['id'],
    HeroItem['category'],
  ][] = [];

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
      const { id, category } = epicHeroItems[index];
      return {
        id,
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
      const { id, category } = rareHeroItems[index];
      return {
        id,
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
      const { id, category } = uncommonHeroItems[index];
      return {
        id,
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
      const { id, category } = commonHeroItems[index];
      return {
        id,
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

  const occupiedIds = tilesWithWorldItems.map(({ tileId }) => tileId);
  const consumableHeroItemCandidates = rowsWithSize.filter(({ tile_id }) => {
    return !occupiedIds.includes(tile_id);
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
      const { id, category } = seededRandomArrayElement(
        prng,
        miscellaneousHeroItems,
      );

      // TODO: All of these amounts should increase the further we get from the center

      if (category === 'resource') {
        // TODO: We're adding only a single resource world item, make sure all 4 resources are added to hero's inventory after battle!
        return {
          id,
          type: 'resource',
          tileId: tile.tile_id,
          amount: 1,
        };
      }

      if (category === 'currency') {
        return {
          id,
          type: 'currency',
          tileId: tile.tile_id,
          amount: 1,
        };
      }

      return {
        id,
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
    (row) => row,
  );
};
