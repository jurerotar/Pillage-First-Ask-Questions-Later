import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { playerSchema } from '@pillage-first/types/models/player';
import type { Controller } from '../types/controller';
import {
  getPlayerVillagesWithPopulationSchema,
  getTroopsByVillageSchema,
  getVillagesByPlayerSchema,
} from './schemas/player-schemas.ts';

/**
 * GET /players/me
 */
export const getMe: Controller<'/players/me'> = (database) => {
  return database.selectObject({
    sql: `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.tribe,
        f.faction AS faction
      FROM
        players p
          LEFT JOIN factions f ON f.id = p.faction_id
      WHERE
        p.id = $player_id;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: playerSchema,
  })!;
};

/**
 * GET /players/:playerId/villages
 * @pathParam {number} playerId
 */
export const getPlayerVillageListing: Controller<
  '/players/:playerId/villages'
> = (database, args) => {
  const {
    params: { playerId },
  } = args;

  return database.selectObjects({
    sql: `
      SELECT v.id,
             v.tile_id,
             t.x AS coordinates_x,
             t.y AS coordinates_y,
             v.name,
             v.slug,
             rfc.resource_field_composition AS resource_field_composition
      FROM villages v
             JOIN tiles t
                  ON t.id = v.tile_id
             LEFT JOIN resource_field_compositions rfc
                       ON t.resource_field_composition_id = rfc.id
      WHERE v.player_id = $player_id;
    `,
    bind: { $player_id: playerId },
    schema: getVillagesByPlayerSchema,
  });
};

/**
 * GET /players/:playerId/villages-with-population
 * @pathParam {number} playerId
 */
export const getPlayerVillagesWithPopulation: Controller<
  '/players/:playerId/villages-with-population'
> = (database, args) => {
  const {
    params: { playerId },
  } = args;

  return database.selectObjects({
    sql: `
      SELECT v.id,
             v.tile_id,
             t.x AS coordinates_x,
             t.y AS coordinates_y,
             v.name,
             v.slug,
             rfc.resource_field_composition AS resource_field_composition,
             (SELECT COALESCE(SUM(level), 0) FROM building_fields WHERE village_id = v.id) AS population
      FROM villages v
             JOIN tiles t
                  ON t.id = v.tile_id
             LEFT JOIN resource_field_compositions rfc
                       ON t.resource_field_composition_id = rfc.id
      WHERE v.player_id = $player_id;
    `,
    bind: { $player_id: playerId },
    schema: getPlayerVillagesWithPopulationSchema,
  });
};

/**
 * GET /villages/:villageId/troops
 * @pathParam {number} playerId
 * @pathParam {number} villageId
 */
export const getTroopsByVillage: Controller<'/villages/:villageId/troops'> = (
  database,
  args,
) => {
  const {
    params: { villageId },
  } = args;

  return database.selectObjects({
    sql: `
      SELECT unit_id,
             amount,
             tile_id,
             source_tile_id
      FROM troops
      WHERE troops.tile_id = (SELECT villages.tile_id
                              FROM villages
                              WHERE villages.id = $village_id);
    `,
    bind: { $village_id: villageId },
    schema: getTroopsByVillageSchema,
  });
};

export type RenameVillageBody = {
  name: string;
};

/**
 * PATCH /villages/:villageId/rename
 * @pathParam {number} villageId
 * @bodyContent application/json RenameVillageBody
 * @bodyRequired
 */
export const renameVillage: Controller<
  '/villages/:villageId/rename',
  'patch',
  RenameVillageBody
> = (database, { params, body }) => {
  const { villageId } = params;
  const { name } = body;

  database.exec({
    sql: `
      UPDATE villages
      SET name = $name
      WHERE id = $village_id
    `,
    bind: { $name: name, $village_id: villageId },
  });
};

/**
 * GET /players/:playerSlug
 * @pathParam {string} playerSlug
 */
export const getPlayerBySlug: Controller<'/players/:playerSlug'> = (
  database,
  args,
) => {
  const {
    params: { playerSlug },
  } = args;

  return database.selectObject({
    sql: `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.tribe,
        f.faction
      FROM players p
      JOIN villages v
        ON v.player_id = p.id
      LEFT JOIN factions f
        ON f.id = p.faction_id
      WHERE
        p.slug = $player_slug
      LIMIT 1;
    `,
    bind: {
      $player_slug: playerSlug,
    },
    schema: playerSchema,
  })!;
};
