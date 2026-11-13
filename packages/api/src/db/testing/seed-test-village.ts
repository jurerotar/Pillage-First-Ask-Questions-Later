import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Resources } from '@pillage-first/types/models/resource';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const setTestVillageResources = (
  database: DbFacade,
  tileId: number,
  resources: Resources,
  updatedAt: number,
): void => {
  database.exec({
    sql: `INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
      VALUES ($tile_id, $wood, $clay, $iron, $wheat, $updated_at)
      ON CONFLICT(tile_id) DO UPDATE SET wood = excluded.wood, clay = excluded.clay,
        iron = excluded.iron, wheat = excluded.wheat, updated_at = excluded.updated_at;`,
    bind: {
      $tile_id: tileId,
      $wood: resources.wood,
      $clay: resources.clay,
      $iron: resources.iron,
      $wheat: resources.wheat,
      $updated_at: updatedAt,
    },
  });
};

export const createTestVillage = (
  database: DbFacade,
  name: string,
  {
    playerId = PLAYER_ID,
    resourceSite,
  }: {
    playerId?: number;
    resourceSite?: { resources?: Resources; updatedAt: number };
  } = {},
) => {
  const tileId = database.selectValue({
    sql: `SELECT id FROM tiles
      WHERE type_id = (SELECT id FROM tile_type_ids WHERE type = 'free')
        AND id NOT IN (SELECT tile_id FROM villages)
      ORDER BY id LIMIT 1;`,
    schema: tileIdSchema,
  })!;
  const id = database.selectValue({
    sql: `INSERT INTO villages (name, slug, tile_id, player_id)
      VALUES ($name, $slug, $tile_id, $player_id) RETURNING id;`,
    bind: {
      $name: name,
      $slug: `${name.toLowerCase().replaceAll(' ', '-')}-${tileId}`,
      $tile_id: tileId,
      $player_id: playerId,
    },
    schema: z.int(),
  })!;

  if (resourceSite) {
    setTestVillageResources(
      database,
      tileId,
      resourceSite.resources ?? { wood: 100, clay: 100, iron: 100, wheat: 100 },
      resourceSite.updatedAt,
    );
  }

  return { id, tileId };
};
