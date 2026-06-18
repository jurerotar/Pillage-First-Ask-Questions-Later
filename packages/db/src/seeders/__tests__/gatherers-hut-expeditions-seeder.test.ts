import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

describe('gatherersHutExpeditionsSeeder', () => {
  test('creates expedition state for player villages only', async () => {
    const database = await prepareTestDatabase();

    const expeditionStates = database.selectValue({
      sql: 'SELECT COUNT(*) FROM gatherers_hut_expeditions;',
      schema: z.number(),
    })!;

    const playerVillageCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM villages WHERE player_id = $player_id;',
      bind: {
        $player_id: PLAYER_ID,
      },
      schema: z.number(),
    })!;

    const nonPlayerExpeditionStates = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          gatherers_hut_expeditions ghe
          JOIN villages v ON v.id = ghe.village_id
        WHERE
          v.player_id != $player_id;
      `,
      bind: {
        $player_id: PLAYER_ID,
      },
      schema: z.number(),
    })!;

    expect(expeditionStates).toBe(playerVillageCount);
    expect(nonPlayerExpeditionStates).toBe(0);
  });
});
