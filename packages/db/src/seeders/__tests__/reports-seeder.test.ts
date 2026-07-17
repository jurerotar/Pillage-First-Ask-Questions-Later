import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('reportsSeeder', () => {
  test('seeds 100 player battle reports', () => {
    const reportCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM reports r
        JOIN report_type_ids rt ON r.type_id = rt.id
        WHERE r.player_id = $player_id AND rt.report_type = 'battle';
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    expect(reportCount).toBe(100);
  });

  test('every seeded report has one battle with real tiles and combat result', () => {
    const invalidBattleCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM reports r
        LEFT JOIN battles b ON b.report_id = r.id
        LEFT JOIN tiles origin_t ON b.origin_tile_id = origin_t.id
        LEFT JOIN tiles target_t ON b.target_tile_id = target_t.id
        LEFT JOIN combat_result_ids cri ON b.combat_result_id = cri.id
        WHERE
          r.player_id = $player_id
          AND (
            b.id IS NULL
            OR origin_t.id IS NULL
            OR target_t.id IS NULL
            OR cri.id IS NULL
          );
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    expect(invalidBattleCount).toBe(0);
  });

  test('seeded battles include participants and unit rows', () => {
    const battleCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM battles;',
      schema: z.number(),
    });
    const battleCountWithParticipants = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM battles b
        WHERE (
          SELECT COUNT(*)
          FROM battle_participants bp
          WHERE bp.battle_id = b.id
        ) >= 2;
      `,
      schema: z.number(),
    });
    const battleCountWithUnits = database.selectValue({
      sql: `
        SELECT COUNT(DISTINCT b.id)
        FROM battles b
        JOIN battle_participants bp ON bp.battle_id = b.id
        JOIN battle_units bu ON bu.battle_participant_id = bp.id;
      `,
      schema: z.number(),
    });

    expect(battleCount).toBe(100);
    expect(battleCountWithParticipants).toBe(100);
    expect(battleCountWithUnits).toBe(100);
  });
});
