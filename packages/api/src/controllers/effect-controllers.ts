import type { Controller } from '../types/controller';
import { selectAllRelevantEffectsQuery } from '../utils/queries/effect-queries';
import { apiEffectSchema } from '../utils/zod/effect-schemas';

export const getVillageEffects: Controller<'/villages/:villageId/effects'> = (
  database,
  { params },
) => {
  const { villageId } = params;

  return database.selectObjects({
    sql: selectAllRelevantEffectsQuery,
    bind: {
      $village_id: villageId,
    },
    schema: apiEffectSchema,
  });
};
