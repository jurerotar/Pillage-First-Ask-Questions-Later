import { z } from 'zod';
import { apiEffectDtoSchema } from '@pillage-first/types/dtos/effect';
import { selectAllRelevantEffectsQuery } from '../../queries/effect-queries';
import { apiEffectSchema } from '../../utils/zod/effect-schemas';
import { createController } from '../controller';

export const getVillageEffects = createController(
  '/villages/:villageId/effects',
  {
    summary: 'Get village effects',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(apiEffectDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  return database.selectObjects({
    sql: selectAllRelevantEffectsQuery,
    bind: {
      $village_id: villageId,
    },
    schema: apiEffectSchema,
  });
});
