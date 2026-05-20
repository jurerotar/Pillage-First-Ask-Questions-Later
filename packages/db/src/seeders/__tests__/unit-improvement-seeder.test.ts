import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('unitImprovementSeeder', () => {
  test('upgradable units are seeded with level 0 for player', () => {
    const improvements = database.selectObjects({
      sql: 'SELECT level FROM unit_improvements WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({ level: z.number() }),
    });

    expect(improvements.length).toBeGreaterThan(0);
    expect(improvements.every((i) => i.level === 0)).toBe(true);
  });
});
