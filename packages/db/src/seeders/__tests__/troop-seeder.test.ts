import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { natureUnits } from '@pillage-first/game-assets/units';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('troopSeeder', () => {
  test('unoccupied oasis tiles have troops', () => {
    const withoutTroops = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          tiles t
        WHERE
          t.type = 'oasis'
          AND (
            SELECT MAX(o.village_id)
            FROM
              oasis o
            WHERE
              o.tile_id = t.id
            ) IS NULL
          AND NOT EXISTS
          (
            SELECT 1
            FROM
              troops tr
            WHERE
              tr.tile_id = t.id
            );
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
        SELECT COUNT(*)
        FROM
          troops tr
            JOIN tiles t ON t.id = tr.tile_id
            JOIN unit_ids ui ON ui.id = tr.unit_id
        WHERE
          t.type = 'oasis'
          AND (
            SELECT MAX(o.village_id)
            FROM
              oasis o
            WHERE
              o.tile_id = t.id
            ) IS NULL
          AND ui.unit NOT IN (${placeholders});
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
