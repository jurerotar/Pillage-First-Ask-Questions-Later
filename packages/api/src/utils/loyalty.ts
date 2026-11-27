import { z } from 'zod';
import {
  calculateLoyaltyIncreaseInterval,
  getLoyaltyAt,
  getNextLoyaltyIncreaseAt,
} from '@pillage-first/game-assets/utils/loyalty';
import type { TileLoyaltyDto } from '@pillage-first/types/dtos/loyalty';
import { speedSchema } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectTileLoyaltyQuery } from '../queries/loyalty-queries';

const loyaltyRowSchema = z.strictObject({
  serverCreatedAt: z.number(),
  speed: speedSchema,
  loyalty: z.number(),
  nextLoyaltyIncreaseAt: z.number().nullable(),
  loyaltyIncreaseAmount: z.number(),
});

const selectLoyalty = (database: DbFacade, tileId: number) => {
  const { serverCreatedAt, speed, ...state } = database.selectObject({
    sql: selectTileLoyaltyQuery,
    bind: { $tile_id: tileId },
    schema: loyaltyRowSchema,
  })!;

  return {
    serverCreatedAt,
    snapshot: {
      ...state,
      loyaltyIncreaseInterval: calculateLoyaltyIncreaseInterval(speed),
    },
  };
};

const saveLoyalty = (
  database: DbFacade,
  tileId: number,
  {
    loyalty,
    nextLoyaltyIncreaseAt,
  }: Pick<TileLoyaltyDto, 'loyalty' | 'nextLoyaltyIncreaseAt'>,
) => {
  if (nextLoyaltyIncreaseAt === null) {
    database.exec({
      sql: 'DELETE FROM loyalties WHERE tile_id = $tile_id;',
      bind: { $tile_id: tileId },
    });
    return;
  }

  database.exec({
    sql: `
      INSERT INTO loyalties (tile_id, loyalty, next_loyalty_increase_at)
      VALUES ($tile_id, $loyalty, $next_at)
      ON CONFLICT (tile_id) DO UPDATE SET
        loyalty = excluded.loyalty,
        next_loyalty_increase_at = excluded.next_loyalty_increase_at;
    `,
    bind: {
      $tile_id: tileId,
      $loyalty: loyalty,
      $next_at: nextLoyaltyIncreaseAt,
    },
  });
};

export const getLoyalty = (
  database: DbFacade,
  tileId: number,
  timestamp = Date.now(),
) => getLoyaltyAt(selectLoyalty(database, tileId).snapshot, timestamp);

export const materializeLoyaltyAt = (
  database: DbFacade,
  tileId: number,
  timestamp: number,
) => {
  const { snapshot } = selectLoyalty(database, tileId);
  const current = getLoyaltyAt(snapshot, timestamp);

  if (current !== snapshot) {
    saveLoyalty(database, tileId, current);
  }
};

export const adjustLoyalty = (
  database: DbFacade,
  tileId: number,
  amount: number,
  timestamp = Date.now(),
) => {
  const { serverCreatedAt, snapshot } = selectLoyalty(database, tileId);
  const current = getLoyaltyAt(snapshot, timestamp);
  const loyalty = Math.max(0, Math.min(100, current.loyalty + amount));
  const nextLoyaltyIncreaseAt =
    loyalty === 100
      ? null
      : (current.nextLoyaltyIncreaseAt ??
        getNextLoyaltyIncreaseAt(
          serverCreatedAt,
          current.loyaltyIncreaseInterval,
          timestamp,
        ));

  saveLoyalty(database, tileId, { loyalty, nextLoyaltyIncreaseAt });
};
