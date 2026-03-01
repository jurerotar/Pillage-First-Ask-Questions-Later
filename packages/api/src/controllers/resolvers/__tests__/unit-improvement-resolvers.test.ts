import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Unit } from '@pillage-first/types/models/unit';
import { unitImprovementResolver } from '../unit-improvement-resolvers';

describe(unitImprovementResolver, () => {
  test('should increase unit improvement level', async () => {
    const database = await prepareTestDatabase();
    const unitId: Unit['id'] = 'LEGIONNAIRE';
    const villageId = 1;

    // Get player_id from village
    const { playerId } = database.selectObject({
      sql: 'SELECT player_id AS playerId FROM villages WHERE id = $village_id;',
      bind: { $village_id: villageId },
      schema: z.strictObject({ playerId: z.number() }),
    })!;

    // Ensure a row exists for unitId
    database.exec({
      sql: 'INSERT INTO unit_improvements (unit_id, level, player_id) VALUES ((SELECT id FROM unit_ids WHERE unit = $unit_id), 0, $player_id) ON CONFLICT DO NOTHING;',
      bind: { $unit_id: unitId, $player_id: playerId },
    });

    const mockEvent: GameEvent<'unitImprovement'> = {
      id: 2,
      type: 'unitImprovement',
      startsAt: 1000,
      duration: 500,
      resolvesAt: 1500,
      villageId,
      unitId,
      level: 1,
    };

    unitImprovementResolver(database, { ...mockEvent, id: 999 });

    const improvement = database.selectObject({
      sql: 'SELECT level FROM unit_improvements WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id);',
      bind: { $unit_id: unitId },
      schema: z.strictObject({ level: z.number() }),
    })!;

    expect(improvement.level).toBeGreaterThanOrEqual(1);
  });
});
