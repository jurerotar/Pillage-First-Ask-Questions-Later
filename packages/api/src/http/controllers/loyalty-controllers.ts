import { z } from 'zod';
import { tileLoyaltyDtoSchema } from '@pillage-first/types/dtos/loyalty';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { getLoyalty } from '../../utils/loyalty';
import { createController } from '../controller';

export const getTileLoyalty = createController('/tiles/:tileId/loyalty', {
  summary: 'Get current loyalty of a tile',
  requestParams: {
    path: z.strictObject({
      tileId: z.coerce.number().pipe(tileIdSchema),
    }),
  },
  response: tileLoyaltyDtoSchema,
})(({ database, path: { tileId } }) => {
  return { loyalty: getLoyalty(database, tileId) };
});
