import type { SqlValue } from '@sqlite.org/sqlite-wasm';
import type { NewGameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { EventCreationArgs } from '../http/events/resolver';

const nonMetaEventProperties = new Set([
  'id',
  'type',
  'startsAt',
  'duration',
  'resolvesAt',
  'villageId',
]);

export const insertEvents = (
  database: DbFacade,
  events: NewGameEvent[],
): void => {
  if (events.length === 0) {
    return;
  }

  const rows: SqlValue[][] = [];

  for (const event of events) {
    let metaObj: Record<string, SqlValue> | null = null;

    for (const property in event) {
      if (nonMetaEventProperties.has(property)) {
        continue;
      }

      // Lazy object initialization
      metaObj ??= {};

      metaObj[property] = event[property as keyof NewGameEvent];
    }

    rows.push([
      event.type,
      event.startsAt,
      event.duration,
      event.villageId ?? null,
      metaObj ? JSON.stringify(metaObj) : null,
    ]);
  }

  // One JSON parameter avoids SQLite's bind-variable limit and lets every
  // batch size reuse the same cached statement. The insert remains atomic.
  database.exec({
    sql: `
      INSERT INTO events (
        type,
        starts_at,
        duration,
        village_id,
        meta
      )
      SELECT
        value ->> '$[0]',
        value ->> '$[1]',
        value ->> '$[2]',
        value ->> '$[3]',
        value ->> '$[4]'
      FROM
        jsonb_each($events);
    `,
    bind: { $events: JSON.stringify(rows) },
  });
};

export const insertEventBatch = (
  database: DbFacade,
  args: EventCreationArgs,
  startsAt: number,
  duration: number,
): NewGameEvent[] => {
  const amount = args.amount ?? 1;
  const events: NewGameEvent[] = Array.from({ length: amount });

  for (let i = 0; i < amount; i += 1) {
    const eventStartsAt = startsAt + i * duration;

    events[i] = {
      ...args,
      startsAt: eventStartsAt,
      duration,
      resolvesAt: eventStartsAt + duration,
    };
  }

  insertEvents(database, events);
  return events;
};
