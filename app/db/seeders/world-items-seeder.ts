import { prngMulberry32 } from 'ts-seedrandom';
import { items } from 'app/assets/items';
import { PLAYER_ID } from 'app/constants/player';
import { batchInsert } from 'app/db/utils/batch-insert';
import { getVillageSize } from 'app/db/utils/village-size';
import type { Seeder } from 'app/interfaces/db';
import type { HeroItem } from 'app/interfaces/models/game/hero-item';
import type { VillageSize } from 'app/interfaces/models/game/village';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import {
  seededRandomArrayElement,
  seededRandomArrayElements,
} from 'app/utils/common';

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

  const rows = database.selectObjects(
    `
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
