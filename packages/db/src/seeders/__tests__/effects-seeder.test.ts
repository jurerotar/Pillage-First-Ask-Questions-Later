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
          AND type = 'base'
          AND scope = 'village'
          AND source = 'building'
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
          AND type = 'base'
          AND scope = 'village'
          AND source = 'troops'
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

  test('all effects have a non-zero value', () => {
    const zeroEffects = database.selectValue({
      sql: "SELECT COUNT(*) FROM effects WHERE value = 0 AND source != 'building';",
      schema: z.number(),
    });
    expect(zeroEffects).toBe(0);
  });
});
