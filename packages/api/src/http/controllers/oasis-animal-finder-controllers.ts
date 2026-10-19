import { z } from 'zod';
import { oasisByAnimalsSearchResultItemDtoSchema } from '@pillage-first/types/dtos/oasis-search';
import type { NatureUnitId } from '@pillage-first/types/models/unit';
import { natureUnitIdSchema } from '@pillage-first/types/models/unit';
import { selectOasesByAnimalsQuery } from '../../queries/oasis-animal-finder-queries';
import { createController } from '../controller';
import { mapOasisWithAnimalsRowToDto } from './mappers/oasis-finder-mapper';
import { getOasesWithAnimalsRowSchema } from './schemas/oasis-animal-finder-schemas';

export const getOasesWithAnimals = createController(
  '/search/oases/by-animals',
  'query',
  {
    summary: 'Find unoccupied oasis tiles with specific nature troop amounts',
    requestBody: z.strictObject({
      x: z.number(),
      y: z.number(),
      animalFilters: z.array(
        z.strictObject({
          animal: natureUnitIdSchema,
          amount: z.number().min(1),
        }),
      ),
    }),
    response: z.array(oasisByAnimalsSearchResultItemDtoSchema),
  },
)(({ database, body }) => {
  const { x, y, animalFilters } = body;

  const uniqueFilters = new Map<NatureUnitId, number>();
  for (const { animal, amount } of animalFilters) {
    uniqueFilters.set(animal, Math.max(uniqueFilters.get(animal) ?? 0, amount));
  }

  const rows = database.selectObjects({
    sql: selectOasesByAnimalsQuery,
    bind: {
      $animal_filters: JSON.stringify([...uniqueFilters.entries()]),
      $tile_x: x,
      $tile_y: y,
    },
    schema: getOasesWithAnimalsRowSchema,
  });
  return rows.map(mapOasisWithAnimalsRowToDto);
});
