import { buildingIdSchema } from '@pillage-first/types/models/building';
import { effectSchema } from '@pillage-first/types/models/effect';

export const apiEffectSchema = effectSchema
  .extend({
    buildingId: buildingIdSchema.optional().nullable(),
  })
  .meta({ id: 'ApiEffect' });
