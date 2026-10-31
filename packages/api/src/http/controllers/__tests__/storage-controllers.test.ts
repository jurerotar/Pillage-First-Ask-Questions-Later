import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { villageStorageDtoSchema } from '@pillage-first/types/dtos/village';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { insertEffectByEffectNameQuery } from '../../../queries/effect-queries';
import { insertEvents } from '../../../utils/events';
import { getVillageStorage } from '../storage-controllers';
import { createControllerArgs } from './utils/controller-args';

const hour = 3_600_000;
const now = 2_000_000_000_000;

const prepareVillage = (database: DbFacade) => {
  const village = database.selectObject({
    sql: 'SELECT id, tile_id AS tileId FROM villages ORDER BY id LIMIT 1;',
    schema: z.strictObject({ id: z.number(), tileId: z.number() }),
  })!;

  database.exec({ sql: 'DELETE FROM events;' });
  database.exec({ sql: 'DELETE FROM effects;' });

  const effects = {
    warehouseCapacity: 1000,
    granaryCapacity: 1000,
    woodProduction: 100,
    clayProduction: 0,
    ironProduction: 100,
    wheatProduction: -100,
  };

  for (const [effect, value] of Object.entries(effects)) {
    database.exec({
      sql: insertEffectByEffectNameQuery,
      bind: {
        $effect_name: effect,
        $value: value,
        $type: 'base',
        $scope: 'local',
        $source: 'building',
        $tile_id: village.tileId,
        $source_specifier: 1,
      },
    });
  }

  database.exec({
    sql: 'UPDATE resource_sites SET wood = 200, clay = 200, iron = 200, wheat = 200, updated_at = $updated_at WHERE tile_id = $tile_id;',
    bind: { $updated_at: now - 30_000, $tile_id: village.tileId },
  });
  return village;
};

const readStorage = (database: DbFacade, villageId: number) =>
  getVillageStorage(
    database,
    createControllerArgs<'/villages/:villageId/storage'>({
      path: { villageId },
    }),
  );

describe('village storage endpoint', () => {
  test('returns incoming totals and stable deadlines between production ticks without writing resources', async () => {
    using database = await prepareTestDatabase();
    const village = prepareVillage(database);
    using clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    const first = readStorage(database, village.id);

    expect(villageStorageDtoSchema.safeParse(first).success).toBe(true);
    expect(first.calculatedAt).toBe(now);
    expect(first.resources[0]).toStrictEqual({
      resource: 'wood',
      incoming: { gathering: 0, marketplace: 0, troops: 0 },
      fullAt: now - 30_000 + 8 * hour,
      emptyAt: null,
    });
    expect(first.resources[1].fullAt).toBeNull();
    expect(first.resources[3]).toMatchObject({
      fullAt: null,
      emptyAt: now - 30_000 + 2 * hour,
    });

    clock.mockReturnValue(now + 1000);
    const second = readStorage(database, village.id);

    expect(second.resources).toStrictEqual(first.resources);

    clock.mockReturnValue(now + 40_000);
    const later = readStorage(database, village.id);

    expect(later.resources[0].fullAt).toBe(first.resources[0].fullAt);
    expect(later.resources[3].emptyAt).toBe(first.resources[3].emptyAt);
    expect(
      database.selectValue({
        sql: 'SELECT updated_at FROM resource_sites WHERE tile_id = $tile_id;',
        bind: { $tile_id: village.tileId },
        schema: z.number(),
      }),
    ).toBe(now - 30_000);
  });

  test('aggregates all incoming sources, excluding outgoing, unrelated, elapsed and uncommitted deliveries', async () => {
    using database = await prepareTestDatabase();
    const village = prepareVillage(database);
    using _clock = vi.spyOn(Date, 'now').mockReturnValue(now);

    const other = database.selectObject({
      sql: 'SELECT id, tile_id AS tileId FROM villages WHERE id != $id LIMIT 1;',
      bind: { $id: village.id },
      schema: z.strictObject({ id: z.number(), tileId: z.number() }),
    })!;

    const base = {
      id: 1,
      villageId: village.id,
      startsAt: now,
      duration: hour,
      resolvesAt: now + hour,
    };

    const gathering: GameEvent<'gatherersHutGatheringTrip'> = {
      ...base,
      type: 'gatherersHutGatheringTrip',
      troops: [
        {
          unitId: 'PHALANX',
          amount: 10,
          tileId: village.tileId,
          sourceTileId: village.tileId,
        },
      ],
    };

    const transfer: GameEvent<'resourceTransfer'> = {
      ...base,
      villageId: other.id,
      type: 'resourceTransfer',
      originTileId: other.tileId,
      targetTileId: village.tileId,
      targetVillageId: village.id,
      resources: { wood: 800, clay: 0, iron: 0, wheat: 500 },
      merchantAmount: 1,
      repeatRemaining: 3,
      repeatResources: { wood: 800, clay: 0, iron: 0, wheat: 500 },
    };

    const returning: GameEvent<'troopMovementReturn'> = {
      ...base,
      type: 'troopMovementReturn',
      originTileId: other.tileId,
      targetTileId: village.tileId,
      troops: [],
      originalMovementType: 'troopMovementRaid',
      loot: [20, 30, 40, 50],
    };

    const events: GameEvent<
      | 'gatherersHutGatheringTrip'
      | 'resourceTransfer'
      | 'troopMovementReturn'
      | 'troopMovementRaid'
    >[] = [
      gathering,
      transfer,
      returning,
      { ...gathering, villageId: other.id },
      {
        ...transfer,
        villageId: village.id,
        targetVillageId: other.id,
        targetTileId: other.tileId,
      },
      { ...returning, targetTileId: other.tileId },
      { ...transfer, startsAt: now - 2 * hour },
      // Returning merchants carry no resources, even when repeats remain.
      { ...transfer, resources: { wood: 0, clay: 0, iron: 0, wheat: 0 } },
      { ...returning, loot: undefined },
      { ...returning, loot: [0, 0, 0, 0] },
      // Merchant resources are credited to the destination tile.
      { ...transfer, targetTileId: other.tileId },
      // Outbound raids do not have confirmed loot yet.
      {
        ...base,
        type: 'troopMovementRaid',
        originTileId: village.tileId,
        targetTileId: other.tileId,
        troops: gathering.troops,
      },
    ];

    insertEvents(database, events);

    const result = readStorage(database, village.id);

    expect(result.resources[0].incoming).toStrictEqual({
      gathering: 10,
      marketplace: 800,
      troops: 20,
    });
    expect(result.resources[1].incoming).toStrictEqual({
      gathering: 10,
      marketplace: 0,
      troops: 30,
    });
    expect(result.resources[3].incoming).toStrictEqual({
      gathering: 10,
      marketplace: 500,
      troops: 50,
    });
    expect(result.resources[0].fullAt).toBe(now + hour);
    // The arrivals discard the unfinished consumption tick and restart at now + hour.
    expect(result.resources[3].emptyAt).toBe(now + 7.6 * hour);
  });
});
