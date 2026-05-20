import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('heroSeeder', () => {
  test('only the player has a hero', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM heroes;',
      schema: z.number(),
    });
    expect(c).toBe(1);

    const playerId = database.selectValue({
      sql: 'SELECT player_id FROM heroes;',
      schema: z.number(),
    });
    expect(playerId).toBe(PLAYER_ID);
  });

  test('attack_power is 100 for Romans and 80 for others', () => {
    const rows = database.selectObjects({
      sql: `
        SELECT ti.tribe, h.base_attack_power
        FROM
          heroes h
            JOIN players p ON h.player_id = p.id
            JOIN tribe_ids ti ON p.tribe_id = ti.id
      `,
      schema: z.strictObject({
        tribe: z.string(),
        base_attack_power: z.number(),
      }),
    });

    for (const row of rows) {
      if (row.tribe.toLowerCase() === 'romans') {
        expect(row.base_attack_power).toBe(100);
      } else {
        expect(row.base_attack_power).toBe(80);
      }
    }
  });

  test('hero stats are correctly seeded', () => {
    const rows = database.selectObjects({
      sql: `
        SELECT
          health_regeneration,
          damage_reduction,
          speed,
          natarian_attack_bonus,
          attack_bonus,
          defence_bonus
        FROM
          heroes
      `,
      schema: z.strictObject({
        health_regeneration: z.number(),
        damage_reduction: z.number(),
        speed: z.number(),
        natarian_attack_bonus: z.number(),
        attack_bonus: z.number(),
        defence_bonus: z.number(),
      }),
    });

    for (const row of rows) {
      expect(row.health_regeneration).toBe(10);
      expect(row.damage_reduction).toBe(0);
      expect(row.speed).toBe(6);
      expect(row.natarian_attack_bonus).toBe(0);
      expect(row.attack_bonus).toBe(0);
      expect(row.defence_bonus).toBe(0);
    }
  });

  test('selectable attributes are correctly seeded in the new table', () => {
    const rows = database.selectObjects({
      sql: 'SELECT attack_power, resource_production, attack_bonus, defence_bonus FROM hero_selectable_attributes',
      schema: z.strictObject({
        attack_power: z.number(),
        resource_production: z.number(),
        attack_bonus: z.number(),
        defence_bonus: z.number(),
      }),
    });

    for (const row of rows) {
      expect(row.attack_power).toBe(0);
      expect(row.resource_production).toBe(4);
      expect(row.attack_bonus).toBe(0);
      expect(row.defence_bonus).toBe(0);
    }
  });

  test('hero has a village_id', () => {
    const villageId = database.selectValue({
      sql: 'SELECT village_id FROM heroes;',
      schema: z.number(),
    });
    expect(villageId).toBeDefined();

    const villageExists = database.selectValue({
      sql: 'SELECT COUNT(*) FROM villages WHERE id = (SELECT village_id FROM heroes);',
      schema: z.number(),
    });
    expect(villageExists).toBe(1);
  });
});
