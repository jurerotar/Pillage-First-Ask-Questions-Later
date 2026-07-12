import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectTileLoyaltyQuery } from '../queries/loyalty-queries';
import { createEvents } from './create-event';

export const createLoyaltyIncreaseEvent = (
  database: DbFacade,
  startsAt = Date.now(),
) => {
  const hasPendingLoyaltyIncreaseEvent = database.selectValue({
    sql: `
      SELECT
        EXISTS
        (
          SELECT 1
          FROM
            events
          WHERE
            type = 'loyaltyIncrease'
            AND resolves_at > $now
          ) AS event_exists;
    `,
    bind: {
      $now: Date.now(),
    },
    schema: z.coerce.boolean(),
  });

  if (hasPendingLoyaltyIncreaseEvent) {
    return;
  }

  createEvents<'loyaltyIncrease'>(database, {
    villageId: null,
    startsAt,
    type: 'loyaltyIncrease',
  });
};

export const adjustLoyalty = (
  database: DbFacade,
  tileId: number,
  amount: number,
) => {
  database.exec({
    sql: `
      INSERT INTO loyalties
      VALUES
        ($tile_id, MAX(0, MIN(100, 100 + $amount))) ON CONFLICT DO
      UPDATE
      SET
        loyalty = MAX(0, MIN(100, loyalty + $amount))
    `,
    bind: {
      $tile_id: tileId,
      $amount: amount,
    },
  });
};

export const getLoyalty = (database: DbFacade, tileId: number): number => {
  const loyalty = database.selectValue({
    sql: selectTileLoyaltyQuery,
    bind: {
      $tile_id: tileId,
    },
    schema: z.int(),
  });

  return loyalty ?? 100;
};
