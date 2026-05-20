import { prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  calculateAdventurePointsEarnedBetween,
  calculateNextAdventurePointIncreaseAt,
} from '@pillage-first/game-assets/utils/adventures';
import { speedSchema } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';

export const calculateAdventureDuration = (
  database: DbFacade,
  isReturningFromAdventure: boolean,
) => {
  // To calculate return duration, check completed - 1, since this returns the duration players would have before
  // completing current adventure
  const completedAdventureCountModifier = isReturningFromAdventure ? 1 : 0;

  const { seed, speed, completed } = database.selectObject({
    sql: `
      SELECT
        (
          SELECT
            seed
          FROM
            servers
          LIMIT 1
          ) AS seed,
        (
          SELECT
            speed
          FROM
            servers
          LIMIT 1
          ) AS speed,
        (
          SELECT ha.completed - $completed_adventure_count_modifier
          FROM
            hero_adventures ha
              JOIN heroes h ON ha.hero_id = h.id
          WHERE
            h.player_id = $player_id
          ) AS completed
    `,
    bind: {
      $player_id: PLAYER_ID,
      $completed_adventure_count_modifier: completedAdventureCountModifier,
    },
    schema: z.strictObject({
      seed: z.string(),
      speed: z.number(),
      completed: z.number(),
    }),
  })!;

  const adventurePrng = prngMulberry32(`${seed}${completed}`);

  const adventureDuration =
    (seededRandomIntFromInterval(adventurePrng, 8, 12) * 60_000) / speed;

  return adventureDuration;
};

const heroAdventureStateSchema = z.strictObject({
  available: z.number(),
  completed: z.number(),
  lastUpdatedAt: z.number(),
  createdAt: z.number(),
  speed: speedSchema,
});

export const getHeroAdventureStateAt = (
  database: DbFacade,
  heroId: number,
  timestamp: number,
) => {
  const state = database.selectObject({
    sql: `
      SELECT
        ha.available,
        ha.completed,
        ha.last_updated_at AS lastUpdatedAt,
        s.created_at AS createdAt,
        s.speed
      FROM
        hero_adventures ha
          JOIN servers s ON 1 = 1
      WHERE
        ha.hero_id = $hero_id
    `,
    bind: {
      $hero_id: heroId,
    },
    schema: heroAdventureStateSchema,
  })!;

  const earnedSinceLastUpdate = calculateAdventurePointsEarnedBetween(
    state.createdAt,
    state.speed,
    state.lastUpdatedAt,
    timestamp,
  );

  return {
    ...state,
    available: state.available + earnedSinceLastUpdate,
    nextAvailableAt: calculateNextAdventurePointIncreaseAt(
      state.createdAt,
      state.speed,
      timestamp,
    ),
  };
};

export const getPlayerHeroAdventureStateAt = (
  database: DbFacade,
  timestamp: number,
) => {
  const heroId = database.selectValue({
    sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
    bind: {
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  })!;

  return getHeroAdventureStateAt(database, heroId, timestamp);
};

export const materializeHeroAdventurePointsAt = (
  database: DbFacade,
  heroId: number,
  timestamp: number,
) => {
  const state = getHeroAdventureStateAt(database, heroId, timestamp);

  database.exec({
    sql: `
      UPDATE hero_adventures
      SET
        available = $available,
        last_updated_at = $last_updated_at
      WHERE
        hero_id = $hero_id
    `,
    bind: {
      $hero_id: heroId,
      $available: state.available,
      $last_updated_at: timestamp,
    },
  });

  return state;
};
