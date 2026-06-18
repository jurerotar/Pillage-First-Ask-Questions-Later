import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { calculateGatherersHutPartySize } from '@pillage-first/game-assets/utils/gatherers-hut';
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
  test('party size increases non-linearly from 5 to 500', () => {
    expect(calculateGatherersHutPartySize(1)).toBe(5);
    expect(calculateGatherersHutPartySize(20)).toBe(500);

    const earlyIncrease =
      calculateGatherersHutPartySize(2) - calculateGatherersHutPartySize(1);
    const lateIncrease =
      calculateGatherersHutPartySize(20) - calculateGatherersHutPartySize(19);

    expect(lateIncrease).toBeGreaterThan(earlyIncrease);
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
              source: villageTileId,
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
    setIdleTroops(database, 'PHALANX', 6, villageTileId);

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createGameEventMock('gatherersHutGatheringTrip', {
          villageId,
          troops: [
            {
              unitId: 'PHALANX',
              amount: 6,
              tileId: villageTileId,
              source: villageTileId,
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
              source: villageTileId + 1,
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
              source: villageTileId,
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
              source: villageTileId,
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
              source: villageTileId,
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
          source: villageTileId,
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
              source: villageTileId,
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
            source: villageTileId,
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
            source: villageTileId,
          },
        ],
      }),
    );

    expect(duration).toBeGreaterThanOrEqual(48 * 60_000);
    expect(duration).toBeLessThanOrEqual(72 * 60_000);

    vi.useRealTimers();
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
              source: villageTileId,
            },
          ],
        }),
      ),
    ).toBe(0);
  });
});
