import type { z } from 'zod';
import { buildingIdSchema } from '../models/building';
import { effectSchema } from '../models/effect';

// API Effect DTO extends base Effect with optional/nullable buildingId included when source is building/oasis
export const apiEffectDtoSchema = effectSchema
  .extend({
    buildingId: buildingIdSchema.optional().nullable(),
  })
  .meta({ id: 'ApiEffectDto' });

export type ApiEffectDto = z.infer<typeof apiEffectDtoSchema>;
