import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { createLoyaltyIncreaseEvent } from '../../../utils/loyalty';
import type { Resolver } from '../resolver';

export const loyaltyIncreaseResolver: Resolver<GameEvent<'loyaltyIncrease'>> = (
  database,
  args,
) => {
  const { resolvesAt } = args;

  const affectedIds = database.selectValues({
    sql: `
      SELECT DISTINCT v.id AS villageId
      FROM
        loyalties l
          JOIN villages v ON v.tile_id = l.tile_id
      WHERE
        v.player_id = $player_id;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  });

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

  return {
    affectedVillageIds: affectedIds,
  };
};
