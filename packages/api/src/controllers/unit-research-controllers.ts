import { createController } from '../utils/controller';
import { getResearchedUnitsSchema } from './schemas/unit-research-schemas';

export const getResearchedUnits = createController(
  '/villages/:villageId/researched-units',
)(({ database, path: { villageId } }) => {
  return database.selectObjects({
    sql: `
    SELECT unit_id, village_id
    FROM unit_research
    WHERE village_id = $village_id;
  `,
    bind: { $village_id: villageId },
    schema: getResearchedUnitsSchema,
  });
});
