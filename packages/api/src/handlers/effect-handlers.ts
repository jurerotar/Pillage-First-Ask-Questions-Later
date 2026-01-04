import { z } from 'zod';
import type { Controller } from '../types/handler';
import { selectAllRelevantEffectsQuery } from '../utils/queries/effect-queries';
import { apiEffectSchema } from '../utils/zod/effect-schemas';

/**
 * GET /villages/:villageId/effects
 * @pathParam {number} villageId
 */
export const getVillageEffects: Controller<'/villages/:villageId/effects'> = (
  database,
  { params },
) => {
  const { villageId } = params;

  const rows = database.selectObjects(selectAllRelevantEffectsQuery, {
    $village_id: villageId,
  });

  return z.array(apiEffectSchema).parse(rows);
};
