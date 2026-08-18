import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  calculateGatherersHutPartySize,
  GATHERERS_HUT_RESOURCES_PER_UNIT,
} from '@pillage-first/game-assets/utils/gatherers-hut';
import { createGameEventMock } from '@pillage-first/mocks/event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../create-event';
import {
  getEventDuration,
  runEventCreationSideEffects,
  validateEventCreationPrerequisites,
} from '../events';

const setDevFlag = (database: DbFacade, column: string, value: number) => {
  database.exec({
    sql: `UPDATE developer_settings SET ${column} = $value`,
    bind: { $value: value },
  });
};

const setGatherersHutLevel = (
  database: DbFacade,
  villageId: number,
  level: number,
) => {
  database.exec({
    sql: `
      INSERT INTO
        building_fields (village_id, field_id, building_id, level)
      SELECT
        $village_id, 20, id, $level
      FROM
        building_ids
      WHERE
        building = 'GATHERERS_HUT'
      ON CONFLICT(village_id, field_id) DO UPDATE SET
        building_id = EXCLUDED.building_id,
        level = EXCLUDED.level;
    `,
    bind: {
      $village_id: villageId,
      $level: level,
    },
  });
};

const getVillageTileId = (database: DbFacade, villageId: number): number => {
  return database.selectValue({
    sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
    bind: {
      $village_id: villageId,
    },
    schema: z.number(),
  })!;
};

const setIdleTroops = (
  database: DbFacade,
  unitId: string,
  amount: number,
  tileId: number,
) => {
  database.exec({
    sql: `
      DELETE FROM troops
      WHERE
        unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)
        AND tile_id = $tile_id
        AND source_tile_id = $tile_id;
    `,
    bind: {
      $unit_id: unitId,
      $tile_id: tileId,
    },
  });

  database.exec({
    sql: `
      INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
      SELECT id, $amount, $tile_id, $tile_id
      FROM unit_ids
      WHERE unit = $unit_id;
    `,
    bind: {
      $unit_id: unitId,
      $amount: amount,
      $tile_id: tileId,
    },
  });
};

