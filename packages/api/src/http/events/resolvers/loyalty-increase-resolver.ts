import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateLoyaltyIncreaseEventDuration } from '@pillage-first/game-assets/utils/loyalty';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { speedSchema } from '@pillage-first/types/models/server';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { createLoyaltyIncreaseEvent } from '../../../utils/loyalty';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveLoyaltyIncrease: Resolver<GameEvent<'loyaltyIncrease'>> = (
  database,
  args,
  createEvents,
) => {
  const { resolvesAt } = args;

  const affectedVillages = database.selectObjects({
    sql: `
      SELECT v.id AS villageId, v.tile_id AS tileId
      FROM
        loyalties l
          JOIN villages v ON v.tile_id = l.tile_id
      WHERE
        v.player_id = $player_id;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: z.strictObject({
      villageId: z.number(),
      tileId: tileIdSchema,
    }),
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
                  CROSS JOIN building_ids bi ON bi.id = bf.building_id
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
    createLoyaltyIncreaseEvent(createEvents, database, resolvesAt);
  }

  return {
    affectedVillageIds: affectedVillages.map(({ villageId }) => villageId),
    affectedTileIds: affectedVillages.map(({ tileId }) => tileId),
  };
};

export const loyaltyIncreaseResolver = defineEventResolver<'loyaltyIncrease'>(
  (database) => ({
    duration: (startsAt) => {
      const { createdAt, speed } = database.selectObject({
        sql: 'SELECT created_at AS createdAt, speed FROM servers LIMIT 1;',
        schema: z.strictObject({
          createdAt: z.number(),
          speed: speedSchema,
        }),
      })!;

      const loyaltyIncreaseDuration =
        calculateLoyaltyIncreaseEventDuration(speed);
      const elapsedSinceServerStart = startsAt - createdAt;
      const timeUntilNextIncrease =
        (loyaltyIncreaseDuration -
          (elapsedSinceServerStart % loyaltyIncreaseDuration)) %
        loyaltyIncreaseDuration;

      return timeUntilNextIncrease || loyaltyIncreaseDuration;
    },
  }),
  resolveLoyaltyIncrease,
);
