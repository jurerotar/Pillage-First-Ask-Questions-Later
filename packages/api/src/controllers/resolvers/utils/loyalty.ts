import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../../utils/create-event';

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
