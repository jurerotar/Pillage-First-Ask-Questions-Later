import { prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import { items } from '@pillage-first/game-assets/items';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { HeroItem } from '@pillage-first/types/models/hero-item';
import type { Server } from '@pillage-first/types/models/server';
import type { WorldItem } from '@pillage-first/types/models/world-item';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  seededRandomArrayElement,
  seededRandomArrayElements,
} from '@pillage-first/utils/random';
import { batchInsert } from '../utils/batch-insert';
import { getVillageSize } from '../utils/village-size';

const rowSchema = z.strictObject({
  tile_id: z.number(),
  x: z.number(),
  y: z.number(),
});

export const worldItemsSeeder = (database: DbFacade, server: Server): void => {
  const prng = prngMulberry32(server.seed);

  const results: [HeroItem['id'], number, number][] = [];

  const miscellaneousCategories = new Set([
    'consumable',
    'resource',
    'currency',
  ]);

  const miscellaneousHeroItems: HeroItem[] = [];
  const epicHeroItems: HeroItem[] = [];
  const rareHeroItems: HeroItem[] = [];
  const uncommonHeroItems: HeroItem[] = [];
  const commonHeroItems: HeroItem[] = [];

  for (const item of items) {
    if (miscellaneousCategories.has(item.category)) {
      miscellaneousHeroItems.push(item);
      continue;
    }

    switch (item.rarity) {
      case 'epic': {
        epicHeroItems.push(item);
        break;
      }
      case 'rare': {
        rareHeroItems.push(item);
        break;
      }
      case 'uncommon': {
        uncommonHeroItems.push(item);
        break;
      }
      case 'common': {
        commonHeroItems.push(item);
        break;
      }
    }
  }

  const rows = database.selectObjects({
    sql: `
      SELECT
        tiles.id AS tile_id,
        tiles.x,
        tiles.y
      FROM
        villages
          JOIN players ON villages.player_id = players.id
          JOIN tiles ON villages.tile_id = tiles.id
      WHERE
        players.id != $player_id;
    `,
    bind: {
      $player_id: PLAYER_ID,
    },
    schema: rowSchema,
  });

  const rowsWithSize = rows.map((row) => {
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
      const { id } = epicHeroItems[index];
      return {
        id,
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
      const { id } = rareHeroItems[index];
      return {
        id,
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
      const { id } = uncommonHeroItems[index];
      return {
        id,
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
      const { id } = commonHeroItems[index];
      return {
        id,
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
      const { id } = seededRandomArrayElement(prng, miscellaneousHeroItems);

      return {
        id,
        tileId: tile.tile_id,
        // TODO: All of these amounts should increase the further we get from the center
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
    results.push([wi.id, wi.amount, wi.tileId]);
  }

  batchInsert(
    database,
    'world_items',
    ['item_id', 'amount', 'tile_id'],
    results,
  );
};
