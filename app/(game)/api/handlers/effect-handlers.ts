import { z } from 'zod';
import type { ApiHandler } from 'app/interfaces/api';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Building } from 'app/interfaces/models/game/building';
import { selectAllRelevantEffectsQuery } from 'app/(game)/api/utils/queries/effects';

const getVillageEffectsSchema = z
  .strictObject({
    id: z.string().brand<Effect['id']>(),
    value: z.number(),
    type: z.enum(['base', 'bonus', 'bonus-booster']),
    scope: z.enum(['global', 'village', 'server']),
    source: z.enum([
      'hero',
      'oasis',
      'artifact',
      'building',
      'tribe',
      'server',
      'troops',
    ]),
    villageId: z.number().nullable(),
    source_specifier: z.number().nullable(),
    buildingId: z.string().brand<Building['id']>().optional().nullable(),
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

export const getVillageEffects: ApiHandler<
  z.infer<typeof getVillageEffectsSchema>[],
  'villageId'
> = async (_queryClient, database, { params }) => {
  const { villageId } = params;

  const rows = database.selectObjects(selectAllRelevantEffectsQuery, {
    $village_id: villageId,
  });

  return z.array(getVillageEffectsSchema).parse(rows);
};
