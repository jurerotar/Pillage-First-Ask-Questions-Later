import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('developerSettingsSeeder', () => {
  test('developer_settings row exists with default values (all 0)', () => {
    const settings = database.selectObject({
      sql: `
        SELECT
          is_instant_building_construction_enabled,
          is_instant_unit_training_enabled,
          is_instant_unit_improvement_enabled,
          is_instant_unit_research_enabled,
          is_instant_unit_travel_enabled,
          is_free_building_construction_enabled,
          is_free_unit_training_enabled,
          is_free_unit_improvement_enabled,
          is_free_unit_research_enabled
        FROM
          developer_settings
        LIMIT 1;
      `,
      schema: z.strictObject({
        is_instant_building_construction_enabled: z.number(),
        is_instant_unit_training_enabled: z.number(),
        is_instant_unit_improvement_enabled: z.number(),
        is_instant_unit_research_enabled: z.number(),
        is_instant_unit_travel_enabled: z.number(),
        is_free_building_construction_enabled: z.number(),
        is_free_unit_training_enabled: z.number(),
        is_free_unit_improvement_enabled: z.number(),
        is_free_unit_research_enabled: z.number(),
      }),
    })!;

    expect(settings).toBeDefined();
    expect(settings.is_instant_building_construction_enabled).toBe(0);
    expect(settings.is_instant_unit_training_enabled).toBe(0);
    expect(settings.is_instant_unit_improvement_enabled).toBe(0);
    expect(settings.is_instant_unit_research_enabled).toBe(0);
    expect(settings.is_instant_unit_travel_enabled).toBe(0);
    expect(settings.is_free_building_construction_enabled).toBe(0);
    expect(settings.is_free_unit_training_enabled).toBe(0);
    expect(settings.is_free_unit_improvement_enabled).toBe(0);
    expect(settings.is_free_unit_research_enabled).toBe(0);
  });
});
