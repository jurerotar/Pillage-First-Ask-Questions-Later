import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import {
  effectIdSchema,
  effectScopeSchema,
  effectSourceSchema,
  effectTypeSchema,
} from '@pillage-first/types/models/effect';

export const apiEffectSchema = z
  .strictObject({
    id: effectIdSchema,
    value: z.number(),
    type: effectTypeSchema,
    scope: effectScopeSchema,
    source: effectSourceSchema,
    villageId: z.number().nullable(),
    source_specifier: z.number().nullable(),
    buildingId: buildingIdSchema.optional().nullable(),
  })
  .transform((t) => {
    return {
      id: t.id,
      value: t.value,
      type: t.type,
      scope: t.scope,
      source: t.source,
      sourceSpecifier: t.source_specifier,
      ...(t.villageId ? { villageId: t.villageId } : {}),
      ...(t.buildingId ? { buildingId: t.buildingId } : {}),
    };
  });
