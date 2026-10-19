import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

describe('unitImprovementSeeder', () => {
  test('upgradable units are seeded with level 0 for player', async () => {
    using database = await prepareTestDatabase();

    const improvements = database.selectValues({
      sql: 'SELECT level FROM unit_improvements WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    expect(improvements.length).toBeGreaterThan(0);
    expect(improvements.every((i) => i === 0)).toBe(true);
  });
});
