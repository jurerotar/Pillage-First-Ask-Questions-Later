import { z } from 'zod';
import { unitImprovementDtoSchema } from '@pillage-first/types/dtos/unit';
import { selectPlayerUnitImprovementsQuery } from '../../queries/unit-queries';
import { createController } from '../controller';
import { mapUnitImprovementRowToDto } from './mappers/unit-mapper';
import { getUnitImprovementsRowSchema } from './schemas/unit-improvement-schemas';

export const getUnitImprovements = createController(
  '/players/:playerId/unit-improvements',
  {
    summary: 'Get unit improvements',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: z.array(unitImprovementDtoSchema),
  },
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectPlayerUnitImprovementsQuery,
    bind: {
      $player_id: playerId,
    },
    schema: getUnitImprovementsRowSchema,
  });

  return rows.map(mapUnitImprovementRowToDto);
});