describe('gatherers hut events', () => {
  test('party size follows the gatherers hut growth curve', () => {
    expect(GATHERERS_HUT_RESOURCES_PER_UNIT).toBe(4);

    const targetPartySizes = [
      14, 17, 19, 23, 27, 32, 38, 46, 55, 67, 81, 98, 120, 147, 180, 220, 271,
      334, 412, 508,
    ];
    const generatedPartySizes = Array.from({ length: 20 }, (_, index) =>
      calculateGatherersHutPartySize(index + 1),
    );

    expect(generatedPartySizes[0]).toBe(targetPartySizes[0]);
    expect(generatedPartySizes.at(-1)).toBe(targetPartySizes.at(-1));
    expect(
      generatedPartySizes.every((partySize, index) => {
        return Math.abs(partySize - targetPartySizes[index]) <= 1;
      }),
    ).toBe(true);
  });

  test("gatherersHutGatheringTrip - should throw if Gatherer's Hut does not exist", async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const villageTileId = getVillageTileId(database, villageId);

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createGameEventMock('gatherersHutGatheringTrip', {
          villageId,
          troops: [
            {
              unitId: 'PHALANX',
              amount: 1,
              tileId: villageTileId,
              sourceTileId: villageTileId,
            },
          ],
        }),
      ),
    ).toThrow("Gatherer's Hut does not exist");
  });

  test('gatherersHutGatheringTrip - should enforce party size by hut level', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const villageTileId = getVillageTileId(database, villageId);

    setGatherersHutLevel(database, villageId, 1);
    setIdleTroops(database, 'PHALANX', 15, villageTileId);

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createGameEventMock('gatherersHutGatheringTrip', {
          villageId,
          troops: [
            {
              unitId: 'PHALANX',
              amount: 15,
              tileId: villageTileId,
              sourceTileId: villageTileId,
            },
          ],
        }),
      ),
    ).toThrow("Gatherer's Hut party size exceeded");
  });

  test('gatherersHutGatheringTrip - should require idle home troops', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const villageTileId = getVillageTileId(database, villageId);

    setGatherersHutLevel(database, villageId, 1);

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createGameEventMock('gatherersHutGatheringTrip', {
          villageId,
          troops: [
            {
              unitId: 'PHALANX',
              amount: 1,
              tileId: villageTileId,
              sourceTileId: villageTileId + 1,
            },
          ],
        }),
      ),
    ).toThrow('Gathering trips can only include idle home troops');
  });

  test("gatherersHutGatheringTrip - should require troops from player's tribe", async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const villageTileId = getVillageTileId(database, villageId);

    setGatherersHutLevel(database, villageId, 1);
    setIdleTroops(database, 'LEGIONNAIRE', 1, villageTileId);

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createGameEventMock('gatherersHutGatheringTrip', {
          villageId,
          troops: [
            {
              unitId: 'LEGIONNAIRE',
              amount: 1,
              tileId: villageTileId,
              sourceTileId: villageTileId,
            },
          ],
        }),
      ),
    ).toThrow("Gathering trips can only include troops from player's tribe");
  });

  test('gatherersHutGatheringTrip - should reject hero', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const villageTileId = getVillageTileId(database, villageId);

    setGatherersHutLevel(database, villageId, 1);

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createGameEventMock('gatherersHutGatheringTrip', {
          villageId,
          troops: [
            {
              unitId: 'HERO',
              amount: 1,
              tileId: villageTileId,
              sourceTileId: villageTileId,
            },
          ],
        }),
      ),
    ).toThrow('Gathering trips can only include regular troops');
  });

  test('gatherersHutGatheringTrip - should require enough idle troops', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const villageTileId = getVillageTileId(database, villageId);

    setGatherersHutLevel(database, villageId, 1);
    setIdleTroops(database, 'PHALANX', 1, villageTileId);

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createGameEventMock('gatherersHutGatheringTrip', {
          villageId,
          troops: [
            {
              unitId: 'PHALANX',
              amount: 2,
              tileId: villageTileId,
              sourceTileId: villageTileId,
            },
          ],
        }),
      ),
    ).toThrow('Not enough idle troops available');
  });

  test('gatherersHutGatheringTrip - should allow one trip at a time', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const villageTileId = getVillageTileId(database, villageId);

    setGatherersHutLevel(database, villageId, 1);
    setIdleTroops(database, 'PHALANX', 10, villageTileId);

    createEvents<'gatherersHutGatheringTrip'>(database, {
      type: 'gatherersHutGatheringTrip',
      villageId,
      troops: [
        {
          unitId: 'PHALANX',
          amount: 1,
          tileId: villageTileId,
          sourceTileId: villageTileId,
        },
      ],
    });

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createGameEventMock('gatherersHutGatheringTrip', {
          villageId,
          troops: [
            {
              unitId: 'PHALANX',
              amount: 1,
              tileId: villageTileId,
              sourceTileId: villageTileId,
            },
          ],
        }),
      ),
    ).toThrow("Gatherer's Hut is busy");
  });

  test('gatherersHutGatheringTrip - should remove troops when created', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const villageTileId = getVillageTileId(database, villageId);

    setIdleTroops(database, 'PHALANX', 10, villageTileId);

    runEventCreationSideEffects(database, [
      createGameEventMock('gatherersHutGatheringTrip', {
        villageId,
        troops: [
          {
            unitId: 'PHALANX',
            amount: 4,
            tileId: villageTileId,
            sourceTileId: villageTileId,
          },
        ],
      }),
    ]);

    const remainingTroops = database.selectValue({
      sql: `
        SELECT amount
        FROM troops
        WHERE
          unit_id = (SELECT id FROM unit_ids WHERE unit = 'PHALANX')
          AND tile_id = $tile_id
          AND source_tile_id = $tile_id;
      `,
      bind: {
        $tile_id: villageTileId,
      },
      schema: z.number(),
    })!;

    expect(remainingTroops).toBe(6);
  });

  test('gatherersHutGatheringTrip - should use 48 to 72 minute duration range', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const villageTileId = getVillageTileId(database, villageId);
    const now = 1_000_000;

    vi.useFakeTimers();
    vi.setSystemTime(now);

    const duration = getEventDuration(
      database,
      createGameEventMock('gatherersHutGatheringTrip', {
        villageId,
        startsAt: now,
        troops: [
          {
            unitId: 'PHALANX',
            amount: 1,
            tileId: villageTileId,
            sourceTileId: villageTileId,
          },
        ],
      }),
    );

    expect(duration).toBeGreaterThanOrEqual(48 * 60_000);
    expect(duration).toBeLessThanOrEqual(72 * 60_000);

    vi.useRealTimers();
  });

  test('gatherersHutGatheringTrip - should lock duration to completed trip count', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const villageTileId = getVillageTileId(database, villageId);

    const event = createGameEventMock('gatherersHutGatheringTrip', {
      villageId,
      startsAt: 1_000_000,
      troops: [
        {
          unitId: 'PHALANX',
          amount: 1,
          tileId: villageTileId,
          sourceTileId: villageTileId,
        },
      ],
    });

    const retriedEvent = createGameEventMock('gatherersHutGatheringTrip', {
      villageId,
      startsAt: 2_000_000,
      troops: event.troops,
    });

    expect(getEventDuration(database, retriedEvent)).toBe(
      getEventDuration(database, event),
    );
  });

  test('gatherersHutGatheringTrip - should return zero duration if instant unit travel enabled', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const villageTileId = getVillageTileId(database, villageId);

    setDevFlag(database, 'is_instant_unit_travel_enabled', 1);

    expect(
      getEventDuration(
        database,
        createGameEventMock('gatherersHutGatheringTrip', {
          villageId,
          troops: [
            {
              unitId: 'PHALANX',
              amount: 1,
              tileId: villageTileId,
              sourceTileId: villageTileId,
            },
          ],
        }),
      ),
    ).toBe(0);
  });
});
