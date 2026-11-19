import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateHealthRegenerationEventDuration } from '@pillage-first/game-assets/utils/hero';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { speedSchema } from '@pillage-first/types/models/server';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveHeroHealthRegeneration: Resolver<
  GameEvent<'heroHealthRegeneration'>
> = (database, args, createEvents) => {
  const { resolvesAt } = args;

  database.exec({
    sql: 'UPDATE heroes SET health = MIN(health + 1, 100) WHERE player_id = $player_id AND health > 0;',
    bind: { $player_id: PLAYER_ID },
  });

  const { health, healthRegeneration, speed, tileId, villageId } =
    database.selectObject({
      sql: `
        SELECT
          heroes.health AS health,
          villages.tile_id AS tileId,
          heroes.village_id AS villageId,
          heroes.health_regeneration AS healthRegeneration,
          servers.speed AS speed
        FROM heroes
        JOIN villages ON villages.id = heroes.village_id
        CROSS JOIN servers
        WHERE heroes.player_id = $player_id;
      `,
      bind: {
        $player_id: PLAYER_ID,
      },
      schema: z.strictObject({
        health: z.number(),
        tileId: tileIdSchema,
        villageId: z.number(),
        healthRegeneration: z.number(),
        speed: z.number(),
      }),
    })!;

  // Don't start an event if hero is at full health
  if (health === 100) {
    return {
      affectedVillageIds: [villageId],
      affectedTileIds: [tileId],
    };
  }

  const duration = calculateHealthRegenerationEventDuration(
    healthRegeneration,
    speed,
  );

  createEvents<'heroHealthRegeneration'>(database, {
    villageId: null,
    type: 'heroHealthRegeneration',
    startsAt: resolvesAt,
    duration,
  });

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [tileId],
  };
};

export const heroHealthRegenerationResolver =
  defineEventResolver<'heroHealthRegeneration'>(
    (database) => ({
      duration: () => {
        const { healthRegeneration, speed } = database.selectObject({
          sql: `
            SELECT
              health_regeneration AS healthRegeneration,
              servers.speed
            FROM
              heroes
              CROSS JOIN servers
            WHERE
              player_id = $player_id;
          `,
          bind: { $player_id: PLAYER_ID },
          schema: z.strictObject({
            healthRegeneration: z.number(),
            speed: speedSchema,
          }),
        })!;

        return calculateHealthRegenerationEventDuration(
          healthRegeneration,
          speed,
        );
      },
    }),
    resolveHeroHealthRegeneration,
  );
