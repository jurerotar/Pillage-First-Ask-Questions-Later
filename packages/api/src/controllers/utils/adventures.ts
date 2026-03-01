import { prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
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
