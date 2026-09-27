import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { reportListingFilterSchema } from '@pillage-first/types/dtos/report';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('reportFiltersSeeder', () => {
  test('report_filters contains every active report filter for player', () => {
    const filters = database.selectValues({
      sql: `
        SELECT filter
        FROM report_filters
        WHERE player_id = $player_id AND is_active = 1
        ORDER BY filter;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: reportListingFilterSchema,
    });

    expect(filters).toStrictEqual(
      [...reportListingFilterSchema.options].sort(),
    );
  });

  test('report_filters only contains modeled report filters', () => {
    const invalidFilterCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM report_filters
        WHERE filter NOT IN (SELECT value FROM JSON_EACH($filters));
      `,
      bind: { $filters: JSON.stringify(reportListingFilterSchema.options) },
      schema: z.number(),
    })!;

    expect(invalidFilterCount).toBe(0);
  });
});
