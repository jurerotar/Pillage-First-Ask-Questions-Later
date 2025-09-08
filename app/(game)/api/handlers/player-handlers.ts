import type { ApiHandler } from 'app/interfaces/api';
import { playersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { VillageModel } from 'app/interfaces/models/game/village';
import type { Player } from 'app/interfaces/models/game/player';
import { villageApiResource } from 'app/(game)/api/api-resources/village-api-resources';
import { z } from 'zod';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import { buildingFieldApiResource } from 'app/(game)/api/api-resources/building-field-api-resources';

const getPlayerByIdResponseSchema = z
  .strictObject({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    tribe: z.enum(['romans', 'teutons', 'gauls', 'huns', 'egyptians'] satisfies PlayableTribe[]),
  })
  .transform((t) => {
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      tribe: t.tribe,
    };
  });

export const getPlayerById: ApiHandler<z.infer<typeof getPlayerByIdResponseSchema>, 'playerId'> = async (
  queryClient,
  database,
  args,
) => {
  const {
    params: { playerId },
  } = args;

  const _row = database.selectObject(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.tribe
      FROM players p
      WHERE p.id = $player_id;
    `,
    { $player_id: playerId },
  );

  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;

  return players.find(({ id }) => id === playerId)!;
};

const getVillagesByPlayerResponseSchema = z
  .strictObject({

  })
  .transform((t) => {
    return {
      id: t.id,
      tileId: t.tile_id,
      playerId: t.player_id,
      coordinates: {
        x: t.coordinates_x,
        y: t.coordinates_y,
      },
      name: t.name,
      slug: t.slug,
      buildingFields: buildingFields.map(buildingFieldApiResource),
      lastUpdatedAt: t.last_updated_at,
      resourceFieldComposition: t.resource_field_composition,
      resources: {
        wood: t.wood,
        clay: t.clay,
        iron: t.iron,
        wheat: t.wheat,
      },
    };
  });

export const getVillagesByPlayer: ApiHandler<z.infer<typeof getVillagesByPlayerResponseSchema>[], 'playerId'> = async (
  _queryClient,
  database,
  args,
) => {
  const {
    params: { playerId },
  } = args;

  const rows = database.selectObjects(
    `
      SELECT
        v.id,
        v.tile_id,
        v.player_id,
        t.x  AS coordinates_x,
        t.y  AS coordinates_y,
        v.name,
        v.slug,
        rs.updated_at AS last_updated_at,
        rs.wood AS wood,
        rs.clay AS clay,
        rs.iron AS iron,
        rs.wheat AS wheat,
        t.resource_field_composition AS resource_field_composition,
       (
          SELECT json_group_array(
                   json_object(
                     'field_id',    bf.field_id,
                     'building_id', bf.building_id,
                     'level',       bf.level
                   )
                 )
          FROM building_fields bf
          WHERE bf.village_id = v.id
        ) AS building_fields
      FROM villages v
      JOIN tiles t
        ON t.id = v.tile_id
      LEFT JOIN resource_sites rs
        ON rs.tile_id = v.tile_id
      WHERE v.player_id = $player_id;
    `,
    { $player_id: playerId },
  );

  return rows.map(villageApiResource);
};

const getTroopsByVillageResponseSchema = z
  .strictObject({
    unit_id: z.string(),
    amount: z.number().min(1),
    tile_id: z.number(),
    source: z.number(),
  })
  .transform((t) => {
    return {
      unitId: t.unit_id,
      amount: t.amount,
      tileId: t.tile_id,
      source: t.source,
    };
  });

export const getTroopsByVillage: ApiHandler<
  z.infer<typeof getTroopsByVillageResponseSchema>[],
  'playerId' | 'villageId'
> = async (_queryClient, database, args) => {
  const {
    params: { villageId },
  } = args;

  const troopModels = database.selectObjects(
    `
      SELECT unit_id,
             amount,
             tile_id,
             source
      FROM troops
      WHERE troops.tile_id = (SELECT villages.tile_id
                              FROM villages
                              WHERE villages.id = $village_id);
    `,
    { $village_id: villageId },
  );

  const listSchema = z.array(getTroopsByVillageResponseSchema);

  return listSchema.parse(troopModels);
};

type RenameVillageBody = {
  name: string;
};

export const renameVillage: ApiHandler<
  void,
  'playerId' | 'villageId',
  RenameVillageBody
> = async (_queryClient, database, args) => {
  const {
    params: { villageId },
    body: { name },
  } = args;

  database.exec({
    sql: `
      UPDATE villages
      SET name = $name
      WHERE id = $village_id
    `,
    bind: { $name: name, $village_id: villageId },
  });
};
