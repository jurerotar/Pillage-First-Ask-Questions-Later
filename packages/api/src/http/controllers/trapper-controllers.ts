import { z } from 'zod';
import { createController } from '../controller';

const trapperCageStatsDtoSchema = z
  .strictObject({
    total: z.number(),
    free: z.number(),
    occupied: z.number(),
  })
  .meta({ id: 'TrapperCageStatsDto' });

export const getTrapperCageStats = createController(
  '/villages/:villageId/trapper-cages',
  {
    summary: 'Get Trapper cage stats',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: trapperCageStatsDtoSchema,
  },
)(({ database, path: { villageId } }) => {
  return database.selectObject({
    sql: `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE unit_id IS NULL) AS free,
        COUNT(*) FILTER (WHERE unit_id IS NOT NULL) AS occupied
      FROM
        trapper_cages
      WHERE
        village_id = $village_id;
    `,
    bind: {
      $village_id: villageId,
    },
    schema: trapperCageStatsDtoSchema,
  })!;
});
