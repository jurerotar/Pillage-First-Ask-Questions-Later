import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { units } from '@pillage-first/game-assets/units';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import {
  effectIdSchema,
  effectScopeSchema,
  effectSourceSchema,
  effectTypeSchema,
} from '@pillage-first/types/models/effect';
import { factionSchema } from '@pillage-first/types/models/faction';
import { tileTypeSchema } from '@pillage-first/types/models/tile';
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

  test('effect attribute lookup tables contain every modeled value with stable ids', () => {
    const effectTypes = database.selectValues({
      sql: 'SELECT type FROM effect_type_ids ORDER BY type;',
      schema: effectTypeSchema,
    });
    const effectScopes = database.selectValues({
      sql: 'SELECT scope FROM effect_scope_ids ORDER BY scope;',
      schema: effectScopeSchema,
    });
    const effectSources = database.selectValues({
      sql: 'SELECT source FROM effect_source_ids ORDER BY source;',
      schema: effectSourceSchema,
    });

    const localScopeId = database.selectValue({
      sql: "SELECT id FROM effect_scope_ids WHERE scope = 'local';",
      schema: z.number(),
    });
    const buildingSourceId = database.selectValue({
      sql: "SELECT id FROM effect_source_ids WHERE source = 'building';",
      schema: z.number(),
    });

    expect(effectTypes).toStrictEqual([...effectTypeSchema.options].sort());
    expect(effectScopes).toStrictEqual([...effectScopeSchema.options].sort());
    expect(effectSources).toStrictEqual([...effectSourceSchema.options].sort());
    expect(localScopeId).toBe(2);
    expect(buildingSourceId).toBe(1);
  });

  test('tile_type_ids contains every modeled tile type with stable ids', () => {
    const tileTypes = database.selectValues({
      sql: 'SELECT type FROM tile_type_ids ORDER BY type;',
      schema: tileTypeSchema,
    });

    const freeTypeId = database.selectValue({
      sql: "SELECT id FROM tile_type_ids WHERE type = 'free';",
      schema: z.number(),
    });
    const oasisTypeId = database.selectValue({
      sql: "SELECT id FROM tile_type_ids WHERE type = 'oasis';",
      schema: z.number(),
    });

    expect(tileTypes).toStrictEqual([...tileTypeSchema.options].sort());
    expect(freeTypeId).toBe(1);
    expect(oasisTypeId).toBe(2);
  });
});
