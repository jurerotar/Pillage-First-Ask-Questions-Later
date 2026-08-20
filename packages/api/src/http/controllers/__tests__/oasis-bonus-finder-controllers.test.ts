import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  type Resource,
  resourceSchema,
} from '@pillage-first/types/models/resource';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import { getTilesWithBonuses } from '../oasis-bonus-finder-controllers';
import { createControllerArgs } from './utils/controller-args';

const oasisBonusRowSchema = z.strictObject({
  tile_id: z.number(),
  resource: resourceSchema,
  bonus: z.union([z.literal(25), z.literal(50)]),
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
};

const createSearchBody = (
  bonuses: SearchBody['bonuses'],
  resourceFieldComposition: SearchBody['resourceFieldComposition'] = 'any-cropper',
): SearchBody => {
  return {
    x: 0,
    y: 0,
    resourceFieldComposition,
    bonuses,
  };
};

const searchOasisBonuses = (database: TestDatabase, body: SearchBody) => {
  return getTilesWithBonuses(
    database,
    createControllerArgs<'/search/oases/by-bonus', 'post'>({ body }),
  );
};

const getOasisBonusKeysByTileId = (database: TestDatabase) => {
  const oasisBonusRows = database.selectObjects({
    sql: `
      SELECT o.tile_id, ri.resource, o.bonus
      FROM oasis o
             JOIN resource_ids ri ON ri.id = o.resource_id
      ORDER BY o.tile_id;
    `,
    schema: oasisBonusRowSchema,
  });

  return Map.groupBy(oasisBonusRows, ({ tile_id }) => tile_id);
};

const toBonusKey = ({ resource, bonus }: OasisBonus) => {
  return `${resource}-${bonus}`;
};

const expectUniqueOasisOwners = (
  oasisOwners: Array<{ oasisTileId: number }>,
) => {
  const oasisTileIds = oasisOwners.map(({ oasisTileId }) => oasisTileId);
  expect(new Set(oasisTileIds).size).toBe(oasisTileIds.length);
};

describe('oasis-bonus-finder-controllers', () => {
  test('getTilesWithBonuses should return owners only for selected matching oases', async () => {
    const database = await prepareTestDatabase();
    const oasisBonusKeysByTileId = getOasisBonusKeysByTileId(database);
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
      result.some(({ oasisOwners }) => {
        return oasisOwners.some(({ ownerVillage }) => ownerVillage !== null);
      }),
    ).toBe(true);

    for (const { oasisOwners } of result) {
      expectUniqueOasisOwners(oasisOwners);

      for (const { oasisTileId } of oasisOwners) {
        const oasisBonuses = oasisBonusKeysByTileId.get(oasisTileId) ?? [];
        const oasisBonusKeys = oasisBonuses.map(toBonusKey);

        expect(oasisBonusKeys).toContain(toBonusKey(selectedBonus));
      }
    }
  });

  test('getTilesWithBonuses should return nearby occupied oasis owners when no bonus is selected', async () => {
    const database = await prepareTestDatabase();

    const result = searchOasisBonuses(
      database,
      createSearchBody({
        firstOasis: [],
        secondOasis: [],
        thirdOasis: [],
      }),
    );

    const rowsWithOwners = result.filter(({ oasisOwners }) => {
      return oasisOwners.length > 0;
    });

    expect(result.length).toBeGreaterThan(0);
    expect(rowsWithOwners.length).toBeGreaterThan(0);

    for (const { oasisOwners } of rowsWithOwners) {
      expectUniqueOasisOwners(oasisOwners);

      for (const { ownerVillage } of oasisOwners) {
        expect(ownerVillage).not.toBeNull();
      }
    }
  });

  test('getTilesWithBonuses should preserve nullable owner village slugs', async () => {
    const database = await prepareTestDatabase();

    const result = searchOasisBonuses(
      database,
      createSearchBody({
        firstOasis: [],
        secondOasis: [],
        thirdOasis: [],
      }),
    );

    const ownedOasis = result
      .flatMap(({ oasisOwners }) => oasisOwners)
      .find(({ ownerVillage }) => ownerVillage !== null);

    expect(ownedOasis?.ownerVillage).not.toBeNull();
    expect(ownedOasis?.ownerVillage?.slug).toBeNull();
  });

  test('getTilesWithBonuses should return all selected slot owners and dedupe multi-slot owners', async () => {
    const database = await prepareTestDatabase();
    const oasisBonusKeysByTileId = getOasisBonusKeysByTileId(database);
    const selectedBonuses = [
      { resource: 'wheat', bonus: 50 },
      { resource: 'wood', bonus: 25 },
    ] as const;
    const selectedBonusKeys = selectedBonuses.map(toBonusKey);

    const result = searchOasisBonuses(
      database,
      createSearchBody({
        firstOasis: [selectedBonuses[0]],
        secondOasis: [selectedBonuses[1]],
        thirdOasis: [],
      }),
    );

    expect(result.length).toBeGreaterThan(0);

    for (const { oasisOwners } of result) {
      expectUniqueOasisOwners(oasisOwners);

      for (const { oasisTileId } of oasisOwners) {
        const oasisBonusKeys = (oasisBonusKeysByTileId.get(oasisTileId) ?? [])
          .map(toBonusKey)
          .filter((bonusKey) => selectedBonusKeys.includes(bonusKey));

        expect(oasisBonusKeys.length).toBeGreaterThan(0);
      }
    }

    expect(
      result.some(({ oasisOwners }) => {
        const matchedBonusKeys = new Set(
          oasisOwners.flatMap(({ oasisTileId }) => {
            return (oasisBonusKeysByTileId.get(oasisTileId) ?? [])
              .map(toBonusKey)
              .filter((bonusKey) => selectedBonusKeys.includes(bonusKey));
          }),
        );

        return selectedBonusKeys.every((bonusKey) => {
          return matchedBonusKeys.has(bonusKey);
        });
      }),
    ).toBe(true);
  });
});
