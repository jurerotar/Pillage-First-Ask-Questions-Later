import { z } from 'zod';
import { tileLoyaltyDtoSchema } from '@pillage-first/types/dtos/loyalty';
import { selectTileLoyaltyQuery } from '../../queries/loyalty-queries';
import { createController } from '../controller';

export const getTileLoyalty = createController('/tiles/:tileId/loyalty', {
  summary: 'Get current loyalty of a tile',
  requestParams: {
    path: z.strictObject({
      tileId: z.coerce.number(),
    }),
  },
  response: tileLoyaltyDtoSchema,
})(({ database, path: { tileId } }) => {
  const result = database.selectObject({
    sql: selectTileLoyaltyQuery,
    bind: { $tile_id: tileId },
    schema: z.strictObject({ loyalty: z.number() }),
  });

  return {
    loyalty: result?.loyalty ?? 100,
  };
});
