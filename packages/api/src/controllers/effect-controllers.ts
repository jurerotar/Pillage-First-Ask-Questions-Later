import { createController } from '../types/controller';
import { selectAllRelevantEffectsQuery } from '../utils/queries/effect-queries';
import { apiEffectSchema } from '../utils/zod/effect-schemas';

export const getVillageEffects = createController(
  '/villages/:villageId/effects',
)(({ database, path: { villageId } }) => {
  return database.selectObjects({
    sql: selectAllRelevantEffectsQuery,
    bind: {
      $village_id: villageId,
    },
    schema: apiEffectSchema,
  });
});
