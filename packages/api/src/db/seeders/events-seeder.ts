import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const eventsSeeder = (database: DbFacade, _server: Server): void => {
  const eventsToInsert: [
    GameEvent['type'],
    GameEvent['startsAt'],
    GameEvent['duration'],
    GameEvent['villageId'] | null,
    string | null,
  ][] = [];

  batchInsert(
    database,
    'events',
    ['type', 'starts_at', 'duration', 'village_id', 'meta'],
    eventsToInsert,
  );
};
