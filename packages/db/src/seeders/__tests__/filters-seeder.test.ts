import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  reportFilterNameByScope,
  reportListingFilterSchema,
  reportScopeSchema,
} from '@pillage-first/types/dtos/report';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('filtersSeeder', () => {
  test('filters contains every active report filter for each report filter group', () => {
    const filtersByName = database.selectObjects({
      sql: `
        SELECT name, JSON_GROUP_ARRAY(filter) AS filters_json
        FROM (
          SELECT name, filter
          FROM filters
          WHERE player_id = $player_id
          ORDER BY name, filter
        )
        GROUP BY name
        ORDER BY name;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({
        name: z.string(),
        filters_json: z
          .string()
          .transform((value) =>
            z.array(reportListingFilterSchema).parse(JSON.parse(value)),
          ),
      }),
    });

    expect(filtersByName).toStrictEqual(
      reportScopeSchema.options
        .map((scope) => ({
          name: reportFilterNameByScope[scope],
          filters_json: [...reportListingFilterSchema.options].sort(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  });

  test('filters contains all report filter group and filter combinations', () => {
    const filterCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM filters
        WHERE player_id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    })!;

    expect(filterCount).toBe(
      reportScopeSchema.options.length *
        reportListingFilterSchema.options.length,
    );
  });

  test('filters only contains modeled report filter group names', () => {
    const invalidNameCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM filters
        WHERE name NOT IN (SELECT value FROM JSON_EACH($names));
      `,
      bind: {
        $names: JSON.stringify(
          reportScopeSchema.options.map(
            (scope) => reportFilterNameByScope[scope],
          ),
        ),
      },
      schema: z.number(),
    })!;

    expect(invalidNameCount).toBe(0);
  });

  test('filters only contains modeled report filters', () => {
    const invalidFilterCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM filters
        WHERE filter NOT IN (SELECT value FROM JSON_EACH($filters));
      `,
      bind: { $filters: JSON.stringify(reportListingFilterSchema.options) },
      schema: z.number(),
    })!;

    expect(invalidFilterCount).toBe(0);
  });
});
