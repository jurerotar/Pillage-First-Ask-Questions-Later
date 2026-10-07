import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitImprovements } from '../unit-improvement-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('unit-improvement-controllers', () => {
  const playerId = PLAYER_ID;

  test('getUnitImprovements should return unit improvements for a player', async () => {
    const database = await prepareTestDatabase();

    database.exec({
      sql: `
        INSERT INTO unit_improvements (player_id, unit_id, level)
        VALUES ($player_id, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 3)
        ON CONFLICT(player_id, unit_id) DO UPDATE SET level = excluded.level;
      `,
      bind: { $player_id: playerId },
    });

    const improvements = getUnitImprovements(
      database,
      createControllerArgs<'/players/:playerId/unit-improvements'>({
        path: { playerId },
      }),
    );

    expect(improvements).toContainEqual({ unitId: 'LEGIONNAIRE', level: 3 });
  });
});
