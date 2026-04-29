import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import { createLoyaltyIncreaseEvent } from './utils/loyalty';

export const loyaltyIncreaseResolver: Resolver<GameEvent<'loyaltyIncrease'>> = (
  database,
  args,
) => {
  const { resolvesAt } = args;

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

  const hasLoyalties = database.selectValue({
    sql: 'SELECT EXISTS(SELECT 1 FROM loyalties);',
    schema: z.coerce.boolean(),
  })!;

  if (hasLoyalties) {
    createLoyaltyIncreaseEvent(database, resolvesAt);
  }
};
