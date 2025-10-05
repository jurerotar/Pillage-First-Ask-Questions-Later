import { z } from 'zod';
import type { ApiHandler } from 'app/interfaces/api';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Building } from 'app/interfaces/models/game/building';

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
    village_id: z.number().nullable(),
    source_specifier: z.number().nullable(),
    building_id: z.string().brand<Building['id']>().optional().nullable(),
  })
  .transform((t) => {
    return {
      id: t.id,
      value: t.value,
      type: t.type,
      scope: t.scope,
      source: t.source,
      villageId: t.village_id,
      sourceSpecifier: t.source_specifier,
      ...(t.building_id != null ? { buildingId: t.building_id } : {}),
    };
  });

export const getVillageEffects: ApiHandler<
  z.infer<typeof getVillageEffectsSchema>[],
  'villageId'
> = async (_queryClient, database, { params }) => {
  const { villageId } = params;

  const rows = database.selectObjects(
    `
      SELECT e.effect_id AS id,
             e.value,
             e.type,
             e.scope,
             e.source,
             e.village_id,
             e.source_specifier,
             CASE
               WHEN e.source = 'building'
                 AND e.source_specifier BETWEEN 1 AND 40
                 THEN bf.building_id
               END AS building_id
      FROM effects AS e
             LEFT JOIN building_fields AS bf
                       ON e.scope = 'village'
                         AND bf.village_id = e.village_id
                         AND bf.field_id = e.source_specifier
      WHERE e.scope IN ('global', 'server')
         OR e.village_id = $village_id;
    `,
    {
      $village_id: villageId,
    },
  );

  return z.array(getVillageEffectsSchema).parse(rows);
};
