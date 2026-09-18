import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import type { Resource } from '@pillage-first/types/models/resource';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import { getTilesWithBonuses } from '../oasis-bonus-finder-controllers';
import { createControllerArgs } from './utils/controller-args';

const occupiedTileRowSchema = z.strictObject({
  tile_id: z.number(),
});

type OasisBonus = {
  resource: Resource;
  bonus: 25 | 50;
};

type TestDatabase = Awaited<ReturnType<typeof prepareTestDatabase>>;

type SearchBody = {
  x: number;
  y: number;
  resourceFieldComposition: ResourceFieldComposition | 'any-cropper';
  bonuses: {
    firstOasis: OasisBonus[];
    secondOasis: OasisBonus[];
    thirdOasis: OasisBonus[];
  };
  showOccupiedTiles: boolean;
  onlyUseUnoccupiedOases: boolean;
};

const createSearchBody = (
  bonuses: SearchBody['bonuses'],
  resourceFieldComposition: SearchBody['resourceFieldComposition'] = 'any-cropper',
  overrides: Partial<
    Pick<SearchBody, 'showOccupiedTiles' | 'onlyUseUnoccupiedOases'>
  > = {},
): SearchBody => {
  return {
    x: 0,
    y: 0,
    resourceFieldComposition,
    bonuses,
    showOccupiedTiles: false,
    onlyUseUnoccupiedOases: true,
    ...overrides,
  };
};

const searchOasisBonuses = (database: TestDatabase, body: SearchBody) => {
  return getTilesWithBonuses(
    database,
    createControllerArgs<'/search/oases/by-bonus', 'post'>({ body }),
  );
};

const expectUniqueNearbyOases = (nearbyOases: Array<{ tileId: number }>) => {
  const oasisTileIds = nearbyOases.map(({ tileId }) => tileId);
  expect(new Set(oasisTileIds).size).toBe(oasisTileIds.length);
};

