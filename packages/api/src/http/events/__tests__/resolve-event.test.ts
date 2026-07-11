import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createTroopTrainingEventMock } from '@pillage-first/mocks/event';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { insertEvents } from '../../../utils/events';
import { createSchedulerDataSource } from '../scheduler/scheduler-data-source';

describe('resolveEvent', () => {
  test('trapperCageProduction creates free cage rows', async () => {
    const database = await prepareTestDatabase();

    const villageId = database.selectValue({
      sql: 'SELECT id FROM villages ORDER BY id LIMIT 1;',
      schema: z.number(),
    })!;

    const event: GameEvent<'trapperCageProduction'> = {
      id: 0,
      type: 'trapperCageProduction',
      startsAt: 1000,
      duration: 1000,
      resolvesAt: 2000,
      villageId,
      cageAmount: 4,
    };

    insertEvents(database, [event]);

    const eventId = database.selectValue({
      sql: "SELECT id FROM events WHERE type = 'trapperCageProduction';",
      schema: z.number(),
    })!;

    createSchedulerDataSource(database).resolveEvent(eventId);

    const stats = database.selectObject({
      sql: `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE unit_id IS NULL) AS free
        FROM trapper_cages
        WHERE village_id = $village_id;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        total: z.number(),
        free: z.number(),
      }),
    })!;

    expect(stats).toStrictEqual({
      total: 4,
      free: 4,
    });
  });

  test('rolls back event deletion and resolver changes when a resolver fails', async () => {
    const database = await prepareTestDatabase();
    using consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const village = database.selectObject({
      sql: `
        SELECT id, tile_id AS tileId
        FROM villages
        ORDER BY id
        LIMIT 1;
      `,
      schema: z.strictObject({
        id: z.number(),
        tileId: z.number(),
      }),
    })!;

    const legionnaireAmountBefore =
      database.selectValue({
        sql: `
          SELECT amount
          FROM troops
          WHERE
            tile_id = $tile_id
            AND source_tile_id = $tile_id
            AND unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE');
        `,
        bind: { $tile_id: village.tileId },
        schema: z.number(),
      }) ?? 0;

    database.exec({
      sql: 'DELETE FROM resource_sites WHERE tile_id = $tile_id;',
      bind: { $tile_id: village.tileId },
    });

    insertEvents(database, [
      createTroopTrainingEventMock({
        startsAt: 1000,
        duration: 1000,
        villageId: village.id,
        unitId: 'LEGIONNAIRE',
      }),
    ]);

    const eventId = database.selectValue({
      sql: "SELECT id FROM events WHERE type = 'troopTraining';",
      schema: z.number(),
    })!;

    expect(() =>
      createSchedulerDataSource(database).resolveEvent(eventId),
    ).toThrow();

    const eventCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM events WHERE id = $event_id;',
      bind: { $event_id: eventId },
      schema: z.number(),
    });

    const legionnaireAmountAfter =
      database.selectValue({
        sql: `
          SELECT amount
          FROM troops
          WHERE
            tile_id = $tile_id
            AND source_tile_id = $tile_id
            AND unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE');
        `,
        bind: { $tile_id: village.tileId },
        schema: z.number(),
      }) ?? 0;

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(eventCount).toBe(1);
    expect(legionnaireAmountAfter).toBe(legionnaireAmountBefore);
  });
});
