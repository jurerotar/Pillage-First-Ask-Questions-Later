import { describe, expect, test } from 'vitest';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  getStorageBoundaryTime,
  getStorageDeliveries,
  type StorageDelivery,
} from '../storage-projection';

const hour = 3_600_000;

const delivery = (arrivesAt: number, amount: number): StorageDelivery => ({
  source: 'marketplace',
  arrivesAt,
  resources: [amount, amount, amount, amount],
});

describe('storage boundary forecasts', () => {
  test('fills from production when there are no deliveries', () => {
    expect(getStorageBoundaryTime('wood', 200, 1000, 100, [], 0)).toBe(
      8 * hour,
    );
  });

  test('waits for a delivery instead of treating incoming resources as already stored', () => {
    expect(
      getStorageBoundaryTime(
        'wood',
        200,
        1000,
        100,
        [delivery(3 * hour, 800)],
        0,
      ),
    ).toBe(3 * hour);
  });

  test('can fill before a scheduled delivery', () => {
    expect(
      getStorageBoundaryTime(
        'wood',
        900,
        1000,
        100,
        [delivery(3 * hour, 800)],
        0,
      ),
    ).toBe(hour);
  });

  test('discards unfinished production when a delivery arrives between ticks', () => {
    expect(
      getStorageBoundaryTime('wood', 0, 2, 1, [delivery(hour / 2, 1)], 0),
    ).toBe(1.5 * hour);
  });

  test('discards unfinished wheat consumption when a delivery arrives between ticks', () => {
    expect(
      getStorageBoundaryTime('wheat', 1, 10, -1, [delivery(hour / 2, 1)], 0),
    ).toBe(2.5 * hour);
  });

  test('restarts production at each delivery between ticks', () => {
    expect(
      getStorageBoundaryTime(
        'wood',
        0,
        3,
        1,
        [delivery(hour / 2, 1), delivery(0.75 * hour, 1)],
        0,
      ),
    ).toBe(1.75 * hour);
  });

  test('restarts production even when a delivery only contains another resource', () => {
    expect(
      getStorageBoundaryTime(
        'wood',
        0,
        2,
        1,
        [
          {
            source: 'marketplace',
            arrivesAt: hour / 2,
            resources: [0, 1, 0, 0],
          },
        ],
        0,
      ),
    ).toBe(2.5 * hour);
  });

  test('has no fill timer without production or sufficient deliveries', () => {
    expect(
      getStorageBoundaryTime('wood', 200, 1000, 0, [delivery(hour, 100)], 0),
    ).toBeNull();
    expect(
      getStorageBoundaryTime('wood', 200, 1000, 0, [delivery(hour, 800)], 0),
    ).toBe(hour);
  });

  test('incoming wheat delays depletion and overflow is discarded', () => {
    expect(
      getStorageBoundaryTime(
        'wheat',
        500,
        1000,
        -100,
        [delivery(hour, 2000)],
        0,
      ),
    ).toBe(11 * hour);
  });

  test('late wheat cannot prevent an earlier depletion', () => {
    expect(
      getStorageBoundaryTime(
        'wheat',
        100,
        1000,
        -100,
        [delivery(2 * hour, 500)],
        0,
      ),
    ).toBe(hour);
  });

  test('sorts arrivals and ignores elapsed events', () => {
    expect(
      getStorageBoundaryTime(
        'wheat',
        300,
        1000,
        -100,
        [delivery(3 * hour, 100), delivery(0, 900), delivery(2 * hour, 100)],
        hour,
      ),
    ).toBe(6 * hour);
  });

  test('handles already full and empty storage', () => {
    expect(getStorageBoundaryTime('wood', 1000, 1000, 100, [], hour)).toBe(
      hour,
    );
    expect(getStorageBoundaryTime('wheat', 0, 1000, -100, [], hour)).toBe(hour);
  });
});

describe('incoming storage deliveries', () => {
  test('converts scoped events and excludes empty loads and uncommitted merchant repeats', () => {
    const base = {
      id: 1,
      villageId: 1,
      startsAt: 0,
      duration: hour,
      resolvesAt: hour,
    };

    const gathering: GameEvent<'gatherersHutGatheringTrip'> = {
      ...base,
      type: 'gatherersHutGatheringTrip',
      troops: [{ unitId: 'PHALANX', amount: 10, tileId: 10, sourceTileId: 10 }],
    };

    const transfer: GameEvent<'resourceTransfer'> = {
      ...base,
      type: 'resourceTransfer',
      originTileId: 10,
      targetTileId: 10,
      targetVillageId: 1,
      resources: { wood: 100, clay: 200, iron: 300, wheat: 400 },
      merchantAmount: 1,
      repeatRemaining: 3,
      repeatResources: { wood: 100, clay: 200, iron: 300, wheat: 400 },
    };

    const returning: GameEvent<'troopMovementReturn'> = {
      ...base,
      type: 'troopMovementReturn',
      troops: [],
      originTileId: 20,
      targetTileId: 10,
      originalMovementType: 'troopMovementRaid',
      loot: [10, 20, 30, 40],
    };

    expect(
      getStorageDeliveries([
        gathering,
        transfer,
        returning,
        {
          ...transfer,
          targetTileId: 10,
          resources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
        },
        { ...returning, loot: undefined },
        { ...returning, loot: [0, 0, 0, 0] },
        { ...gathering, troops: [] },
      ]),
    ).toEqual([
      { source: 'gathering', arrivesAt: hour, resources: [10, 10, 10, 10] },
      {
        source: 'marketplace',
        arrivesAt: hour,
        resources: [100, 200, 300, 400],
      },
      { source: 'troops', arrivesAt: hour, resources: [10, 20, 30, 40] },
    ]);
  });
});
