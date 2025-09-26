import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';

const getPlayerByIdSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  tribe: z.enum([
    'romans',
    'teutons',
    'gauls',
    'huns',
    'egyptians',
  ] satisfies PlayableTribe[]),
});

export const getPlayerById: ApiHandler<
  z.infer<typeof getPlayerByIdSchema>,
  'playerId'
> = async (_queryClient, database, args) => {
  const {
    params: { playerId },
  } = args;

  const row = database.selectObject(
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

  return getPlayerByIdSchema.parse(row);
};

const getVillagesByPlayerSchema = z
  .strictObject({
    id: z.number(),
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string(),
    resource_field_composition: z.string(),
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
      slug: t.slug,
      resourceFieldComposition: t.resource_field_composition,
    };
  });

export const getPlayerVillageListing: ApiHandler<
  z.infer<typeof getVillagesByPlayerSchema>[],
  'playerId'
> = async (_queryClient, database, args) => {
  const {
    params: { playerId },
  } = args;

  const rows = database.selectObjects(
    `
      SELECT
        v.id,
        v.tile_id,
        t.x  AS coordinates_x,
        t.y  AS coordinates_y,
        v.name,
        v.slug,
        t.resource_field_composition
      FROM villages v
      JOIN tiles t
        ON t.id = v.tile_id
      WHERE v.player_id = $player_id;
    `,
    { $player_id: playerId },
  );

  const listSchema = z.array(getVillagesByPlayerSchema);

  return listSchema.parse(rows);
};

const getTroopsByVillageSchema = z
  .strictObject({
    unit_id: z.string(),
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

export const getTroopsByVillage: ApiHandler<
  z.infer<typeof getTroopsByVillageSchema>[],
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
             source_tile_id
      FROM troops
      WHERE troops.tile_id = (SELECT villages.tile_id
                              FROM villages
                              WHERE villages.id = $village_id);
    `,
    { $village_id: villageId },
  );

  const listSchema = z.array(getTroopsByVillageSchema);

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

  database.exec(
    `
    UPDATE villages
      SET name = $name
      WHERE id = $village_id
    `,
    { $name: name, $village_id: villageId },
  );
};
