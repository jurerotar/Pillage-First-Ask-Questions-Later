import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { units } from '@pillage-first/game-assets/units';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { effectIdSchema } from '@pillage-first/types/models/effect';
import { factionSchema } from '@pillage-first/types/models/faction';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('lookupTablesSeeder', () => {
  test('building_ids contains every modeled building exactly once', () => {
    const buildingIds = database.selectValues({
      sql: 'SELECT building FROM building_ids ORDER BY building;',
      schema: buildingIdSchema,
    });

    expect(buildingIds).toStrictEqual([...buildingIdSchema.options].sort());
  });

  test('faction_ids contains every modeled faction exactly once', () => {
    const factionIds = database.selectValues({
      sql: 'SELECT faction FROM faction_ids ORDER BY faction;',
      schema: factionSchema,
    });

    expect(factionIds).toStrictEqual([...factionSchema.options].sort());
  });

  test('tribe_ids contains every modeled tribe exactly once', () => {
    const tribeIds = database.selectValues({
      sql: 'SELECT tribe FROM tribe_ids ORDER BY tribe;',
      schema: tribeSchema,
    });

    expect(tribeIds).toStrictEqual([...tribeSchema.options].sort());
  });

  test('unit_ids contains every modeled unit exactly once', () => {
    const unitIds = database.selectValues({
      sql: 'SELECT unit FROM unit_ids ORDER BY unit;',
      schema: unitIdSchema,
    });

    expect(unitIds).toStrictEqual(units.map(({ id }) => id).sort());
  });

  test('effect_ids contains every modeled effect and keeps wheatProduction at id 1', () => {
    const effectIds = database.selectValues({
      sql: 'SELECT effect FROM effect_ids ORDER BY effect;',
      schema: effectIdSchema,
    });

    const wheatProductionId = database.selectValue({
      sql: "SELECT id FROM effect_ids WHERE effect = 'wheatProduction';",
      schema: z.number(),
    });

    expect(effectIds).toStrictEqual([...effectIdSchema.options].sort());
    expect(wheatProductionId).toBe(1);
  });
});
