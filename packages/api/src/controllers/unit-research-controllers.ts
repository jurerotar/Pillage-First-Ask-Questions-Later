import type { Controller } from '../types/controller';
import { getResearchedUnitsSchema } from './schemas/unit-research-schemas.ts';

/**
 * GET /villages/:villageId/researched-units
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
