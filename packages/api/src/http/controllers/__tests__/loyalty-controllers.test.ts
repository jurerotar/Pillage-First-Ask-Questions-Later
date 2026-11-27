import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import {
  createTestVillage,
  prepareTestDatabase,
} from '@pillage-first/api/testing';
import {
  createBuildingDestructionEventMock,
  createBuildingLevelChangeEventMock,
} from '@pillage-first/mocks/event';
import { createBuildingPlaceholder } from '../../../utils/buildings';
import { createEvents } from '../../../utils/create-event';
import { adjustLoyalty, getLoyalty } from '../../../utils/loyalty';
import { buildingDestructionResolver } from '../../events/resolvers/building-destruction-resolver';
import { buildingLevelChangeResolver } from '../../events/resolvers/building-level-change-resolver';
import { getTileLoyalty } from '../loyalty-controllers';
import { createControllerArgs } from './utils/controller-args';

const serverCreatedAt = 1000;
const interval = 1_800_000;
const firstTick = serverCreatedAt + interval;
const secondTick = firstTick + interval;
const thirdTick = secondTick + interval;

describe('loyalty-controllers', () => {
  test('returns full loyalty and no countdown for a tile without a loyalty row', async () => {
    using database = await prepareTestDatabase();

    const result = getTileLoyalty(
      database,
      createControllerArgs<'/tiles/:tileId/loyalty'>({ path: { tileId: 1 } }),
    );

    expect(result).toMatchObject({ loyalty: 100, nextLoyaltyIncreaseAt: null });
  });

  test('applies the previous Residence level before an upgrade or demolition', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'UPDATE servers SET created_at = 1000, speed = 2;' });

    const { id: villageId, tileId } = createTestVillage(
      database,
      'Loyalty test',
      {
        resourceSite: { updatedAt: serverCreatedAt },
      },
    );
    const buildingId = 'RESIDENCE';
    const buildingFieldId = 20;
    createBuildingPlaceholder(database, villageId, buildingFieldId, buildingId);
    adjustLoyalty(database, tileId, -50, serverCreatedAt);

    buildingLevelChangeResolver.resolve(
      database,
      createBuildingLevelChangeEventMock({
        villageId,
        buildingFieldId,
        buildingId,
        previousLevel: 0,
        level: 1,
        resolvesAt: firstTick + 1,
      }),
      createEvents,
    );

    using _clock = vi.spyOn(Date, 'now').mockReturnValue(secondTick);

    expect(
      getTileLoyalty(
        database,
        createControllerArgs<'/tiles/:tileId/loyalty'>({ path: { tileId } }),
      ),
    ).toStrictEqual({
      loyalty: 53,
      nextLoyaltyIncreaseAt: thirdTick,
      loyaltyIncreaseInterval: interval,
      loyaltyIncreaseAmount: 2,
    });

    buildingDestructionResolver.resolve(
      database,
      createBuildingDestructionEventMock({
        villageId,
        buildingFieldId,
        buildingId,
        previousLevel: 1,
        resolvesAt: secondTick + 1,
      }),
      createEvents,
    );

    expect(getLoyalty(database, tileId, thirdTick)).toMatchObject({
      loyalty: 54,
      nextLoyaltyIncreaseAt: thirdTick + interval,
      loyaltyIncreaseAmount: 1,
    });
  });

  test('returns accrued loyalty and the next server tick for a tile without a Residence', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'UPDATE servers SET created_at = 1000, speed = 2;' });

    const tileId = database.selectValue({
      sql: 'SELECT id FROM tiles WHERE NOT EXISTS (SELECT 1 FROM villages WHERE tile_id = tiles.id) LIMIT 1;',
      schema: z.number(),
    })!;

    adjustLoyalty(database, tileId, -25, serverCreatedAt + 1);

    const args = createControllerArgs<'/tiles/:tileId/loyalty'>({
      path: { tileId },
    });
    using clock = vi.spyOn(Date, 'now').mockReturnValue(firstTick - 1);

    expect(getTileLoyalty(database, args)).toMatchObject({
      loyalty: 75,
      nextLoyaltyIncreaseAt: firstTick,
    });

    clock.mockReturnValue(secondTick + 1);

    expect(getTileLoyalty(database, args)).toStrictEqual({
      loyalty: 77,
      nextLoyaltyIncreaseAt: thirdTick,
      loyaltyIncreaseInterval: interval,
      loyaltyIncreaseAmount: 1,
    });
  });
});
