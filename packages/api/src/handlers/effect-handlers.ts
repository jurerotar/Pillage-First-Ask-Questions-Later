import { z } from 'zod';
import type { ApiHandler } from '../types/handler';
import { selectAllRelevantEffectsQuery } from '../utils/queries/effect-queries';
import { apiEffectSchema } from '../utils/zod/effect-schemas';

export const getVillageEffects: ApiHandler<'villageId'> = (
  database,
  { params },
) => {
  const { villageId } = params;

  const rows = database.selectObjects(selectAllRelevantEffectsQuery, {
    $village_id: villageId,
  });

  return z.array(apiEffectSchema).parse(rows);
};
