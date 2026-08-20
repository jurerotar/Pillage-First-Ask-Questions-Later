import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import {
  calculateTotalPopulationForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { resourceSchema } from '@pillage-first/types/models/resource';
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
        SELECT v.tile_id, bi.building AS building_id, bf.level
        FROM
          building_fields bf
            JOIN villages v ON v.id = bf.village_id
            JOIN building_ids bi ON bi.id = bf.building_id
        ORDER BY
          v.tile_id;
      `,
      schema: z.strictObject({
        tile_id: z.number(),
        building_id: buildingIdSchema,
        level: z.number(),
      }),
    });

    const tilePopulations = new Map<number, number>();
    for (const { tile_id, building_id, level } of buildingFields) {
      const def = getBuildingDefinition(building_id);
      const pop = calculateTotalPopulationForLevel(def.id, level);
      tilePopulations.set(tile_id, (tilePopulations.get(tile_id) ?? 0) + pop);
    }

    const effects = database.selectObjects({
      sql: `
        SELECT tile_id, value
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
        tile_id: z.number(),
        value: z.number(),
      }),
    });

    const effectValues = new Map(effects.map((e) => [e.tile_id, e.value]));

    for (const [tileId, population] of tilePopulations) {
      expect(effectValues.get(tileId)).toBe(-population);
    }
  });

  test('has troops-based wheatProduction matching troop wheat consumption (source_specifier IS NULL)', () => {
    const wheatEffectId = database.selectValue({
      sql: "SELECT id FROM effect_ids WHERE effect = 'wheatProduction';",
      schema: z.number(),
    })!;

    const troopRows = database.selectObjects({
      sql: `
        SELECT v.tile_id, ui.unit AS unit_id, tr.amount
        FROM
          troops AS tr
            JOIN unit_ids ui ON ui.id = tr.unit_id
            JOIN villages AS v ON tr.tile_id = v.tile_id;
      `,
      schema: z.strictObject({
        tile_id: z.number(),
        unit_id: unitIdSchema,
        amount: z.number(),
      }),
    });

    const tileTroopConsumption = new Map<number, number>();
    for (const { tile_id, unit_id, amount } of troopRows) {
      const { unitWheatConsumption } = getUnitDefinition(unit_id);
      tileTroopConsumption.set(
        tile_id,
        (tileTroopConsumption.get(tile_id) ?? 0) +
          unitWheatConsumption * amount,
      );
    }

    const effects = database.selectObjects({
      sql: `
        SELECT tile_id, value
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
        tile_id: z.number(),
        value: z.number(),
      }),
    });

    const effectValues = new Map(effects.map((e) => [e.tile_id, e.value]));

    for (const [tileId, consumption] of tileTroopConsumption) {
      expect(effectValues.get(tileId)).toBe(consumption);
    }
  });

  test('seeds oasis base resource effects without oasis bonus effects', () => {
    const oasisTileCount = database.selectValue({
      sql: 'SELECT COUNT(DISTINCT tile_id) FROM oasis;',
      schema: z.number(),
    })!;

    const oasisBaseEffects = database.selectValue({
      sql: "SELECT COUNT(*) FROM effects WHERE source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis') AND type_id = (SELECT id FROM effect_type_ids WHERE type = 'base');",
      schema: z.number(),
    });
    expect(oasisBaseEffects).toBe(oasisTileCount * 6);

    const oasisEffects = database.selectValue({
      sql: "SELECT COUNT(*) FROM effects WHERE source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis') AND type_id = (SELECT id FROM effect_type_ids WHERE type = 'bonus');",
      schema: z.number(),
    });
    expect(oasisEffects).toBe(0);
  });

  test('oasis base production effects match oasis type', () => {
    const oasisBonuses = database.selectObjects({
      sql: `
        SELECT o.tile_id, ri.resource, o.bonus
        FROM
          oasis o
            JOIN resource_ids ri ON ri.id = o.resource_id;
      `,
      schema: z.strictObject({
        tile_id: z.number(),
        resource: resourceSchema,
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
          AND ei.effect IN ('woodProduction', 'clayProduction', 'ironProduction', 'wheatProduction')
          AND e.tile_id = e.source_specifier;
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

  test('oasis storage effects match oasis resource limits', () => {
    const oasisLimits = database.selectObjects({
      sql: `
        SELECT
          tile_id,
          CASE
            WHEN MAX(bonus) = 50 OR COUNT(*) = 2 THEN 2000
            ELSE 1000
            END AS capacity
        FROM oasis
        GROUP BY tile_id;
      `,
      schema: z.strictObject({
        tile_id: z.number(),
        capacity: z.number(),
      }),
    });

    const oasisStorageEffects = database.selectObjects({
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
          AND ei.effect IN ('warehouseCapacity', 'granaryCapacity')
          AND e.tile_id = e.source_specifier;
      `,
      schema: z.strictObject({
        tile_id: z.number(),
        effect: z.enum(['warehouseCapacity', 'granaryCapacity']),
        value: z.number(),
      }),
    });

    const effectsByTileAndEffect = new Map<string, number>();
    for (const { tile_id, effect, value } of oasisStorageEffects) {
      effectsByTileAndEffect.set(`${tile_id}-${effect}`, value);
    }

    for (const { tile_id, capacity } of oasisLimits) {
      expect(effectsByTileAndEffect.get(`${tile_id}-warehouseCapacity`)).toBe(
        capacity,
      );
      expect(effectsByTileAndEffect.get(`${tile_id}-granaryCapacity`)).toBe(
        capacity,
      );
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
