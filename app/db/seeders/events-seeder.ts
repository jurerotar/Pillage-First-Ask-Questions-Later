import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const eventsSeeder: Seeder = (database, server): void => {
  const eventsToInsert: [
    string,
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
    crypto.randomUUID(),
    'adventurePointIncrease',
    server.createdAt,
    adventurePointsIncreaseEventDuration,
    null,
    null,
  ]);

  batchInsert(
    database,
    'events',
    ['id', 'type', 'starts_at', 'duration', 'village_id', 'meta'],
    eventsToInsert,
  );
};
