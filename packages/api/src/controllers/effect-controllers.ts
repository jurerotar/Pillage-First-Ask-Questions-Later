import { selectAllRelevantEffectsQuery } from '../queries/effect-queries';
import { createController } from '../utils/controller';
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
