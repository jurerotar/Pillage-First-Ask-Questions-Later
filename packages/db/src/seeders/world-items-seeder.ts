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
  seededRandomIntFromInterval,
  seededShuffle,
} from '@pillage-first/utils/random';
import { batchInsert } from '../utils/batch-insert';
import { getVillageSize } from '../utils/village-size';

const rowSchema = z.strictObject({
  tile_id: z.number(),
  x: z.number(),
  y: z.number(),
});

type ItemAmountRange = [min: number, max: number];

export const stackableHeroItemAmountRanges = new Map<
  HeroItem['name'],
  ItemAmountRange
>([
  ['HEALING_POTION', [3, 10]],
  ['ANIMAL_CAGE', [2, 6]],
  ['EXPERIENCE_SCROLL', [2, 10]],
  ['LOYALTY_SEAL', [1, 8]],
  ['SILVER', [50, 150]],
]);

const getWorldItemAmount = (
  prng: Parameters<typeof seededRandomIntFromInterval>[0],
  item: HeroItem,
): number => {
  const amountRange = stackableHeroItemAmountRanges.get(item.name);

  if (!amountRange) {
    return 1;
  }

  const [min, max] = amountRange;
  return seededRandomIntFromInterval(prng, min, max);
};

export const worldItemsSeeder = (database: DbFacade, server: Server): void => {
  const prng = prngMulberry32(server.seed);

  const results: [HeroItem['id'], number, number][] = [];

  const miscellaneousCategories = new Set(['consumable', 'currency']);

  const rareArtefacts: HeroItem[] = [];
  const uncommonArtefacts: HeroItem[] = [];
  const commonArtefacts: HeroItem[] = [];
  const rareHeroItems: HeroItem[] = [];
  const uncommonHeroItems: HeroItem[] = [];
  const commonHeroItems: HeroItem[] = [];
  const miscellaneousHeroItems: HeroItem[] = [];

  for (const item of items) {
    if (miscellaneousCategories.has(item.category)) {
      miscellaneousHeroItems.push(item);
      continue;
    }

    if (item.category === 'artifact') {
      switch (item.rarity) {
        case 'rare': {
          rareArtefacts.push(item);
          break;
        }
        case 'uncommon': {
          uncommonArtefacts.push(item);
          break;
        }
        case 'common': {
          commonArtefacts.push(item);
          break;
        }
      }
    }

    switch (item.rarity) {
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

  // Rare hero items
  const rareHeroItemTileCandidates = rowsWithSize.filter((tile) =>
    ['4xl', '3xl', '2xl'].includes(tile.size),
  );

  const rareItemPool = seededShuffle(prng, [
    ...rareHeroItems,
    ...rareHeroItems,
    ...rareArtefacts,
  ]);

  const rareHeroItemTiles = seededRandomArrayElements(
    prng,
    rareHeroItemTileCandidates,
    rareItemPool.length,
  );

  const rareHeroWorldItems: WorldItem[] = rareHeroItemTiles.map((tile) => {
    const item = seededRandomArrayElement(prng, rareHeroItems);

    return {
      id: item.id,
      tileId: tile.tile_id,
      amount: 1,
    };
  });

  // Uncommon hero items
  const uncommonHeroItemTileCandidates = rowsWithSize.filter((tile) =>
    ['xl', 'lg'].includes(tile.size),
  );

  const uncommonItemPool = seededShuffle(prng, [
    ...uncommonHeroItems,
    ...uncommonHeroItems,
    ...uncommonHeroItems,
    ...uncommonArtefacts,
    ...uncommonArtefacts,
  ]);

  const uncommonHeroItemTiles = seededRandomArrayElements(
    prng,
    uncommonHeroItemTileCandidates,
    uncommonItemPool.length,
  );

  const uncommonHeroWorldItems: WorldItem[] = uncommonHeroItemTiles.map(
    (tile) => {
      const item = seededRandomArrayElement(prng, uncommonHeroItems);

      return {
        id: item.id,
        tileId: tile.tile_id,
        amount: 1,
      };
    },
  );

  // Common hero items
  const commonHeroItemTileCandidates = rowsWithSize.filter((tile) =>
    ['md', 'sm'].includes(tile.size),
  );

  const commonItemPool = seededShuffle(prng, [
    ...commonHeroItems,
    ...commonHeroItems,
    ...commonHeroItems,
    ...commonHeroItems,
    ...commonArtefacts,
    ...commonArtefacts,
    ...commonArtefacts,
  ]);

  const commonHeroItemTiles = seededRandomArrayElements(
    prng,
    commonHeroItemTileCandidates,
    commonItemPool.length,
  );

  const commonHeroWorldItems: WorldItem[] = commonHeroItemTiles.map((tile) => {
    const item = seededRandomArrayElement(prng, commonHeroItems);

    return {
      id: item.id,
      tileId: tile.tile_id,
      amount: 1,
    };
  });

  // Non-wearable hero items
  const tilesWithWorldItems = [
    ...rareHeroWorldItems,
    ...uncommonHeroWorldItems,
    ...commonHeroWorldItems,
  ];

  const occupiedIds = new Set(tilesWithWorldItems.map(({ tileId }) => tileId));

  const miscellaneousHeroItemTileCandidates = rowsWithSize.filter(
    ({ tile_id }) => {
      return !occupiedIds.has(tile_id);
    },
  );

  // Half of remaining villages should have miscellaneous items
  const amountOfVillagesToPick = miscellaneousHeroItemTileCandidates.length / 2;

  const miscellaneousHeroItemTiles = seededRandomArrayElements(
    prng,
    miscellaneousHeroItemTileCandidates,
    amountOfVillagesToPick,
  );

  const miscellaneousHeroWorldItems: WorldItem[] =
    miscellaneousHeroItemTiles.map((tile) => {
      const item = seededRandomArrayElement(prng, miscellaneousHeroItems);

      return {
        id: item.id,
        tileId: tile.tile_id,
        amount: getWorldItemAmount(prng, item),
      };
    });

  const allWorldItems: WorldItem[] = [
    ...rareHeroWorldItems,
    ...uncommonHeroWorldItems,
    ...commonHeroWorldItems,
    ...miscellaneousHeroWorldItems,
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
