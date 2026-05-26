import { createController } from '../http/controller';
import { mapResearchedUnitRowToDto } from '../mappers/unit-mapper';
import { selectVillageResearchedUnitsQuery } from '../queries/unit-queries';
import { getResearchedUnitsRowSchema } from '../schemas/unit-research-schemas';

export const getResearchedUnits = createController(
  '/villages/:villageId/researched-units',
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectVillageResearchedUnitsQuery,
    bind: { $village_id: villageId },
    schema: getResearchedUnitsRowSchema,
  });

  return rows.map(mapResearchedUnitRowToDto);
});
