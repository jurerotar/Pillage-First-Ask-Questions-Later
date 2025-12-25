import { batchInsert } from 'app/db/utils/batch-insert';
import type { Seeder } from 'app/interfaces/db';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const eventsSeeder: Seeder = (database, server): void => {
  const eventsToInsert: [
    GameEvent['type'],
    GameEvent['startsAt'],
    GameEvent['duration'],
    GameEvent['villageId'] | null,
    string | null,
  ][] = [];

  // Seed internal table after 5 seconds. We're pretty sure backend won't be occupied at that time
  eventsToInsert.push([
    '__internal__seedOasisOccupiableByTable',
    server.createdAt,
    5000,
    null,
    null,
  ]);

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
