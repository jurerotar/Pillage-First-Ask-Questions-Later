import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitsByTribe } from '@pillage-first/game-assets/utils/units';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('questsSeeder', () => {
  test('quests seeded (>=0)', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM quests;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThanOrEqual(0);
  });

  test('village building quests exist (WOODCUTTER oneOf)', () => {
    const count = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          quests
        WHERE
          village_id IS NOT NULL
          AND quest_id LIKE 'oneOf-WOODCUTTER-%';
      `,
      schema: z.number(),
    });
    expect(count).toBeGreaterThan(0);
  });

  test('global quests include troopCount, adventureCount, killCount, unitKillCount', () => {
    const troopCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          quests
        WHERE
          village_id IS NULL
          AND quest_id LIKE 'troopCount-%';
      `,
      schema: z.number(),
    });
    expect(troopCount).toBeGreaterThan(0);

    const adventureCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          quests
        WHERE
          village_id IS NULL
          AND quest_id LIKE 'adventureCount-%';
      `,
      schema: z.number(),
    });
    expect(adventureCount).toBeGreaterThan(0);

    const killCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          quests
        WHERE
          village_id IS NULL
          AND quest_id LIKE 'killCount-%';
      `,
      schema: z.number(),
    });
    expect(killCount).toBeGreaterThan(0);

    const unitKillCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          quests
        WHERE
          village_id IS NULL
          AND quest_id LIKE 'unitKillCount-%';
      `,
      schema: z.number(),
    });
    expect(unitKillCount).toBeGreaterThan(0);
  });

  test('unitTroopCount quests exist and only for the player tribe units', () => {
    const tribe = database.selectValue({
      sql: `
        SELECT ti.tribe
        FROM
          players p
            JOIN tribe_ids ti ON p.tribe_id = ti.id
        WHERE
          p.id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: tribeSchema,
    })!;

    const unitTroopCountQuests = database.selectValues({
      sql: `
        SELECT quest_id
        FROM
          quests
        WHERE
          village_id IS NULL
          AND quest_id LIKE 'unitTroopCount-%';
      `,
      schema: z.string(),
    });

    expect(unitTroopCountQuests.length).toBeGreaterThan(0);

    const unitsByTribe = getUnitsByTribe(tribe).filter(
      ({ id }) => !['SETTLER', 'CHIEF'].includes(id),
    );

    const allowedUnitIds = unitsByTribe.map(({ id }) => id);
    const allowed = new Set<UnitId>(allowedUnitIds);

    for (const qid of unitTroopCountQuests) {
      const [_, unitId] = qid.split('-');
      expect(allowed.has(unitId as UnitId)).toBe(true);
    }
  });

  test('tribal wall building quests exist for starting village', () => {
    const tribe = database.selectValue({
      sql: `
        SELECT ti.tribe
        FROM
          players p
            JOIN tribe_ids ti ON p.tribe_id = ti.id
        WHERE
          p.id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: tribeSchema,
    })!;

    const wallByTribe: Record<string, string> = {
      romans: 'ROMAN_WALL',
      gauls: 'GAUL_WALL',
      teutons: 'TEUTONIC_WALL',
      huns: 'HUN_WALL',
      egyptians: 'EGYPTIAN_WALL',
    };

    const wall = wallByTribe[tribe];

    const count = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          quests
        WHERE
          village_id IS NOT NULL
          AND quest_id = $qid;
      `,
      bind: { $qid: `oneOf-${wall}-1` },
      schema: z.number(),
    });

    expect(count).toBeGreaterThan(0);
  });

  test('every quest has a non-null quest_id', () => {
    const invalidQuests = database.selectValue({
      sql: 'SELECT COUNT(*) FROM quests WHERE quest_id IS NULL;',
      schema: z.number(),
    });
    expect(invalidQuests).toBe(0);
  });
});
