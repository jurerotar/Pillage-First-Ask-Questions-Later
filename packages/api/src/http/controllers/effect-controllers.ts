import { z } from 'zod';
import { apiEffectDtoSchema } from '@pillage-first/types/dtos/effect';
import { selectAllRelevantEffectsQuery } from '../../queries/effect-queries';
import { apiEffectSchema } from '../../utils/zod/effect-schemas';
import { createController } from '../controller';

export const getTileEffects = createController('/tiles/:tileId/effects', {
  summary: 'Get tile effects',
  requestParams: {
    path: z.strictObject({
      tileId: z.coerce.number(),
    }),
  },
  response: z.array(apiEffectDtoSchema),
})(({ database, path: { tileId } }) => {
  return database.selectObjects({
    sql: selectAllRelevantEffectsQuery,
    bind: {
      $tile_id: tileId,
    },
    schema: apiEffectSchema,
  });
});
