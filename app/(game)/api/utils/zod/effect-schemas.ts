import { z } from 'zod';
import {
  type EffectId,
  effectScopeSchema,
  effectSourceSchema,
  effectTypeSchema,
} from 'app/interfaces/models/game/effect';
import {
  type Building,
  buildingIdSchema,
} from 'app/interfaces/models/game/building';

// This schema should only be used in /api, due to its signature being different from what FE expects
export const apiEffectSchema = z
  .strictObject({
    id: z.string() as z.ZodType<EffectId>,
    value: z.number(),
    type: effectTypeSchema,
    scope: effectScopeSchema,
    source: effectSourceSchema,
    villageId: z.number().nullable(),
    source_specifier: z.number().nullable(),
    buildingId: buildingIdSchema.optional().nullable() as z.ZodType<
      Building['id']
    >,
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
