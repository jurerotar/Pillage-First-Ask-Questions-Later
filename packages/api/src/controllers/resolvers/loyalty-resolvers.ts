import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import { createEvents } from '../utils/create-event';

export const loyaltyIncreaseResolver: Resolver<GameEvent<'loyaltyIncrease'>> = (
  database,
  args,
) => {
  database.exec({
    sql: `
      UPDATE loyalties
      SET loyalty = loyalty + COALESCE(
        (
          SELECT 1 + COALESCE(
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
          )
          FROM
            villages v
          WHERE
            v.tile_id = loyalties.tile_id
        ),
        1
      );
    `,
  });

  database.exec({
    sql: 'DELETE FROM loyalties WHERE loyalty >= 100;',
  });

  createEvents<'loyaltyIncrease'>(database, {
    ...args,
    startsAt: args.resolvesAt,
    type: 'loyaltyIncrease',
  });
};
