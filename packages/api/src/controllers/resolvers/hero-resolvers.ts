import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateHealthRegenerationEventDuration } from '@pillage-first/game-assets/utils/hero';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import { insertHeroEffectsQuery } from '../../utils/queries/effect-queries';
import { updateVillageResourcesAt } from '../../utils/village';
import { createEvents } from '../utils/create-event';
import { addTroops } from './utils/troops';

export const heroRevivalResolver: Resolver<GameEvent<'heroRevival'>> = (
  database,
  args,
) => {
  const { resolvesAt } = args;

  const { villageId, tileId, healthRegeneration, speed } =
    database.selectObject({
      sql: `
      SELECT
        villages.id AS villageId,
        villages.tile_id AS tileId,
        heroes.health_regeneration AS healthRegeneration,
        servers.speed AS speed
      FROM heroes
      JOIN villages ON heroes.village_id = villages.id
      JOIN servers ON 1 = 1
      WHERE heroes.player_id = $player_id;
    `,
      bind: {
        $player_id: PLAYER_ID,
      },
      schema: z.strictObject({
        villageId: z.number(),
        tileId: z.number(),
        healthRegeneration: z.number(),
        speed: z.number(),
      }),
    })!;

  updateVillageResourcesAt(database, villageId, resolvesAt);

  database.exec({
    sql: 'UPDATE heroes SET health = 100 WHERE player_id = $player_id;',
    bind: { $player_id: PLAYER_ID },
  });

  database.exec({
    sql: insertHeroEffectsQuery,
    bind: { $player_id: PLAYER_ID },
  });

  addTroops(database, [
    {
      unitId: 'HERO',
      amount: 1,
      tileId: tileId,
      source: tileId,
    },
  ]);

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
};

export const heroHealthRegenerationResolver: Resolver<
  GameEvent<'heroHealthRegeneration'>
> = (database, args) => {
  const { resolvesAt } = args;

  database.exec({
    sql: 'UPDATE heroes SET health = MIN(health + 1, 100) WHERE player_id = $player_id AND health > 0;',
    bind: { $player_id: PLAYER_ID },
  });

  const { health, healthRegeneration, speed } = database.selectObject({
    sql: `
      SELECT
        heroes.health AS health,
        heroes.health_regeneration AS healthRegeneration,
        servers.speed AS speed
      FROM heroes
      JOIN servers ON 1 = 1
      WHERE heroes.player_id = $player_id;
    `,
    bind: {
      $player_id: PLAYER_ID,
    },
    schema: z.strictObject({
      health: z.number(),
      healthRegeneration: z.number(),
      speed: z.number(),
    }),
  })!;

  // Don't start an event if hero is at full health
  if (health === 100) {
    return;
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
};
