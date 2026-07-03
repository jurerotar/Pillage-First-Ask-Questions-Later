import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import {
  calculateTotalPopulationForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('effectsSeeder', () => {
  test('effect_ids seeded (>0)', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM effect_ids;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThan(0);
  });

  test('effects seeded (>0) and reference valid effect_ids', () => {
    const effectsCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM effects;',
      schema: z.number(),
    });
    expect(effectsCount).toBeGreaterThan(0);

    const invalid = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          effects e
            LEFT JOIN effect_ids ei ON ei.id = e.effect_id
        WHERE
          ei.id IS NULL;
      `,
      schema: z.number(),
    });
    expect(invalid).toBe(0);
  });

  test('has building-based wheatProduction matching population (source_specifier = 0)', () => {
    const wheatEffectId = database.selectValue({
      sql: "SELECT id FROM effect_ids WHERE effect = 'wheatProduction';",
      schema: z.number(),
    })!;

    const buildingFields = database.selectObjects({
      sql: `
        SELECT bf.village_id, bi.building AS building_id, bf.level
        FROM
          building_fields bf
            JOIN building_ids bi ON bi.id = bf.building_id
        ORDER BY
          bf.village_id;
      `,
      schema: z.strictObject({
        village_id: z.number(),
        building_id: buildingIdSchema,
        level: z.number(),
      }),
    });

    const villagePopulations = new Map<number, number>();
    for (const { village_id, building_id, level } of buildingFields) {
      const def = getBuildingDefinition(building_id);
      const pop = calculateTotalPopulationForLevel(def.id, level);
      villagePopulations.set(
        village_id,
        (villagePopulations.get(village_id) ?? 0) + pop,
      );
    }

    const effects = database.selectObjects({
      sql: `
        SELECT village_id, value
        FROM
          effects
        WHERE
          effect_id = $effect_id
          AND type_id = (SELECT id FROM effect_type_ids WHERE type = 'base')
          AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
          AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
          AND source_specifier = 0;
      `,
      bind: { $effect_id: wheatEffectId },
      schema: z.strictObject({
        village_id: z.number(),
        value: z.number(),
      }),
    });

    const effectValues = new Map(effects.map((e) => [e.village_id, e.value]));

    for (const [villageId, population] of villagePopulations) {
      expect(effectValues.get(villageId)).toBe(-population);
    }
  });

  test('has troops-based wheatProduction matching troop wheat consumption (source_specifier IS NULL)', () => {
    const wheatEffectId = database.selectValue({
      sql: "SELECT id FROM effect_ids WHERE effect = 'wheatProduction';",
      schema: z.number(),
    })!;

    const troopRows = database.selectObjects({
      sql: `
        SELECT v.id AS village_id, ui.unit AS unit_id, tr.amount
        FROM
          troops AS tr
            JOIN unit_ids ui ON ui.id = tr.unit_id
            JOIN villages AS v ON tr.tile_id = v.tile_id;
      `,
      schema: z.strictObject({
        village_id: z.number(),
        unit_id: unitIdSchema,
        amount: z.number(),
      }),
    });

    const villageTroopConsumption = new Map<number, number>();
    for (const { village_id, unit_id, amount } of troopRows) {
      const { unitWheatConsumption } = getUnitDefinition(unit_id);
      villageTroopConsumption.set(
        village_id,
        (villageTroopConsumption.get(village_id) ?? 0) +
          unitWheatConsumption * amount,
      );
    }

    const effects = database.selectObjects({
      sql: `
        SELECT village_id, value
        FROM
          effects
        WHERE
          effect_id = $effect_id
          AND type_id = (SELECT id FROM effect_type_ids WHERE type = 'base')
          AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
          AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'troops')
          AND source_specifier IS NULL;
      `,
      bind: { $effect_id: wheatEffectId },
      schema: z.strictObject({
        village_id: z.number(),
        value: z.number(),
      }),
    });

    const effectValues = new Map(effects.map((e) => [e.village_id, e.value]));

    for (const [villageId, consumption] of villageTroopConsumption) {
      expect(effectValues.get(villageId)).toBe(consumption);
    }
  });

  test('seeds oasis base production effects without oasis bonus effects', () => {
    const oasisTileCount = database.selectValue({
      sql: 'SELECT COUNT(DISTINCT tile_id) FROM oasis;',
      schema: z.number(),
    })!;

    const oasisBaseEffects = database.selectValue({
      sql: "SELECT COUNT(*) FROM effects WHERE source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis') AND type_id = (SELECT id FROM effect_type_ids WHERE type = 'base');",
      schema: z.number(),
    });
    expect(oasisBaseEffects).toBe(oasisTileCount * 4);

    const oasisEffects = database.selectValue({
      sql: "SELECT COUNT(*) FROM effects WHERE source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis') AND type_id = (SELECT id FROM effect_type_ids WHERE type = 'bonus');",
      schema: z.number(),
    });
    expect(oasisEffects).toBe(0);
  });

  test('oasis base production effects match oasis type', () => {
    const oasisBonuses = database.selectObjects({
      sql: `
        SELECT tile_id, resource, bonus
        FROM
          oasis;
      `,
      schema: z.strictObject({
        tile_id: z.number(),
        resource: z.enum(['wood', 'clay', 'iron', 'wheat']),
        bonus: z.number(),
      }),
    });

    const oasisEffects = database.selectObjects({
      sql: `
        SELECT
          e.source_specifier AS tile_id,
          ei.effect,
          e.value
        FROM
          effects e
            JOIN effect_ids ei ON ei.id = e.effect_id
        WHERE
          e.type_id = (SELECT id FROM effect_type_ids WHERE type = 'base')
          AND e.scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
          AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis')
          AND e.village_id IS NULL;
      `,
      schema: z.strictObject({
        tile_id: z.number(),
        effect: z.enum([
          'woodProduction',
          'clayProduction',
          'ironProduction',
          'wheatProduction',
        ]),
        value: z.number(),
      }),
    });

    const bonusesByTile = new Map<number, Map<string, number>>();
    for (const { tile_id, resource, bonus } of oasisBonuses) {
      const bonuses = bonusesByTile.get(tile_id) ?? new Map<string, number>();
      bonuses.set(resource, bonus);
      bonusesByTile.set(tile_id, bonuses);
    }

    const effectsByTileAndEffect = new Map<string, number>();
    for (const { tile_id, effect, value } of oasisEffects) {
      effectsByTileAndEffect.set(`${tile_id}-${effect}`, value);
    }

    const resources = ['wood', 'clay', 'iron', 'wheat'] as const;

    for (const [tileId, bonuses] of bonusesByTile) {
      for (const resource of resources) {
        const bonus = bonuses.get(resource);
        const expectedValue = bonus === 50 ? 80 : bonus === 25 ? 40 : 10;
        const actualValue = effectsByTileAndEffect.get(
          `${tileId}-${resource}Production`,
        );

        expect(actualValue).toBe(expectedValue);
      }
    }
  });

  test('all effects have a non-zero value', () => {
    const zeroEffects = database.selectValue({
      sql: 'SELECT COUNT(*) FROM effects WHERE value = 0 AND source_id != 1;',
      schema: z.number(),
    });
    expect(zeroEffects).toBe(0);
  });
});
