import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateHealthRegenerationEventDuration } from '@pillage-first/game-assets/utils/hero';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { deleteHeroEffectsQuery } from '../../../utils/queries/effect-queries';
import { updateVillageResourcesAt } from '../../../utils/village';
import { createEvents } from '../../utils/create-event';

export const onHeroDeath = (database: DbFacade, timestamp: number) => {
  const villageId = database.selectValue({
    sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id;',
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  })!;

  updateVillageResourcesAt(database, villageId, timestamp);

  database.exec({
    sql: deleteHeroEffectsQuery,
    bind: { $player_id: PLAYER_ID },
  });

  database.exec({
    sql: "DELETE FROM events WHERE type = 'heroHealthRegeneration';",
  });
};

export const createHeroHealthRegenerationEventByVillageId = (
  database: DbFacade,
  villageId: number,
  startsAt: number,
) => {
  const { healthRegeneration, speed } = database.selectObject({
    sql: `
      SELECT
        heroes.health_regeneration AS healthRegeneration,
        servers.speed AS speed
      FROM heroes
      JOIN servers ON 1 = 1
      WHERE heroes.player_id = (
        SELECT player_id
        FROM villages
        WHERE id = $village_id
      );
    `,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      healthRegeneration: z.number(),
      speed: z.number(),
    }),
  })!;

  const duration = calculateHealthRegenerationEventDuration(
    healthRegeneration,
    speed,
  );

  createEvents<'heroHealthRegeneration'>(database, {
    villageId: null,
    type: 'heroHealthRegeneration',
    startsAt,
    duration,
  });
};
