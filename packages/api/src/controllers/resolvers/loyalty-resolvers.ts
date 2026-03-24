import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import { createEvents } from '../utils/create-event';

export const loyaltyIncreaseResolver: Resolver<GameEvent<'loyaltyIncrease'>> = (
  database,
  args,
) => {
  const { villageId } = args;

  const { residenceLevel, tileId } = database.selectObject({
    sql: `
      SELECT
        v.tile_id AS tileId,
        COALESCE(
          (
            SELECT
              bf.level
            FROM
              building_fields bf
                JOIN building_ids bi ON bi.id = bf.building_id
            WHERE
              bf.village_id = v.id
              AND bi.building = 'RESIDENCE'
            LIMIT 1
            ),
          0
        ) AS residenceLevel
      FROM
        villages v
      WHERE
        v.id = $village_id;
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      tileId: z.number(),
      residenceLevel: z.number(),
    }),
  })!;

  database.exec({
    sql: 'UPDATE loyalties SET loyalty = loyalty + $increment WHERE tile_id = $tile_id;',
    bind: { $increment: 1 + residenceLevel, $tile_id: tileId },
  });

  database.exec({
    sql: 'DELETE FROM loyalties WHERE tile_id = $tile_id AND loyalty >= 100;',
    bind: { $tile_id: tileId },
  });

  createEvents<'loyaltyIncrease'>(database, {
    ...args,
    startsAt: args.resolvesAt,
    type: 'loyaltyIncrease',
  });
};
