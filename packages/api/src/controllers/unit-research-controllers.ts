import { createController } from '../utils/controller';
import { mapResearchedUnitRowToDto } from './mappers/unit-mapper';
import { getResearchedUnitsRowSchema } from './schemas/unit-research-schemas';

export const getResearchedUnits = createController(
  '/villages/:villageId/researched-units',
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: `
      SELECT ui.unit AS unit_id, ur.village_id
      FROM
        unit_research ur
          JOIN unit_ids ui ON ui.id = ur.unit_id
      WHERE
        ur.village_id = $village_id;
    `,
    bind: { $village_id: villageId },
    schema: getResearchedUnitsRowSchema,
  });

  return rows.map(mapResearchedUnitRowToDto);
});
