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

  // Adventure points increase event. Initially, a point is added every 8h, divided by server speed
  const adventurePointsIncreaseEventDuration = Math.trunc(
    (8 / server.configuration.speed) * 60 * 60 * 1000,
  );

  eventsToInsert.push([
    'adventurePointIncrease',
    server.createdAt,
    adventurePointsIncreaseEventDuration,
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
