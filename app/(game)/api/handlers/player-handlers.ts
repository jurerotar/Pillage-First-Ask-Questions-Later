import { z } from 'zod';
import type { ApiHandler } from 'app/interfaces/api';
import { playerSchema } from 'app/interfaces/models/game/player';
import { resourceFieldCompositionSchema } from 'app/interfaces/models/game/resource-field-composition';
import { unitIdSchema } from 'app/interfaces/models/game/unit';

export const getPlayerById: ApiHandler<'playerId'> = (database, args) => {
  const {
    params: { playerId },
  } = args;

  const row = database.selectObject(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.tribe,
        f.faction AS faction
      FROM players p
             LEFT JOIN factions f ON f.id = p.faction_id
      WHERE p.id = $player_id;
    `,
    { $player_id: playerId },
  );

  return playerSchema.parse(row);
};

const getVillagesByPlayerSchema = z
  .strictObject({
    id: z.number(),
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string(),
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
      slug: t.slug,
      resourceFieldComposition: t.resource_field_composition,
    };
  });

export const getPlayerVillageListing: ApiHandler<'playerId'> = (
  database,
  args,
) => {
  const {
    params: { playerId },
  } = args;

  const rows = database.selectObjects(
    `
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
    { $player_id: playerId },
  );

  return z.array(getVillagesByPlayerSchema).parse(rows);
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

export const getTroopsByVillage: ApiHandler<'playerId' | 'villageId'> = (
  database,
  args,
) => {
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

  return z.array(getTroopsByVillageSchema).parse(troopModels);
};

type RenameVillageBody = {
  name: string;
};

export const renameVillage: ApiHandler<
  'playerId' | 'villageId',
  RenameVillageBody
> = (database, args) => {
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
