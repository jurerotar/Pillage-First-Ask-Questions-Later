import { z } from 'zod';
import { createController } from '../http/controller';
import { selectTileLoyaltyQuery } from '../queries/loyalty-queries';

export const getTileLoyalty = createController('/tiles/:tileId/loyalty')(
  ({ database, path: { tileId } }) => {
    const result = database.selectObject({
      sql: selectTileLoyaltyQuery,
      bind: { $tile_id: tileId },
      schema: z.strictObject({ loyalty: z.number() }),
    });

    return {
      loyalty: result?.loyalty ?? 100,
    };
  },
);
