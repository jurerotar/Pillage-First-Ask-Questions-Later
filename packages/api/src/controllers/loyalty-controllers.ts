import { z } from 'zod';
import { createController } from '../utils/controller';

export const getTileLoyalty = createController('/tiles/:tileId/loyalty')(
  ({ database, path: { tileId } }) => {
    const result = database.selectObject({
      sql: 'SELECT loyalty FROM loyalties WHERE tile_id = $tile_id',
      bind: { $tile_id: tileId },
      schema: z.strictObject({ loyalty: z.number() }),
    });

    return {
      loyalty: result?.loyalty ?? 100,
    };
  },
);
