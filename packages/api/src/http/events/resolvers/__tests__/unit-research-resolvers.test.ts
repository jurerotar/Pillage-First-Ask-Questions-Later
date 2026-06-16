import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createUnitResearchEventMock } from '@pillage-first/mocks/event';
import type { Unit } from '@pillage-first/types/models/unit';
import { selectVillageResearchedUnitsQuery } from '../../../../queries/unit-queries';
import { unitResearchResolver } from '../unit-research-resolvers';

describe(unitResearchResolver, () => {
  test('should insert unit research record', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const unitId: Unit['id'] = 'LEGIONNAIRE';

    const mockEvent = createUnitResearchEventMock({
      id: 1,
      startsAt: 1000,
      duration: 500,
      villageId,
      unitId,
    });

    unitResearchResolver(database, mockEvent);

    const research = database
      .selectObjects({
        sql: selectVillageResearchedUnitsQuery,
        bind: { $village_id: villageId },
        schema: z.strictObject({
          unit_id: z.string(),
          village_id: z.number(),
        }),
      })
      .find((row) => row.unit_id === unitId);

    expect(research).toBeDefined();
  });
});
