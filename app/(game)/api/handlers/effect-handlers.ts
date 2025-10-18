import { z } from 'zod';
import type { ApiHandler } from 'app/interfaces/api';
import { selectAllRelevantEffectsQuery } from 'app/(game)/api/utils/queries/effect-queries';
import { effectSchema } from 'app/(game)/api/utils/zod/effect-schemas';

export const getVillageEffects: ApiHandler<
  z.infer<typeof effectSchema>[],
  'villageId'
> = (database, { params }) => {
  const { villageId } = params;

  const rows = database.selectObjects(selectAllRelevantEffectsQuery, {
    $village_id: villageId,
  });

  return z.array(effectSchema).parse(rows);
};
