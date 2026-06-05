import type { z } from 'zod';
import { oasisByAnimalsSearchResultItemDtoSchema } from '@pillage-first/types/dtos/oasis-search';
import { roundToNDecimalPoints } from '@pillage-first/utils/math';
import type { getOasesWithAnimalsRowSchema } from '../schemas/oasis-animal-finder-schemas';

export const mapOasisWithAnimalsRowToDto = (
  row: z.infer<typeof getOasesWithAnimalsRowSchema>,
) => {
  const bonuses = JSON.parse(row.bonuses_json);
  const animals = JSON.parse(row.animals_json);
  return oasisByAnimalsSearchResultItemDtoSchema.parse({
    tileId: row.tile_id,
    coordinates: { x: row.coordinates_x, y: row.coordinates_y },
    bonuses,
    animals,
    distance: roundToNDecimalPoints(Math.sqrt(row.distance_squared), 2),
  });
};
