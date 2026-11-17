import { expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { createTrapperCageProductionEventMock } from '@pillage-first/mocks/event';
import { trapperCageProductionResolver } from '../trapper-resolvers';

test('trapper cage production creates one free cage per event', async () => {
  using database = await prepareTestDatabase();

  trapperCageProductionResolver(
    database,
    createTrapperCageProductionEventMock({
      id: 1,
      villageId: 1,
      amount: 4,
      startsAt: 1000,
      duration: 1000,
    }),
  );

  expect(
    database.selectObject({
      sql: 'SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE unit_id IS NULL) AS free FROM trapper_cages WHERE village_id = 1;',
      schema: z.strictObject({ total: z.number(), free: z.number() }),
    }),
  ).toStrictEqual({ total: 1, free: 1 });
});
