import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { playerSchema } from '@pillage-first/types/models/player';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import type { Controller } from '../types/controller';

/**
 * GET /me
 */
export const getMe: Controller<'/me'> = (database) => {
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

const getVillagesByPlayerSchema = z
  .strictObject({
    id: z.number(),
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string().nullable(),
    resource_field_composition: resourceFieldCompositionSchema,
  })
  .transform((t) => {
    return {
      id: t.id,
      tileId: t.tile_id,
      coordinates: {
        x: t.coordinates_x,
        y: t.coordinates_y,
      },
      name: t.name,
      slug: t.slug ?? `v-${t.id}`,
      resourceFieldComposition: t.resource_field_composition,
    };
  });

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

const getPlayerVillagesWithPopulationSchema = z
  .strictObject({
    id: z.number(),
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string().nullable(),
    resource_field_composition: resourceFieldCompositionSchema,
    population: z.number(),
  })
  .transform((t) => {
    return {
      id: t.id,
      tileId: t.tile_id,
      coordinates: {
        x: t.coordinates_x,
        y: t.coordinates_y,
      },
      name: t.name,
      slug: t.slug ?? `v-${t.id}`,
      resourceFieldComposition: t.resource_field_composition,
      population: t.population,
    };
  });

/**
 * GET /players/:playerId/villages/population
 * @pathParam {number} playerId
 */
export const getPlayerVillagesWithPopulation: Controller<
  '/players/:playerId/villages/population'
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

const getTroopsByVillageSchema = z
  .strictObject({
    unit_id: unitIdSchema,
    amount: z.number().min(1),
    tile_id: z.number(),
    source_tile_id: z.number(),
  })
  .transform((t) => {
    return {
      unitId: t.unit_id,
      amount: t.amount,
      tileId: t.tile_id,
      source: t.source_tile_id,
    };
  });

/**
 * GET /players/:playerId/villages/:villageId/troops
 * @pathParam {number} playerId
 * @pathParam {number} villageId
 */
export const getTroopsByVillage: Controller<
  '/players/:playerId/villages/:villageId/troops'
> = (database, args) => {
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

type RenameVillageBody = {
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
