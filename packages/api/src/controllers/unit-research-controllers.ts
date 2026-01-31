import { z } from 'zod';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import type { Controller } from '../types/controller';

const getResearchedUnitsSchema = z
  .strictObject({
    unit_id: unitIdSchema,
    village_id: z.number(),
  })
  .transform((t) => {
    return {
      unitId: t.unit_id,
      villageId: t.village_id,
    };
  });

/**
 * GET /villages/:villageId/researched-units
 * @pathParam {number} villageId
 */
export const getResearchedUnits: Controller<
  '/villages/:villageId/researched-units'
> = (database, { params }) => {
  const { villageId } = params;

  return database.selectObjects({
    sql: `
    SELECT unit_id, village_id
    FROM unit_research
    WHERE village_id = $village_id;
  `,
    bind: { $village_id: villageId },
    schema: getResearchedUnitsSchema,
  });
};
