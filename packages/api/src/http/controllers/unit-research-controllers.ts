import { z } from 'zod';
import { researchedUnitDtoSchema } from '@pillage-first/types/dtos/unit';
import { selectVillageResearchedUnitsQuery } from '../../queries/unit-queries';
import { createController } from '../controller';
import { mapResearchedUnitRowToDto } from './mappers/unit-mapper';
import { getResearchedUnitsRowSchema } from './schemas/unit-research-schemas';

export const getResearchedUnits = createController(
  '/villages/:villageId/researched-units',
  {
    summary: 'Get researched units in village',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(researchedUnitDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectVillageResearchedUnitsQuery,
    bind: { $village_id: villageId },
    schema: getResearchedUnitsRowSchema,
  });

  return rows.map(mapResearchedUnitRowToDto);
});
