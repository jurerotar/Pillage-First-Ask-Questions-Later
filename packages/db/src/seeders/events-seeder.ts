import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateAdventurePointIncreaseEventDuration } from '@pillage-first/game-assets/utils/adventures';
import { calculateHealthRegenerationEventDuration } from '@pillage-first/game-assets/utils/hero';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const eventsSeeder = (database: DbFacade, server: Server): void => {
  const eventsToInsert: [
    GameEvent['type'],
    GameEvent['startsAt'],
    GameEvent['duration'],
    GameEvent['villageId'] | null,
    string | null,
  ][] = [];

  eventsToInsert.push([
    'adventurePointIncrease',
    server.createdAt,
    calculateAdventurePointIncreaseEventDuration(
      server.createdAt,
      server.configuration.speed,
    ),
    null,
    null,
  ]);

  const heroHealthRegeneration = database.selectValue({
    sql: 'SELECT health_regeneration FROM heroes WHERE player_id = $player_id;',
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  })!;

  eventsToInsert.push([
    'heroHealthRegeneration',
    server.createdAt,
    calculateHealthRegenerationEventDuration(
      heroHealthRegeneration,
      server.configuration.speed,
    ),
    null,
    null,
  ]);

  batchInsert(
    database,
    'events',
    ['type', 'starts_at', 'duration', 'village_id', 'meta'],
    eventsToInsert,
  );
};
