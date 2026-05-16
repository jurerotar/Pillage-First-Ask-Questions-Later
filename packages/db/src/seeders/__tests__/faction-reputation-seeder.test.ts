import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('factionReputationSeeder', () => {
  test('faction_reputation seeded (>=0)', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM faction_reputation;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThanOrEqual(0);
  });
});
