import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { natureUnits } from '@pillage-first/game-assets/units';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('troopSeeder', () => {
  test('unoccupied oasis tiles have troops', () => {
    const withoutTroops = database.selectValue({
      sql: `
        WITH unoccupied_oases AS (
          SELECT tile_id
          FROM oasis
          GROUP BY tile_id
          HAVING MAX(village_id) IS NULL
        )
        SELECT COUNT(*)
        FROM unoccupied_oases u
        LEFT JOIN troops tr ON tr.tile_id = u.tile_id
        WHERE tr.tile_id IS NULL;
      `,
      schema: z.number(),
    });
    expect(withoutTroops).toBe(0);
  });

  test('unoccupied oasis tiles only have nature troops', () => {
    const natureUnitIds = natureUnits.map(({ id }) => id);
    const placeholders = natureUnitIds.map(() => '?').join(',');

    const invalid = database.selectValue({
      sql: `
        WITH unoccupied_oases AS (
          SELECT tile_id
          FROM oasis
          GROUP BY tile_id
          HAVING MAX(village_id) IS NULL
        )
        SELECT COUNT(*)
        FROM troops tr
        JOIN unoccupied_oases u ON u.tile_id = tr.tile_id
        JOIN unit_ids ui ON ui.id = tr.unit_id
        WHERE
          ui.unit NOT IN (${placeholders});
      `,
      schema: z.number(),
    });

    expect(invalid).toBe(0);
  });

  test('troop amounts are positive', () => {
    const nonPositiveTroops = database.selectValue({
      sql: 'SELECT COUNT(*) FROM troops WHERE amount <= 0;',
      schema: z.number(),
    });
    expect(nonPositiveTroops).toBe(0);
  });
});