describe('oasis-bonus-finder-controllers', () => {
  test('getTilesWithBonuses should return nearby oasis for selected bonus searches', async () => {
    const database = await prepareTestDatabase();
    const selectedBonus = { resource: 'wheat', bonus: 50 } as const;

    const result = searchOasisBonuses(
      database,
      createSearchBody({
        firstOasis: [selectedBonus],
        secondOasis: [],
        thirdOasis: [],
      }),
    );

    expect(result.length).toBeGreaterThan(0);
    expect(
      result.some(({ nearbyOases }) => {
        return nearbyOases.length > 0;
      }),
    ).toBe(true);

    for (const { nearbyOases } of result) {
      expectUniqueNearbyOases(nearbyOases);
    }
  });

  test('getTilesWithBonuses should not use occupied oasis to satisfy requested bonus slots', async () => {
    const database = await prepareTestDatabase();

    database.exec({
      sql: `
        UPDATE oasis
        SET village_id = (SELECT id FROM villages LIMIT 1)
        WHERE resource_id = (SELECT id FROM resource_ids WHERE resource = 'wheat')
          AND bonus = 50;
      `,
    });

    const result = searchOasisBonuses(
      database,
      createSearchBody({
        firstOasis: [{ resource: 'wheat', bonus: 50 }],
        secondOasis: [],
        thirdOasis: [],
      }),
    );

    expect(result).toEqual([]);
  });

  test('getTilesWithBonuses should use occupied oasis when requested', async () => {
    const database = await prepareTestDatabase();

    database.exec({
      sql: `
        UPDATE oasis
        SET village_id = (SELECT id FROM villages LIMIT 1)
        WHERE resource_id = (SELECT id FROM resource_ids WHERE resource = 'wheat')
          AND bonus = 50;
      `,
    });

    const result = searchOasisBonuses(
      database,
      createSearchBody(
        {
          firstOasis: [{ resource: 'wheat', bonus: 50 }],
          secondOasis: [],
          thirdOasis: [],
        },
        'any-cropper',
        { onlyUseUnoccupiedOases: false },
      ),
    );

    expect(result.length).toBeGreaterThan(0);
  });

  test('getTilesWithBonuses should not return occupied village tiles as settlement candidates', async () => {
    const database = await prepareTestDatabase();
    const occupiedTile = database.selectObject({
      sql: `
        SELECT v.tile_id
        FROM villages v
        LIMIT 1;
      `,
      schema: occupiedTileRowSchema,
    })!;

    database.exec({
      sql: `
        UPDATE tiles
        SET
          type_id = (SELECT id FROM tile_type_ids WHERE type = 'free'),
          resource_field_composition_id = (
            SELECT id
            FROM resource_field_composition_ids
            WHERE resource_field_composition = '00018'
          )
        WHERE id = $tile_id;
      `,
      bind: {
        $tile_id: occupiedTile.tile_id,
      },
    });

    const result = searchOasisBonuses(
      database,
      createSearchBody(
        {
          firstOasis: [],
          secondOasis: [],
          thirdOasis: [],
        },
        '00018',
      ),
    );

    expect(result.map(({ tileId }) => tileId)).not.toContain(
      occupiedTile.tile_id,
    );
  });

  test('getTilesWithBonuses should return occupied village tiles when requested', async () => {
    const database = await prepareTestDatabase();
    const occupiedTile = database.selectObject({
      sql: `
        SELECT v.tile_id
        FROM villages v
        LIMIT 1;
      `,
      schema: occupiedTileRowSchema,
    })!;

    database.exec({
      sql: `
        UPDATE tiles
        SET
          type_id = (SELECT id FROM tile_type_ids WHERE type = 'free'),
          resource_field_composition_id = (
            SELECT id
            FROM resource_field_composition_ids
            WHERE resource_field_composition = '00018'
          )
        WHERE id = $tile_id;
      `,
      bind: {
        $tile_id: occupiedTile.tile_id,
      },
    });

    const result = searchOasisBonuses(
      database,
      createSearchBody(
        {
          firstOasis: [],
          secondOasis: [],
          thirdOasis: [],
        },
        '00018',
        { showOccupiedTiles: true },
      ),
    );

    const occupiedResult = result.find(({ tileId }) => {
      return tileId === occupiedTile.tile_id;
    });

    expect(occupiedResult?.ownerVillage).not.toBeNull();
  });

  test('getTilesWithBonuses should return nearby oasis when no bonus is selected', async () => {
    const database = await prepareTestDatabase();

    const result = searchOasisBonuses(
      database,
      createSearchBody({
        firstOasis: [],
        secondOasis: [],
        thirdOasis: [],
      }),
    );

    const rowsWithOases = result.filter(({ nearbyOases }) => {
      return nearbyOases.length > 0;
    });

    expect(result.length).toBeGreaterThan(0);
    expect(rowsWithOases.length).toBeGreaterThan(0);

    expect(
      rowsWithOases.some(({ nearbyOases }) => {
        return nearbyOases.some(({ isOccupied }) => isOccupied);
      }),
    ).toBe(true);
    expect(
      rowsWithOases.some(({ nearbyOases }) => {
        return nearbyOases.some(({ isOccupied }) => !isOccupied);
      }),
    ).toBe(true);

    for (const { nearbyOases } of rowsWithOases) {
      expectUniqueNearbyOases(nearbyOases);
    }
  });

  test('getTilesWithBonuses should find multi-slot bonus matches and dedupe nearby oasis', async () => {
    const database = await prepareTestDatabase();
    const selectedBonuses = [
      { resource: 'wheat', bonus: 50 },
      { resource: 'wood', bonus: 25 },
    ] as const;

    const result = searchOasisBonuses(
      database,
      createSearchBody({
        firstOasis: [selectedBonuses[0]],
        secondOasis: [selectedBonuses[1]],
        thirdOasis: [],
      }),
    );

    expect(result.length).toBeGreaterThan(0);

    for (const { nearbyOases } of result) {
      expectUniqueNearbyOases(nearbyOases);
    }
  });
});
