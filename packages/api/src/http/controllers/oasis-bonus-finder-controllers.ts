import { z } from 'zod';
import { oasisByBonusSearchResultItemDtoSchema } from '@pillage-first/types/dtos/oasis-search';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { getTilesWithBonuses as getTilesWithBonusesResult } from '../../utils/oasis-bonus-finder';
import { createController } from '../controller';
import { oasisBonusSlotSchema } from './schemas/oasis-bonus-finder-schemas';

export const getTilesWithBonuses = createController(
  '/search/oases/by-bonus',
  'post',
  {
    summary: 'Find tiles with specific oasis bonuses',
    requestBody: z.strictObject({
      x: z.number(),
      y: z.number(),
      resourceFieldComposition: resourceFieldCompositionSchema.or(
        z.literal('any-cropper'),
      ),
      bonuses: z.strictObject({
        firstOasis: oasisBonusSlotSchema,
        secondOasis: oasisBonusSlotSchema,
        thirdOasis: oasisBonusSlotSchema,
      }),
    }),
    response: z.array(oasisByBonusSearchResultItemDtoSchema),
  },
)(({ database, body }) => {
  return getTilesWithBonusesResult(database, body);
});
