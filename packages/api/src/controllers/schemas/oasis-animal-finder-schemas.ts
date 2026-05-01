import { z } from 'zod';
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { natureUnitIdSchema } from '@pillage-first/types/models/unit';
import { roundToNDecimalPoints } from '@pillage-first/utils/math';

export const getOasesWithAnimalsSchema = z
  .strictObject({
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    bonuses_json: z.string(),
    animals_json: z.string(),
    distance_squared: z.number(),
  })
  .transform((tile) => ({
    tileId: tile.tile_id,
    coordinates: {
      x: tile.coordinates_x,
      y: tile.coordinates_y,
    },
    bonuses: z
      .array(
        z.strictObject({
          resource: resourceSchema,
          bonus: z.number(),
        }),
      )
      .parse(JSON.parse(tile.bonuses_json)),
    animals: z
      .array(
        z.strictObject({
          unitId: natureUnitIdSchema,
          amount: z.number(),
        }),
      )
      .parse(JSON.parse(tile.animals_json)),
    distance: roundToNDecimalPoints(Math.sqrt(tile.distance_squared), 2),
  }))
  .pipe(
    z.strictObject({
      tileId: z.number(),
      coordinates: coordinatesSchema,
      bonuses: z.array(
        z.strictObject({
          resource: resourceSchema,
          bonus: z.number(),
        }),
      ),
      animals: z.array(
        z.strictObject({
          unitId: natureUnitIdSchema,
          amount: z.number(),
        }),
      ),
      distance: z.number(),
    }),
  )
  .meta({ id: 'GetOasesWithAnimals' });
